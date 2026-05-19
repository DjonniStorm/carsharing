import { describe, expect, it, vi } from 'vitest';

import type { IJobQueue } from 'src/shared/background/job-queue.interface';
import type { IGeozoneRepository } from '../../../../geozone/repositories/geozone.repository.interface';
import type { IViolationService } from '../../../services/violation.service.interface';
import type { ICarTripSyncService } from '../../../../car/services/car-trip-sync.service.interface';
import type { ITripRepository } from '../../../../trip/repositories/trip.repository.interface';
import { ViolationBackgroundWorker } from '../../violation-background.worker';
import {
  ViolationJobName,
  type ParkingZoneCheckJob,
  type RentalMovementZoneCheckJob,
} from '../../violation-jobs';

type WorkerInternals = { tick: () => Promise<void> };

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const tripId = '33333333-3333-3333-3333-333333333333';
const geoZoneVersionId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

/**
 * Реальный ViolationBackgroundWorker: два разных job/scope (speeding vs wrong_parking),
 * чтобы dedupe одного scope не маскировал параллельность tick().
 */
describe('ViolationBackgroundWorker concurrent tick (unit)', () => {
  const rentalJob: RentalMovementZoneCheckJob = {
    tripId,
    recordedAt: '2026-05-09T15:00:00.000Z',
    lat: 55.75,
    lon: 37.61,
    speed: 200,
    fuelLevel: 50,
  };

  const parkingJob: ParkingZoneCheckJob = {
    tripId,
    recordedAt: '2026-05-09T15:01:00.000Z',
    lat: 55.76,
    lon: 37.62,
  };

  it('два tick без await: createViolation не выполняется параллельно (maxInFlight === 1)', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const create = vi.fn(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await delay(80);
      inFlight -= 1;
    });

    let dequeueCount = 0;
    const queue: IJobQueue = {
      dequeue: vi.fn(() => {
        dequeueCount += 1;
        if (dequeueCount === 1) {
          return {
            name: ViolationJobName.RentalMovementZoneCheck,
            payload: rentalJob,
            createdAtMs: Date.now(),
          };
        }
        if (dequeueCount === 2) {
          return {
            name: ViolationJobName.ParkingZoneCheck,
            payload: parkingJob,
            createdAtMs: Date.now(),
          };
        }
        return undefined;
      }),
      enqueue: vi.fn(),
    };

    const worker = new ViolationBackgroundWorker(
      queue,
      {
        isPointInsideVersion: vi.fn().mockResolvedValue(true),
        findIdsContainingPoint: vi.fn().mockResolvedValue([]),
      } as unknown as IGeozoneRepository,
      { create } as unknown as IViolationService,
      { recalcAvailabilityForTrip: vi.fn() } as unknown as ICarTripSyncService,
      {
        findById: vi.fn().mockResolvedValue({ geoZoneVersionId }),
      } as unknown as ITripRepository,
    );

    const tick = (worker as unknown as WorkerInternals).tick.bind(worker);
    await Promise.all([tick(), tick()]);

    expect(dequeueCount).toBe(2);
    expect(create).toHaveBeenCalledTimes(2);
    expect(maxInFlight).toBe(1);
  });
});
