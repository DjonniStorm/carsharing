import type { IGeozoneRepository } from '../../../geozone/repositories/geozone.repository.interface';
import { GeozoneType } from '../../../geozone/entities/geozone.type';
import type { ViolationConfig } from '../../common/violation.config';
import { ViolationStatus } from '../../entities/violation.status';
import type { ParkingZoneCheckJob } from '../violation-jobs';

/**
 * Финиш поездки: точка должна попадать в PARKING-геозону.
 *
 * Пример постановки джоба:
 * ```ts
 * jobQueue.enqueue({
 *   name: ViolationJobName.ParkingZoneCheck,
 *   payload: { tripId, recordedAt, lat, lon },
 *   createdAtMs: Date.now(),
 * });
 * ```
 */
export type ParkingZoneCheckHandlerDeps = {
  config: ViolationConfig;
  dedupeAllow: (scope: string) => boolean;
  geozoneRepository: Pick<IGeozoneRepository, 'findIdsContainingPoint'>;
  createViolation: (input: {
    tripId: string;
    type: ViolationStatus;
    description: string;
  }) => Promise<unknown>;
};

export async function executeParkingZoneCheck(
  input: ParkingZoneCheckJob,
  deps: ParkingZoneCheckHandlerDeps,
): Promise<void> {
  const { config: cfg } = deps;

  if (!deps.dedupeAllow(`wrong_parking:${input.tripId}`)) {
    return;
  }

  const zoneIds = await deps.geozoneRepository.findIdsContainingPoint({
    lon: input.lon,
    lat: input.lat,
    includeDeleted: false,
    types: [GeozoneType.PARKING],
  });
  if (zoneIds.length > 0) {
    return;
  }

  await deps.createViolation({
    tripId: input.tripId,
    type: ViolationStatus.WRONG_PARKING,
    description: `Финиш/пауза вне PARKING-зоны: lat=${input.lat}, lon=${input.lon}, at=${input.recordedAt}`,
  });
}
