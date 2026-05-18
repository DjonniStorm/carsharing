import type { TripRead } from "@/entities/trip";

import type { LiveTripOverlay } from "../model/live-trip-overlay";

export function mergeTripRead(
  base: TripRead,
  overlay: LiveTripOverlay | undefined,
): TripRead {
  if (!overlay) {
    return base;
  }
  return {
    ...base,
    status: overlay.status ?? base.status,
    finishedAt: overlay.finishedAt ?? base.finishedAt,
    distanceMeters: overlay.distanceMeters ?? base.distanceMeters,
    chargedMinutes: overlay.chargedMinutes ?? base.chargedMinutes,
    chargedKm: overlay.chargedKm ?? base.chargedKm,
    priceTime: overlay.priceTime ?? base.priceTime,
    priceDistance: overlay.priceDistance ?? base.priceDistance,
    pricePause: overlay.pricePause ?? base.pricePause,
    priceTotal: overlay.priceTotal ?? base.priceTotal,
  };
}
