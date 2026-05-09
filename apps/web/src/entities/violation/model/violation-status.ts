/** Совпадает с `ViolationStatus` на бэкенде (тип нарушения + служебные статусы). */
export enum ViolationStatus {
  SPEEDING = 1,
  OUT_OF_GEOZONE = 2,
  WRONG_PARKING = 3,
  LOW_FUEL = 4,
  RESOLVED = 5,
  IGNORED = 6,
  UNKNOWN = 7,
}
