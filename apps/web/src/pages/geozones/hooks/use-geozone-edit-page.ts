import { useTranslation } from "react-i18next";

import { useGeozoneFormFields } from "@/features/geozones/hooks/use-geozone-form-fields";
import { useGeozoneMapDraw } from "@/features/geozones/hooks/use-geozone-map-draw";
import { useGeozoneTariffPresets } from "@/features/geozones/hooks/use-geozone-tariff-presets";
import { LANG_KEYS } from "@/shared/i18n/keys";

import {
  useGeozoneEditHydration,
  useGeozoneEditInitialRefs,
} from "@/pages/geozones/hooks/use-geozone-edit-hydration";
import { useGeozoneEditLoad } from "@/pages/geozones/hooks/use-geozone-edit-load";
import { useGeozoneEditSave } from "@/pages/geozones/hooks/use-geozone-edit-save";

export function useGeozoneEditPage() {
  const { t } = useTranslation();
  const load = useGeozoneEditLoad();
  const form = useGeozoneFormFields();
  const map = useGeozoneMapDraw();
  const tariffs = useGeozoneTariffPresets({
    autoPickDefault: load.loadPhase === "ok",
  });
  const { initialMetaRef, initialVersionRef } = useGeozoneEditInitialRefs();

  useGeozoneEditHydration({
    hydration: load.hydration,
    form,
    map,
    tariffs,
    initialMetaRef,
    initialVersionRef,
  });

  const save = useGeozoneEditSave({
    geozoneId: load.geozoneId,
    loadPhase: load.loadPhase,
    form,
    map,
    tariffs,
    initialMetaRef,
    initialVersionRef,
  });

  const completePolygon = () => {
    map.completePolygon({
      onValidationError: () => {
        save.setFormError(t(LANG_KEYS.pages.geozonesCreatePolygonTooFewPoints));
      },
      onSuccess: () => {
        save.setFormError(null);
      },
    });
  };

  return {
    geozoneId: load.geozoneId,
    loadPhase: load.loadPhase,
    loadError: load.loadError,
    ...form,
    ...map,
    ...tariffs,
    ...save,
    completePolygon,
  };
}
