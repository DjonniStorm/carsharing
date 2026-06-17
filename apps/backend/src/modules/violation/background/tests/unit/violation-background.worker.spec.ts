import { describe, expect, it, vi } from 'vitest';

import type { IJobQueue } from 'src/shared/background/job-queue.interface';
import type { IGeozoneRepository } from '../../../../geozone/repositories/geozone.repository.interface';
import type { IViolationService } from '../../../services/violation.service.interface';
import type { ICarTripSyncService } from '../../../../car/services/car-trip-sync.service.interface';
import type { ITripRepository } from '../../../../trip/repositories/trip.repository.interface';
import { ViolationBackgroundWorker } from '../../violation-background.worker';
import { ViolationJobName } from '../../violation-jobs';

type WorkerInternals = { tick: () => Promise<void> };

/**
 * Очередь => tick; логика правил — в `handlers/tests/unit/*.handler.spec.ts`.
 */
describe('ViolationBackgroundWorker (очередь => tick)', () => {
  const tripId = '33333333-3333-3333-3333-333333333333';

  it('игнорирует неизвестное имя джоба и не вызывает violationService.create', async () => {
    const queue: IJobQueue = {
      dequeue: vi.fn().mockReturnValue({
        name: 'unknown.job',
        payload: {},
        createdAtMs: Date.now(),
      }),
      enqueue: vi.fn(),
    };

    const violationService: Pick<IViolationService, 'create'> = {
      create: vi.fn(),
    };

    const worker = new ViolationBackgroundWorker(
      queue,
      { findIdsContainingPoint: vi.fn() } as unknown as IGeozoneRepository,
      violationService as IViolationService,
      { recalcAvailabilityForTrip: vi.fn() } as unknown as ICarTripSyncService,
      { findById: vi.fn() } as unknown as ITripRepository,
    );

    await (worker as unknown as WorkerInternals).tick();

    expect(violationService.create).not.toHaveBeenCalled();
  });

  it('для RentalMovementZoneCheck вызывает isPointInsideVersion (точка вне => create)', async () => {
    const isPointInsideVersion = vi.fn().mockResolvedValue(false);
    const create = vi.fn().mockResolvedValue(undefined);
    const geoZoneVersionId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    const queue: IJobQueue = {
      dequeue: vi.fn().mockReturnValue({
        name: ViolationJobName.RentalMovementZoneCheck,
        payload: {
          tripId,
          recordedAt: '2026-05-09T15:00:00.000Z',
          lat: 55.75,
          lon: 37.61,
          speed: 40,
          fuelLevel: 50,
        },
        createdAtMs: Date.now(),
      }),
      enqueue: vi.fn(),
    };

    const worker = new ViolationBackgroundWorker(
      queue,
      { isPointInsideVersion } as unknown as IGeozoneRepository,
      { create } as unknown as IViolationService,
      { recalcAvailabilityForTrip: vi.fn() } as unknown as ICarTripSyncService,
      {
        findById: vi.fn().mockResolvedValue({ geoZoneVersionId }),
      } as unknown as ITripRepository,
    );

    await (worker as unknown as WorkerInternals).tick();

    expect(isPointInsideVersion).toHaveBeenCalled();
    expect(create).toHaveBeenCalled();
  });
});
