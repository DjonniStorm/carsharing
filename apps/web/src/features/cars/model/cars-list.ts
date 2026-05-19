import { action, atom, wrap } from "@reatom/core";

import type { CarRead } from "@/entities/car";
import { carsApi } from "@/features/cars/api";
import { resolveApiErrorMessage } from "@/shared/api";
import { LANG_KEYS } from "@/shared/i18n/keys";
import type { AsyncStatus } from "@/shared/model/async-status";
import { notifyApiError } from "@/shared/lib/notify-api-error";

export const carsListAtom = atom<CarRead[] | null>(null, "carsList");

export const carsListStatusAtom = atom<AsyncStatus>("idle", "carsListStatus");

export const carsListErrorAtom = atom<string | null>(null, "carsListError");

export const resetCarsListState = action(() => {
  carsListAtom.set(null);
  carsListStatusAtom.set("idle");
  carsListErrorAtom.set(null);
}, "resetCarsListState");

export const loadCarsList = action(async (includeDeleted = false) => {
  carsListStatusAtom.set("loading");
  carsListErrorAtom.set(null);
  try {
    const list = await wrap(carsApi.findAll(includeDeleted));
    carsListAtom.set(list);
    carsListStatusAtom.set("idle");
  } catch (e) {
    carsListStatusAtom.set("error");
    carsListErrorAtom.set(resolveApiErrorMessage(e));
    notifyApiError(LANG_KEYS.errors.loadFailed, e);
  }
}, "loadCarsList");
