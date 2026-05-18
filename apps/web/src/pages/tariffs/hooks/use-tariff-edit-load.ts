import { useAction, useAtom } from "@reatom/react";
import { useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  failTariffEditNotFound,
  loadTariffEditPage,
  resetTariffEditPage,
  tariffEditIsDeletedAtom,
  tariffEditLoadErrorAtom,
  tariffEditLoadPhaseAtom,
  tariffEditNameAtom,
  tariffEditPausePricePerMinuteAtom,
  tariffEditPricePerKmAtom,
  tariffEditPricePerMinuteAtom,
  tariffEditIsDefaultAtom,
  tariffEditSnapshotAtom,
} from "@/features/tariffs/model/tariff-edit-view";
import { LANG_KEYS } from "@/shared/i18n/keys";

export function useTariffEditLoad() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { tariffId?: string };
  const tariffId = params.tariffId ?? "";

  const [phase] = useAtom(tariffEditLoadPhaseAtom);
  const [loadErrorRaw] = useAtom(tariffEditLoadErrorAtom);
  const [isDeleted] = useAtom(tariffEditIsDeletedAtom);
  const [name, setName] = useAtom(tariffEditNameAtom);
  const [pricePerMinute, setPricePerMinute] = useAtom(tariffEditPricePerMinuteAtom);
  const [pricePerKm, setPricePerKm] = useAtom(tariffEditPricePerKmAtom);
  const [pausePricePerMinute, setPausePricePerMinute] = useAtom(
    tariffEditPausePricePerMinuteAtom,
  );
  const [isDefault, setIsDefault] = useAtom(tariffEditIsDefaultAtom);
  const [snapshot] = useAtom(tariffEditSnapshotAtom);

  const loadPage = useAction(loadTariffEditPage);
  const resetPage = useAction(resetTariffEditPage);
  const failNotFound = useAction(failTariffEditNotFound);

  const loadError =
    loadErrorRaw === "not_found"
      ? t(LANG_KEYS.pages.tariffsEditNotFound)
      : loadErrorRaw;

  useEffect(() => {
    if (!tariffId) {
      resetPage();
      failNotFound();
      return;
    }
    resetPage();
    void loadPage(tariffId);
    return () => {
      resetPage();
    };
  }, [tariffId, failNotFound, loadPage, resetPage]);

  return {
    tariffId,
    phase,
    loadError,
    isDeleted,
    name,
    setName,
    pricePerMinute,
    setPricePerMinute,
    pricePerKm,
    setPricePerKm,
    pausePricePerMinute,
    setPausePricePerMinute,
    isDefault,
    setIsDefault,
    snapshot,
  };
}
