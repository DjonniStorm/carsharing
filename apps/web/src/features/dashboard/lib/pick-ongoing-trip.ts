import type { TripRead } from "@/entities/trip";
import { TripStatus } from "@/entities/trip";

const ONGOING = new Set<TripStatus>([
  TripStatus.PENDING,
  TripStatus.STARTED,
  TripStatus.ACTIVE,
  TripStatus.PAUSED,
]);

/** Первая поездка из списка (ожидается сортировка по `startedAt desc`), которая ещё не завершена. */
export function pickOngoingTrip(trips: TripRead[]): TripRead | null {
  return trips.find((t) => ONGOING.has(t.status)) ?? null;
}
