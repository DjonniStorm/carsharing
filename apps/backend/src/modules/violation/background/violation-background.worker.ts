import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import {
  IJobQueueToken,
  type IJobQueue,
} from 'src/shared/background/job-queue.interface';
import { SerializedTickRunner } from 'src/shared/background/serialized-tick.runner';

import { Throttle } from 'src/shared/throttle/throttle';

import {
  IGeozoneRepositoryToken,
  type IGeozoneRepository,
} from '../../geozone/repositories/geozone.repository.interface';

import {
  IViolationServiceToken,
  type IViolationService,
} from '../services/violation.service.interface';

import { getViolationConfig } from '../common/violation.config';

import {
  ViolationJobName,
  type ParkingZoneCheckJob,
  type RentalMovementZoneCheckJob,
} from './violation-jobs';

import { executeParkingZoneCheck } from './handlers/parking-zone-check.handler';

import { executeRentalMovementZoneCheck } from './handlers/rental-movement-zone-check.handler';

import {
  ICarTripSyncServiceToken,
  type ICarTripSyncService,
} from '../../car/services/car-trip-sync.service.interface';
import {
  ITripRepositoryToken,
  type ITripRepository,
} from '../../trip/repositories/trip.repository.interface';

const TICK_INTERVAL_MS = 250;

@Injectable()
export class ViolationBackgroundWorker
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ViolationBackgroundWorker.name);

  private readonly dedupThrottle = new Throttle();

  private readonly tickRunner: SerializedTickRunner;

  /**
   * Пример того, как job попадает сюда:
   * // TelemetryService.create(...)
   * jobQueue.enqueue({
   *   name: ViolationJobName.RentalMovementZoneCheck,
   *   payload: { tripId, recordedAt, lat, lon, speed, fuelLevel },
   *   createdAtMs: Date.now(),
   * });
   */

  constructor(
    @Inject(IJobQueueToken)
    private readonly queue: IJobQueue,

    @Inject(IGeozoneRepositoryToken)
    private readonly geozoneRepository: IGeozoneRepository,

    @Inject(IViolationServiceToken)
    private readonly violationService: IViolationService,

    @Inject(ICarTripSyncServiceToken)
    private readonly carTripSync: ICarTripSyncService,

    @Inject(ITripRepositoryToken)
    private readonly tripRepository: ITripRepository,
  ) {
    this.tickRunner = new SerializedTickRunner(
      () => this.runOneJob(),
      (error) => this.logger.error('tick failed', error),
    );
  }

  onModuleInit(): void {
    this.tickRunner.startInterval(TICK_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    this.tickRunner.dispose();
  }

  /** @internal unit-тесты */
  private tick(): Promise<void> {
    return this.tickRunner.requestTick();
  }

  private async runOneJob(): Promise<void> {
    const job = this.queue.dequeue();

    if (!job) {
      return;
    }

    if (job.name === ViolationJobName.RentalMovementZoneCheck) {
      await this.handleRentalMovement(
        job.payload as RentalMovementZoneCheckJob,
      );
      return;
    }

    if (job.name === ViolationJobName.ParkingZoneCheck) {
      await this.handleParking(job.payload as ParkingZoneCheckJob);
      return;
    }

    this.logger.debug(`skip unknown job=${job.name}`);
  }

  private async handleRentalMovement(
    input: RentalMovementZoneCheckJob,
  ): Promise<void> {
    const cfg = getViolationConfig();

    await executeRentalMovementZoneCheck(input, {
      config: cfg,

      dedupeAllow: (scope) =>
        this.dedupThrottle.allow(scope, cfg.dedupWindowMs),

      geozoneRepository: this.geozoneRepository,

      findTripGeoZoneVersion: async (tripId) => {
        const trip = await this.tripRepository.findById(tripId);
        if (!trip) {
          return null;
        }
        return { geoZoneVersionId: trip.geoZoneVersionId };
      },

      createViolation: (dto) => this.violationService.create(dto),
    });
  }

  private async handleParking(input: ParkingZoneCheckJob): Promise<void> {
    const cfg = getViolationConfig();

    await executeParkingZoneCheck(input, {
      config: cfg,

      dedupeAllow: (scope) =>
        this.dedupThrottle.allow(scope, cfg.dedupWindowMs),

      geozoneRepository: this.geozoneRepository,

      createViolation: (dto) => this.violationService.create(dto),
    });

    try {
      await this.carTripSync.recalcAvailabilityForTrip(input.tripId);
    } catch (error) {
      this.logger.warn(
        `car availability recalc failed tripId=${input.tripId}`,
        error,
      );
    }
  }
}
