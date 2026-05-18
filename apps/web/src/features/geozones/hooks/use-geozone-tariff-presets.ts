import { useAction, useAtom } from "@reatom/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { TariffRead } from "@/entities/tariff";
import type { SelectOption } from "@/features/geozones/lib/geozone-form-present";
import { pickDefaultTariffPresetId } from "@/features/geozones/lib/pick-default-tariff-preset";
import {
  loadTariffsCatalog,
  tariffsCatalogAtom,
} from "@/features/tariffs/model/tariffs-state";

type Options = {
  /** When false, skip auto-pick of default preset (e.g. while page is loading). */
  autoPickDefault?: boolean;
};

export function useGeozoneTariffPresets(opts?: Options) {
  const autoPickDefault = opts?.autoPickDefault ?? true;
  const loadTariffs = useAction(loadTariffsCatalog);
  const [tariffsCatalog] = useAtom(tariffsCatalogAtom);
  const userChangedPresetRef = useRef(false);
  const [tariffPresetId, setTariffPresetId] = useState<string | null>(null);

  const tariffPresets = useMemo(() => {
    const list = tariffsCatalog ?? [];
    return list.filter((tariff) => !tariff.isDeleted);
  }, [tariffsCatalog]);

  const tariffPresetSelectData = useMemo((): SelectOption[] => {
    const fromApi = tariffPresets.map((tariff) => ({
      value: tariff.id,
      label: tariff.name,
    }));
    if (
      tariffPresetId !== null &&
      tariffPresetId !== "" &&
      !fromApi.some((option) => option.value === tariffPresetId)
    ) {
      return [{ value: tariffPresetId, label: tariffPresetId }, ...fromApi];
    }
    return fromApi;
  }, [tariffPresetId, tariffPresets]);

  const selectedTariffPreset = useMemo((): TariffRead | null => {
    return tariffPresets.find((tariff) => tariff.id === tariffPresetId) ?? null;
  }, [tariffPresets, tariffPresetId]);

  const onTariffPresetChange = useCallback((value: string | null) => {
    userChangedPresetRef.current = true;
    setTariffPresetId(value);
  }, []);

  const resetPresetTracking = useCallback(() => {
    userChangedPresetRef.current = false;
  }, []);

  useEffect(() => {
    void loadTariffs({ includeDeleted: false });
  }, [loadTariffs]);

  useEffect(() => {
    if (!autoPickDefault) {
      return;
    }
    if (userChangedPresetRef.current) {
      return;
    }
    if (tariffPresetId !== null) {
      return;
    }
    const id = pickDefaultTariffPresetId(tariffPresets);
    if (id) {
      setTariffPresetId(id);
    }
  }, [autoPickDefault, tariffPresetId, tariffPresets]);

  return {
    tariffPresetId,
    setTariffPresetId,
    onTariffPresetChange,
    tariffPresets,
    tariffPresetSelectData,
    selectedTariffPreset,
    userChangedPresetRef,
    resetPresetTracking,
  };
}
