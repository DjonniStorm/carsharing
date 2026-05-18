import { notifications } from "@mantine/notifications";
import { useAction } from "@reatom/react";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState, type MutableRefObject } from "react";
import { useTranslation } from "react-i18next";

import type {
  GeozoneUpdateBody,
  GeozoneVersionCreateBody,
} from "@/entities/geozone";
import { geozonesApi } from "@/features/geozones/api";
import type { useGeozoneFormFields } from "@/features/geozones/hooks/use-geozone-form-fields";
import type { useGeozoneMapDraw } from "@/features/geozones/hooks/use-geozone-map-draw";
import type { useGeozoneTariffPresets } from "@/features/geozones/hooks/use-geozone-tariff-presets";
import {
  firstGeozoneFormErrorMessage,
  parseGeozoneMetaForm,
  parseGeozoneTariffPresetId,
} from "@/features/geozones/lib/geozone-form-schema";
import { normalizeGeozoneColorHex } from "@/features/geozones/lib/geozone-form-present";
import {
  isValidClosedRing,
  ringToMultiPolygon,
} from "@/features/geozones/lib/geojson-ring";
import { parseGeozoneRulesJson } from "@/features/geozones/lib/parse-geozone-rules-json";
import type {
  GeozoneEditInitialMeta,
  GeozoneEditInitialVersion,
  GeozoneEditLoadPhase,
} from "@/features/geozones/model/geozone-edit-view";
import { loadGeozonesCatalog } from "@/features/geozones/model/geozones-state";
import { HttpApiError } from "@/shared/api/http-api-error";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

type FormFields = ReturnType<typeof useGeozoneFormFields>;
type MapDraw = ReturnType<typeof useGeozoneMapDraw>;
type TariffPresets = ReturnType<typeof useGeozoneTariffPresets>;

type Args = {
  geozoneId: string;
  loadPhase: GeozoneEditLoadPhase;
  form: FormFields;
  map: MapDraw;
  tariffs: TariffPresets;
  initialMetaRef: MutableRefObject<GeozoneEditInitialMeta | null>;
  initialVersionRef: MutableRefObject<GeozoneEditInitialVersion | null>;
};

export function useGeozoneEditSave({
  geozoneId,
  loadPhase,
  form,
  map,
  tariffs,
  initialMetaRef,
  initialVersionRef,
}: Args) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reloadCatalog = useAction(loadGeozonesCatalog);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { name, type, color, rulesJson } = form;
  const { closedRing } = map;
  const { tariffPresetId } = tariffs;

  const computeDirty = useCallback(() => {
    const initialMeta = initialMetaRef.current;
    const initialVersion = initialVersionRef.current;
    const colorNorm = normalizeGeozoneColorHex(color);

    let metaDirty = false;
    if (initialMeta) {
      metaDirty =
        name.trim() !== initialMeta.name ||
        type !== initialMeta.type ||
        colorNorm !== initialMeta.color;
    }

    let versionDirty = false;
    if (initialVersion) {
      const ringJson =
        closedRing && isValidClosedRing(closedRing)
          ? JSON.stringify(closedRing)
          : "";
      const rulesParsed = parseGeozoneRulesJson(rulesJson);
      const rulesNorm = rulesParsed.ok
        ? JSON.stringify(rulesParsed.value ?? null)
        : "__invalid__";

      const presetCurrent = tariffPresetId ?? null;
      const presetInitial = initialVersion.tariffPresetId ?? null;

      versionDirty =
        ringJson !== initialVersion.ringJson ||
        presetCurrent !== presetInitial ||
        rulesNorm !== initialVersion.rulesJson;
    }

    return { metaDirty, versionDirty };
  }, [
    closedRing,
    color,
    initialMetaRef,
    initialVersionRef,
    name,
    rulesJson,
    tariffPresetId,
    type,
  ]);

  const handleSave = useCallback(async () => {
    setFormError(null);

    if (!geozoneId || loadPhase !== "ok") {
      return;
    }

    const { metaDirty, versionDirty } = computeDirty();

    if (!metaDirty && !versionDirty) {
      notifications.show({
        message: t(LANG_KEYS.pages.geozonesEditNothingToSave),
        color: "blue",
      });
      return;
    }

    const initialMeta = initialMetaRef.current;

    if (metaDirty) {
      const metaParsed = parseGeozoneMetaForm({ name, type, color });
      if (!metaParsed.success) {
        setFormError(firstGeozoneFormErrorMessage(metaParsed));
        return;
      }
    }

    if (versionDirty) {
      const presetParsed = parseGeozoneTariffPresetId(tariffPresetId);
      if (!presetParsed.success) {
        setFormError(firstGeozoneFormErrorMessage(presetParsed));
        return;
      }
    }

    if (versionDirty) {
      const rulesParsed = parseGeozoneRulesJson(rulesJson);
      if (!rulesParsed.ok) {
        setFormError(t(LANG_KEYS.pages.geozonesCreateRulesInvalidJson));
        return;
      }
      if (!closedRing || !isValidClosedRing(closedRing)) {
        setFormError(t(LANG_KEYS.pages.geozonesCreateGeometryRequired));
        return;
      }
    }

    setSubmitting(true);
    try {
      if (metaDirty && initialMeta) {
        const patch: GeozoneUpdateBody = {};
        if (name.trim() !== initialMeta.name) {
          patch.name = name.trim();
        }
        if (type !== initialMeta.type) {
          patch.type = type;
        }
        const colorNorm = normalizeGeozoneColorHex(color);
        if (colorNorm !== initialMeta.color) {
          patch.color = colorNorm;
        }
        if (Object.keys(patch).length > 0) {
          await geozonesApi.update(geozoneId, patch);
        }
      }

      if (versionDirty) {
        const rulesParsed = parseGeozoneRulesJson(rulesJson);
        if (!rulesParsed.ok || !closedRing) {
          return;
        }
        const presetParsed = parseGeozoneTariffPresetId(tariffPresetId);
        if (!presetParsed.success) {
          return;
        }
        const pub: GeozoneVersionCreateBody = {
          geometry: ringToMultiPolygon(closedRing),
          rules: rulesParsed.value ?? null,
          tariffPresetId: presetParsed.data,
        };
        await geozonesApi.publishVersion(geozoneId, pub);
      }

      notifications.show({
        title: t(LANG_KEYS.pages.geozonesEditSuccess),
        message: name.trim(),
        color: "green",
      });
      void reloadCatalog();
      void navigate({ to: ROUTES.dashboard.geozones });
    } catch (error) {
      const msg =
        error instanceof HttpApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : String(error);
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    closedRing,
    color,
    computeDirty,
    geozoneId,
    initialMetaRef,
    loadPhase,
    name,
    navigate,
    reloadCatalog,
    rulesJson,
    t,
    tariffPresetId,
    type,
  ]);

  return {
    submitting,
    formError,
    setFormError,
    handleSave,
  };
}
