import type { IGeozoneRepository } from '../../../geozone/repositories/geozone.repository.interface';
import type { ViolationConfig } from '../../common/violation.config';
import { ViolationStatus } from '../../entities/violation.status';
import type { RentalMovementZoneCheckJob } from '../violation-jobs';

export type TripGeoZoneVersionLookup = {
  geoZoneVersionId: string;
} | null;

/**
 * Зависимости хендлера — всё инжектится снаружи (воркер подставляет throttle и сервисы).
 */
export type RentalMovementZoneCheckHandlerDeps = {
  config: ViolationConfig;
  /** Дедуп по ключу вида `speeding:${tripId}` — см. `Throttle`. */
  dedupeAllow: (scope: string) => boolean;
  geozoneRepository: Pick<IGeozoneRepository, 'isPointInsideVersion'>;
  findTripGeoZoneVersion: (tripId: string) => Promise<TripGeoZoneVersionLookup>;
  createViolation: (input: {
    tripId: string;
    type: ViolationStatus;
    description: string;
  }) => Promise<unknown>;
};

/**
 * Обработка телеметрии в поездке: скорость, топливо, выезд за контур версии геозоны поездки.
 */
export async function executeRentalMovementZoneCheck(
  input: RentalMovementZoneCheckJob,
  deps: RentalMovementZoneCheckHandlerDeps,
): Promise<void> {
  const { config: cfg } = deps;

  if (
    input.speed > cfg.speedLimitKmh &&
    deps.dedupeAllow(`speeding:${input.tripId}`)
  ) {
    await deps.createViolation({
      tripId: input.tripId,
      type: ViolationStatus.SPEEDING,
      description: `Превышение скорости: speed=${input.speed} limit=${cfg.speedLimitKmh} at=${input.recordedAt}`,
    });
  }

  if (
    input.fuelLevel < cfg.lowFuelThreshold &&
    deps.dedupeAllow(`low_fuel:${input.tripId}`)
  ) {
    await deps.createViolation({
      tripId: input.tripId,
      type: ViolationStatus.LOW_FUEL,
      description: `Низкий уровень топлива: fuel=${input.fuelLevel} threshold=${cfg.lowFuelThreshold} at=${input.recordedAt}`,
    });
  }

  if (!deps.dedupeAllow(`out_of_geozone:${input.tripId}`)) {
    return;
  }

  const trip = await deps.findTripGeoZoneVersion(input.tripId);
  if (!trip?.geoZoneVersionId) {
    return;
  }

  const inside = await deps.geozoneRepository.isPointInsideVersion(
    trip.geoZoneVersionId,
    input.lon,
    input.lat,
  );
  if (inside) {
    return;
  }

  await deps.createViolation({
    tripId: input.tripId,
    type: ViolationStatus.OUT_OF_GEOZONE,
    description: `Точка вне геозоны поездки (version=${trip.geoZoneVersionId}): lat=${input.lat}, lon=${input.lon}, at=${input.recordedAt}`,
  });
}
