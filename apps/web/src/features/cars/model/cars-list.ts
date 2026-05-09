import { action, atom, wrap } from "@reatom/core";

import type { CarRead } from "@/entities/car";
import { carsApi } from "@/features/cars/api";
import type { AsyncStatus } from "@/shared/model/async-status";

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
    carsListErrorAtom.set(e instanceof Error ? e.message : String(e));
  }
}, "loadCarsList");
