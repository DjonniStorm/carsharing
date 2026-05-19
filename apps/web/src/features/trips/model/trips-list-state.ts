import { action, atom, wrap } from "@reatom/core";

import type { TripRead } from "@/entities/trip";
import { tripsApi } from "@/features/trips/api";
import { sortTripsByStartedDesc } from "@/features/trips/lib/trips-list-filters";

import { resolveApiErrorMessage } from "@/shared/api";
import type { AsyncStatus } from "@/shared/model/async-status";

export const tripsAdminListAtom = atom<TripRead[] | null>(
  null,
  "tripsAdminList",
);

export const tripsAdminListStatusAtom = atom<AsyncStatus>(
  "idle",
  "tripsAdminListStatus",
);

export const tripsAdminListErrorAtom = atom<string | null>(
  null,
  "tripsAdminListError",
);

export const resetTripsAdminListState = action(() => {
  tripsAdminListAtom.set(null);
  tripsAdminListStatusAtom.set("idle");
  tripsAdminListErrorAtom.set(null);
}, "resetTripsAdminListState");

export const loadTripsAdminList = action(async () => {
  tripsAdminListStatusAtom.set("loading");
  tripsAdminListErrorAtom.set(null);
  try {
    const list = await wrap(tripsApi.findAll({}));
    tripsAdminListAtom.set(sortTripsByStartedDesc(list));
    tripsAdminListStatusAtom.set("idle");
  } catch (error) {
    tripsAdminListStatusAtom.set("error");
    tripsAdminListErrorAtom.set(resolveApiErrorMessage(error));
  }
}, "loadTripsAdminList");
