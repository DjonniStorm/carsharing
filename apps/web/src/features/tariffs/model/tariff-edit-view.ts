import { action, atom, wrap } from "@reatom/core";

import { tariffsApi } from "@/features/tariffs/api";
import { HttpApiError, resolveApiErrorMessage } from "@/shared/api";

export type TariffEditSnapshot = {
  name: string;
  pricePerMinute: number;
  pricePerKm: number;
  pausePricePerMinute: number;
  isDefault: boolean;
};

export type TariffEditLoadPhase = "loading" | "ok" | "error";

export const tariffEditLoadPhaseAtom = atom<TariffEditLoadPhase>(
  "loading",
  "tariffEditLoadPhase",
);

export const tariffEditLoadErrorAtom = atom<string | null>(
  null,
  "tariffEditLoadError",
);

export const tariffEditIsDeletedAtom = atom(false, "tariffEditIsDeleted");

export const tariffEditNameAtom = atom("", "tariffEditName");

export const tariffEditPricePerMinuteAtom = atom<number | string>(
  0,
  "tariffEditPricePerMinute",
);

export const tariffEditPricePerKmAtom = atom<number | string>(
  0,
  "tariffEditPricePerKm",
);

export const tariffEditPausePricePerMinuteAtom = atom<number | string>(
  0,
  "tariffEditPausePricePerMinute",
);

export const tariffEditIsDefaultAtom = atom(false, "tariffEditIsDefault");

export const tariffEditSnapshotAtom = atom<TariffEditSnapshot | null>(
  null,
  "tariffEditSnapshot",
);

let tariffEditLoadSeq = 0;

export const resetTariffEditPage = action(() => {
  tariffEditLoadPhaseAtom.set("loading");
  tariffEditLoadErrorAtom.set(null);
  tariffEditIsDeletedAtom.set(false);
  tariffEditNameAtom.set("");
  tariffEditPricePerMinuteAtom.set(0);
  tariffEditPricePerKmAtom.set(0);
  tariffEditPausePricePerMinuteAtom.set(0);
  tariffEditIsDefaultAtom.set(false);
  tariffEditSnapshotAtom.set(null);
  tariffEditLoadSeq += 1;
}, "resetTariffEditPage");

export const failTariffEditNotFound = action(() => {
  tariffEditLoadPhaseAtom.set("error");
  tariffEditLoadErrorAtom.set("not_found");
}, "failTariffEditNotFound");

export const loadTariffEditPage = action(async (tariffId: string) => {
  const seq = ++tariffEditLoadSeq;
  tariffEditLoadPhaseAtom.set("loading");
  tariffEditLoadErrorAtom.set(null);

  try {
    const row = await wrap(tariffsApi.findById(tariffId));
    if (seq !== tariffEditLoadSeq) {
      return;
    }
    tariffEditIsDeletedAtom.set(row.isDeleted);
    tariffEditNameAtom.set(row.name);
    tariffEditPricePerMinuteAtom.set(row.pricePerMinute);
    tariffEditPricePerKmAtom.set(row.pricePerKm);
    tariffEditPausePricePerMinuteAtom.set(row.pausePricePerMinute);
    tariffEditIsDefaultAtom.set(row.isDefault);
    tariffEditSnapshotAtom.set({
      name: row.name.trim(),
      pricePerMinute: row.pricePerMinute,
      pricePerKm: row.pricePerKm,
      pausePricePerMinute: row.pausePricePerMinute,
      isDefault: row.isDefault,
    });
    tariffEditLoadPhaseAtom.set("ok");
  } catch (e) {
    if (seq !== tariffEditLoadSeq) {
      return;
    }
    const msg =
      e instanceof HttpApiError && e.status === 404
        ? "not_found"
        : resolveApiErrorMessage(e);
    tariffEditLoadErrorAtom.set(msg);
    tariffEditLoadPhaseAtom.set("error");
  }
}, "loadTariffEditPage");
