import { action, atom, wrap } from "@reatom/core";

import type { GeozoneRead } from "@/entities/geozone";
import type { TripHistoryFullRead } from "@/entities/trip";
import { tripHistoryApi } from "@/features/trips/api";
import { resolveTripGeozoneForMap } from "@/features/trips/lib/resolve-trip-geozone-for-map";
import { HttpApiError } from "@/shared/api/http-api-error";
import type { AsyncStatus } from "@/shared/model/async-status";

/** HTTP-ошибка с сохранённым статусом — нужен на странице, чтобы решить редирект на `/error`. */
export type TripHistoryViewError = {
  status?: number;
  message: string;
};

export const tripHistoryFullAtom = atom<TripHistoryFullRead | null>(
  null,
  "tripHistoryFull",
);

export const tripHistoryFullStatusAtom = atom<AsyncStatus>(
  "idle",
  "tripHistoryFullStatus",
);

export const tripHistoryFullErrorAtom = atom<TripHistoryViewError | null>(
  null,
  "tripHistoryFullError",
);

export const tripHistoryFullLoadedTripIdAtom = atom<string | null>(
  null,
  "tripHistoryFullLoadedTripId",
);

export const tripGeozoneForMapAtom = atom<GeozoneRead | null>(
  null,
  "tripGeozoneForMap",
);

export const tripGeozoneForMapStatusAtom = atom<AsyncStatus>(
  "idle",
  "tripGeozoneForMapStatus",
);

export const resetTripHistoryView = action(() => {
  tripHistoryFullAtom.set(null);
  tripHistoryFullStatusAtom.set("idle");
  tripHistoryFullErrorAtom.set(null);
  tripHistoryFullLoadedTripIdAtom.set(null);
  tripGeozoneForMapAtom.set(null);
  tripGeozoneForMapStatusAtom.set("idle");
}, "resetTripHistoryView");

export const loadTripHistoryFull = action(async (tripId: string) => {
  tripHistoryFullStatusAtom.set("loading");
  tripHistoryFullErrorAtom.set(null);
  tripHistoryFullLoadedTripIdAtom.set(tripId);
  try {
    const res = await wrap(tripHistoryApi.getFull(tripId));
    tripHistoryFullAtom.set(res);
    tripHistoryFullStatusAtom.set("idle");
  } catch (e) {
    tripHistoryFullAtom.set(null);
    tripHistoryFullStatusAtom.set("error");
    if (e instanceof HttpApiError) {
      tripHistoryFullErrorAtom.set({ status: e.status, message: e.message });
    } else {
      tripHistoryFullErrorAtom.set({
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }
}, "loadTripHistoryFull");

export const loadTripGeozoneForMap = action(
  async (geoZoneVersionId: string | null | undefined) => {
    if (!geoZoneVersionId?.trim()) {
      tripGeozoneForMapAtom.set(null);
      tripGeozoneForMapStatusAtom.set("idle");
      return;
    }
    tripGeozoneForMapStatusAtom.set("loading");
    try {
      const z = await wrap(resolveTripGeozoneForMap(geoZoneVersionId));
      tripGeozoneForMapAtom.set(z);
      tripGeozoneForMapStatusAtom.set("idle");
    } catch {
      tripGeozoneForMapAtom.set(null);
      tripGeozoneForMapStatusAtom.set("error");
    }
  },
  "loadTripGeozoneForMap",
);
