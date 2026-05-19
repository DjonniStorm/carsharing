export interface ICarTripSyncService {
  assertCarAvailableForNewTrip(carId: string): Promise<void>;

  onTripStarted(carId: string, tripId: string): Promise<void>;

  onTripFinished(tripId: string): Promise<void>;

  onTripCancelled(carId: string): Promise<void>;

  /** Пересчёт статуса/доступности по нарушениям. */
  recalcAvailabilityForTrip(tripId: string): Promise<void>;

  /** Live-топливо из телеметрии. */
  syncLiveFuel(carId: string, fuelLevel: number): Promise<void>;
}

export const ICarTripSyncServiceToken = Symbol('ICarTripSyncService');
