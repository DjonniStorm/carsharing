export enum TripStatus {
  PENDING = 0,
  STARTED = 1,
  ACTIVE = 2,
  PAUSED = 3,
  FINISHED = 4,
  CANCELLED = 5,
  ERROR = 6,
  UNKNOWN = 7,
}

/** Статусы незавершённой поездки (H11, partial unique index в БД). */
export const ONGOING_TRIP_STATUSES: TripStatus[] = [
  TripStatus.PENDING,
  TripStatus.STARTED,
  TripStatus.ACTIVE,
  TripStatus.PAUSED,
];
