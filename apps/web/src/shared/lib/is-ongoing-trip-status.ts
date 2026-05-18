import { TripStatus } from "@/entities/trip";

const ONGOING = new Set<TripStatus>([
  TripStatus.PENDING,
  TripStatus.STARTED,
  TripStatus.ACTIVE,
  TripStatus.PAUSED,
]);

export function isOngoingTripStatus(status: TripStatus): boolean {
  return ONGOING.has(status);
}

export function isTerminalTripStatus(status: TripStatus): boolean {
  return (
    status === TripStatus.FINISHED ||
    status === TripStatus.CANCELLED ||
    status === TripStatus.ERROR
  );
}
