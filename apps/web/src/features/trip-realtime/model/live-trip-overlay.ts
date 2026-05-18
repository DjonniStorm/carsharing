import { action, atom } from "@reatom/core";

import { TripStatus, type TripStatus as TripStatusType } from "@/entities/trip";
import { isTerminalTripStatus } from "@/shared/lib/is-ongoing-trip-status";

import type {
  TripFinishedPayload,
  TripMetricsUpdatedPayload,
  TripStateChangedPayload,
} from "./ws-envelope";

export type LiveTripOverlay = {
  status?: TripStatusType;
  finishedAt?: string | null;
  distanceMeters?: number | null;
  chargedMinutes?: number | null;
  chargedKm?: number | null;
  priceTime?: number | null;
  priceDistance?: number | null;
  pricePause?: number | null;
  priceTotal?: number | null;
  updatedAt: string;
};

/** tripId, на которые UI подписан через WS (`subscribe.trip`). */
export const tripRealtimeWatchAtom = atom<ReadonlySet<string>>(
  new Set(),
  "tripRealtimeWatch",
);

export const liveTripOverlayAtom = atom<Record<string, LiveTripOverlay>>(
  {},
  "liveTripOverlay",
);

const metricsThrottleMsByTrip = new Map<string, number>();
const METRICS_UI_THROTTLE_MS = 150;

function patchOverlay(
  tripId: string,
  patch: Partial<LiveTripOverlay>,
): void {
  const prev = liveTripOverlayAtom();
  const current = prev[tripId];
  liveTripOverlayAtom.set({
    ...prev,
    [tripId]: {
      ...current,
      ...patch,
      updatedAt: patch.updatedAt ?? current?.updatedAt ?? new Date().toISOString(),
    },
  });
}

export const registerTripWatch = action((tripId: string) => {
  const next = new Set(tripRealtimeWatchAtom());
  next.add(tripId);
  tripRealtimeWatchAtom.set(next);
}, "registerTripWatch");

export const unregisterTripWatch = action((tripId: string) => {
  const next = new Set(tripRealtimeWatchAtom());
  next.delete(tripId);
  tripRealtimeWatchAtom.set(next);
}, "unregisterTripWatch");

export const clearLiveTripOverlay = action((tripId?: string) => {
  if (tripId === undefined) {
    liveTripOverlayAtom.set({});
    metricsThrottleMsByTrip.clear();
    return;
  }
  const prev = liveTripOverlayAtom();
  if (!(tripId in prev)) {
    return;
  }
  const next = { ...prev };
  delete next[tripId];
  liveTripOverlayAtom.set(next);
  metricsThrottleMsByTrip.delete(tripId);
}, "clearLiveTripOverlay");

export const resetTripRealtimeState = action(() => {
  tripRealtimeWatchAtom.set(new Set());
  liveTripOverlayAtom.set({});
  metricsThrottleMsByTrip.clear();
}, "resetTripRealtimeState");

export const applyTripMetricsFromWs = action(
  (payload: TripMetricsUpdatedPayload) => {
    const watched = tripRealtimeWatchAtom();
    if (!watched.has(payload.tripId)) {
      return;
    }
    const now = Date.now();
    const last = metricsThrottleMsByTrip.get(payload.tripId) ?? 0;
    if (now - last < METRICS_UI_THROTTLE_MS) {
      return;
    }
    metricsThrottleMsByTrip.set(payload.tripId, now);

    patchOverlay(payload.tripId, {
      distanceMeters: payload.distanceMeters,
      chargedMinutes: payload.chargedMinutes,
      chargedKm: payload.chargedKm,
      priceTime: payload.priceTime,
      priceDistance: payload.priceDistance,
      pricePause: payload.pricePause,
      priceTotal: payload.priceTotal,
      updatedAt: payload.ts,
    });
  },
  "applyTripMetricsFromWs",
);

export const applyTripStateFromWs = action(
  (payload: TripStateChangedPayload) => {
    const watched = tripRealtimeWatchAtom();
    if (!watched.has(payload.tripId)) {
      return;
    }

    patchOverlay(payload.tripId, {
      status: payload.status,
      updatedAt: payload.ts,
    });

    if (isTerminalTripStatus(payload.status)) {
      unregisterTripWatch(payload.tripId);
    }
  },
  "applyTripStateFromWs",
);

export const applyTripFinishedFromWs = action(
  (payload: TripFinishedPayload) => {
    const watched = tripRealtimeWatchAtom();
    if (!watched.has(payload.tripId)) {
      return;
    }

    patchOverlay(payload.tripId, {
      status: TripStatus.FINISHED,
      finishedAt: payload.finishedAt,
      distanceMeters: payload.distanceMeters,
      chargedMinutes: payload.chargedMinutes,
      chargedKm: payload.chargedKm,
      priceTotal: payload.priceTotal,
      updatedAt: payload.ts,
    });

    unregisterTripWatch(payload.tripId);
  },
  "applyTripFinishedFromWs",
);
