import type { TFunction } from "i18next";

import { TripStatus } from "@/entities/trip";
import { tripStatusLangKey } from "@/features/trips/lib/trip-status-lang-key";

export type TripStatusSelectOption = { value: string; label: string };

export const TRIP_STATUSES_ORDERED: TripStatus[] = [
  TripStatus.PENDING,
  TripStatus.STARTED,
  TripStatus.ACTIVE,
  TripStatus.PAUSED,
  TripStatus.FINISHED,
  TripStatus.CANCELLED,
  TripStatus.ERROR,
];

export function isTripOngoing(status: TripStatus): boolean {
  return (
    status === TripStatus.PENDING ||
    status === TripStatus.STARTED ||
    status === TripStatus.ACTIVE ||
    status === TripStatus.PAUSED
  );
}

export function buildTripStatusSelectData(
  t: TFunction,
  statuses: TripStatus[] = TRIP_STATUSES_ORDERED,
): TripStatusSelectOption[] {
  return statuses.map((s) => ({
    value: String(s),
    label: t(tripStatusLangKey(s)),
  }));
}
