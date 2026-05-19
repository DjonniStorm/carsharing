import { useEffect, useRef, type MutableRefObject } from "react";

import type { useGeozoneFormFields } from "@/features/geozones/hooks/use-geozone-form-fields";
import type { useGeozoneMapDraw } from "@/features/geozones/hooks/use-geozone-map-draw";
import type { useGeozoneTariffPresets } from "@/features/geozones/hooks/use-geozone-tariff-presets";
import type {
  GeozoneEditHydration,
  GeozoneEditInitialMeta,
  GeozoneEditInitialVersion,
} from "@/features/geozones/model/geozone-edit-view";

type FormFields = ReturnType<typeof useGeozoneFormFields>;
type MapDraw = ReturnType<typeof useGeozoneMapDraw>;
type TariffPresets = ReturnType<typeof useGeozoneTariffPresets>;

type Args = {
  hydration: GeozoneEditHydration | null;
  form: FormFields;
  map: MapDraw;
  tariffs: TariffPresets;
  initialMetaRef: MutableRefObject<GeozoneEditInitialMeta | null>;
  initialVersionRef: MutableRefObject<GeozoneEditInitialVersion | null>;
};

export function useGeozoneEditHydration({
  hydration,
  form,
  map,
  tariffs,
  initialMetaRef,
  initialVersionRef,
}: Args) {
  const { applyFromHydration } = form;
  const { setClosedRingFromHydration } = map;
  const { setTariffPresetId, resetPresetTracking } = tariffs;

  useEffect(() => {
    if (!hydration) {
      return;
    }
    initialMetaRef.current = hydration.meta;
    initialVersionRef.current = hydration.version;
    applyFromHydration(hydration);
    setClosedRingFromHydration(hydration.closedRing);
    setTariffPresetId(hydration.tariffPresetId);
    resetPresetTracking();
  }, [
    applyFromHydration,
    hydration,
    initialMetaRef,
    initialVersionRef,
    resetPresetTracking,
    setClosedRingFromHydration,
    setTariffPresetId,
  ]);
}

export function useGeozoneEditInitialRefs() {
  const initialMetaRef = useRef<GeozoneEditInitialMeta | null>(null);
  const initialVersionRef = useRef<GeozoneEditInitialVersion | null>(null);
  return { initialMetaRef, initialVersionRef };
}
