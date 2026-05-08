import type { IGeozoneRepository } from '../../../geozone/repositories/geozone.repository.interface';
import { GeozoneType } from '../../../geozone/entities/geozone.type';
import type { ViolationConfig } from '../../common/violation.config';
import { ViolationStatus } from '../../entities/violation.status';
import type { RentalMovementZoneCheckJob } from '../violation-jobs';

/**
 * Зависимости хендлера — всё инжектится снаружи (воркер подставляет throttle и сервисы).
 *
 * Пример вызова из воркера:
 * ```ts
 * await executeRentalMovementZoneCheck(payload, {
 *   config: getViolationConfig(),
 *   dedupeAllow: (scope) => this.dedupThrottle.allow(scope, config.dedupWindowMs),
 *   geozoneRepository: this.geozoneRepository,
 *   createViolation: (dto) => this.violationService.create(dto),
 * });
 * ```
 */
export type RentalMovementZoneCheckHandlerDeps = {
  config: ViolationConfig;
  /** Дедуп по ключу вида `speeding:${tripId}` — см. `Throttle`. */
  dedupeAllow: (scope: string) => boolean;
  geozoneRepository: Pick<IGeozoneRepository, 'findIdsContainingPoint'>;
  createViolation: (input: {
    tripId: string;
    type: ViolationStatus;
    description: string;
  }) => Promise<unknown>;
};

/**
 * Обработка телеметрии в поездке: скорость, топливо, попадание точки в RENTAL-геозону.
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

  const zoneIds = await deps.geozoneRepository.findIdsContainingPoint({
    lon: input.lon,
    lat: input.lat,
    includeDeleted: false,
    types: [GeozoneType.RENTAL],
  });
  if (zoneIds.length > 0) {
    return;
  }

  await deps.createViolation({
    tripId: input.tripId,
    type: ViolationStatus.OUT_OF_GEOZONE,
    description: `Точка вне RENTAL-зоны: lat=${input.lat}, lon=${input.lon}, at=${input.recordedAt}`,
  });
}
