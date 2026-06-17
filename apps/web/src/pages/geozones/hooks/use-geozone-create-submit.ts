import { notifications } from "@mantine/notifications";
import { useAction, useAtom } from "@reatom/react";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import type { GeozoneCreateBody } from "@/entities/geozone";
import { authUserAtom } from "@/features/auth/model/session";
import { geozonesApi } from "@/features/geozones/api";
import type { useGeozoneFormFields } from "@/features/geozones/hooks/use-geozone-form-fields";
import type { useGeozoneMapDraw } from "@/features/geozones/hooks/use-geozone-map-draw";
import type { useGeozoneTariffPresets } from "@/features/geozones/hooks/use-geozone-tariff-presets";
import {
  GEOZONE_PARKING_ZERO_PRICING,
  isParkingGeozone,
} from "@/features/geozones/lib/geozone-pricing";
import {
  isValidClosedRing,
  ringToMultiPolygon,
} from "@/features/geozones/lib/geojson-ring";
import {
  firstGeozoneFormErrorMessage,
  parseGeozoneMetaForm,
  parseGeozoneTariffPresetId,
} from "@/features/geozones/lib/geozone-form-schema";
import { parseGeozoneRulesJson } from "@/features/geozones/lib/parse-geozone-rules-json";
import { loadGeozonesCatalog } from "@/features/geozones/model/geozones-state";
import { resolveApiErrorMessage } from "@/shared/api";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

type FormFields = ReturnType<typeof useGeozoneFormFields>;
type MapDraw = ReturnType<typeof useGeozoneMapDraw>;
type TariffPresets = ReturnType<typeof useGeozoneTariffPresets>;

type Args = {
  form: FormFields;
  map: MapDraw;
  tariffs: TariffPresets;
};

export function useGeozoneCreateSubmit({ form, map, tariffs }: Args) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user] = useAtom(authUserAtom);
  const reloadCatalog = useAction(loadGeozonesCatalog);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setFormError(null);

    if (!user?.id?.trim()) {
      setFormError(t(LANG_KEYS.pages.geozonesCreateAuthRequired));
      return;
    }

    const { name, type, color, rulesJson } = form;
    const { closedRing } = map;
    const { tariffPresetId } = tariffs;

    const metaParsed = parseGeozoneMetaForm({ name, type, color });
    if (!metaParsed.success) {
      setFormError(firstGeozoneFormErrorMessage(metaParsed));
      return;
    }

    const parkingZone = isParkingGeozone(metaParsed.data.type);
    const presetParsed = parkingZone
      ? null
      : parseGeozoneTariffPresetId(tariffPresetId);
    if (presetParsed && !presetParsed.success) {
      setFormError(firstGeozoneFormErrorMessage(presetParsed));
      return;
    }

    if (!closedRing || !isValidClosedRing(closedRing)) {
      setFormError(t(LANG_KEYS.pages.geozonesCreateGeometryRequired));
      return;
    }

    const rulesParsed = parseGeozoneRulesJson(rulesJson);
    if (!rulesParsed.ok) {
      setFormError(
        rulesParsed.message ??
          t(LANG_KEYS.pages.geozonesCreateRulesInvalidJson),
      );
      return;
    }

    const body: GeozoneCreateBody = {
      name: metaParsed.data.name,
      type: metaParsed.data.type,
      color: metaParsed.data.color,
      geometry: ringToMultiPolygon(closedRing),
      createdByUserId: user.id,
    };

    if (parkingZone) {
      Object.assign(body, GEOZONE_PARKING_ZERO_PRICING);
    } else if (presetParsed?.success) {
      body.tariffPresetId = presetParsed.data;
    }

    if (rulesParsed.value !== null) {
      body.rules = rulesParsed.value;
    }

    setSubmitting(true);
    try {
      await geozonesApi.create(body);
      notifications.show({
        title: t(LANG_KEYS.pages.geozonesCreateSuccessTitle),
        message: body.name,
        color: "green",
      });
      void reloadCatalog();
      void navigate({ to: ROUTES.dashboard.geozones });
    } catch (error) {
      setFormError(resolveApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }, [form, map, navigate, reloadCatalog, t, tariffs, user?.id]);

  return {
    user,
    submitting,
    formError,
    setFormError,
    handleSubmit,
  };
}
