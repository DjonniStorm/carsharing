import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  ICarTripSyncServiceToken,
  type ICarTripSyncService,
} from 'src/modules/car/services/car-trip-sync.service.interface';

import { UserRole } from 'src/modules/user/entities/user.role';
import {
  IJobQueueToken,
  type IJobQueue,
} from 'src/shared/background/job-queue.interface';
import { ViolationJobName } from 'src/modules/violation/background/violation-jobs';
import { TripDbErrors } from '../common/db-errors';
import {
  TripNotFoundException,
  TripPublishFailedException,
} from '../common/errors';
import { TripHistoryMapper } from '../common/trip-history.mapper';
import { TripMapper } from '../common/mapper';
import {
  TripHistoryRead,
  type TripHistoryShortInfoRead,
} from '../entities/dtos/trip.history.read';
import { TripCreate } from '../entities/dtos/trip.create';
import { TripRead } from '../entities/dtos/trip.read';
import { TripUpdate } from '../entities/dtos/trip.update';
import { TripEntity } from '../entities/trip.entity';
import { TripStatus } from '../entities/trip.status';
import {
  TripFindByIdOptions,
  type TripHistoryShortListOptions,
  TripListParams,
} from '../entities/trip-query.types';
import {
  ITripRepositoryToken,
  type ITripRepository,
} from '../repositories/trip.repository.interface';
import {
  ITripPricingServiceToken,
  type ITripPricingService,
} from '../pricing/trip-pricing.service.interface';
import {
  ITripRealtimePublisherToken,
  type ITripRealtimePublisher,
} from './trip-realtime.publisher.interface';
import { ITripService } from './trip.service.interface';

@Injectable()
export class TripService implements ITripService {
  private readonly logger = new Logger(TripService.name);

  constructor(
    @Inject(ITripRepositoryToken)
    private readonly repository: ITripRepository,
    @Inject(ITripRealtimePublisherToken)
    private readonly realtimePublisher: ITripRealtimePublisher,
    @Inject(IJobQueueToken)
    private readonly jobQueue: IJobQueue,
    @Inject(ITripPricingServiceToken)
    private readonly pricingService: ITripPricingService,
    @Inject(ICarTripSyncServiceToken)
    private readonly carTripSync: ICarTripSyncService,
  ) {}

  async findMany(params?: TripListParams): Promise<TripRead[]> {
    this.logger.log('Finding trips');
    try {
      const list = await this.repository.findMany(params);
      return list.map(TripMapper.fromEntityToRead);
    } catch (error) {
      this.logger.error('Failed to find trips', error);
      throw TripDbErrors.mapError(error);
    }
  }

  async findById(id: string, options?: TripFindByIdOptions): Promise<TripRead> {
    this.logger.log(`Finding trip by id: ${id}`);
    try {
      const trip = await this.repository.findById(id, options);
      if (!trip) {
        throw new TripNotFoundException(`Trip with id ${id} was not found`);
      }
      return TripMapper.fromEntityToRead(trip);
    } catch (error) {
      this.logger.error(`Failed to find trip by id: ${id}`, error);
      throw TripDbErrors.mapError(error);
    }
  }

  async create(input: TripCreate): Promise<TripRead> {
    this.logger.log('Creating trip');
    try {
      const created = await this.repository.createStartingTripWithCarLock({
        userId: input.userId,
        carId: input.carId,
        geoZoneVersionId: input.geoZoneVersionId,
        status: input.status,
        startLat: input.startLat,
        startLng: input.startLng,
        carPlateSnapshot: input.carPlateSnapshot,
        carDisplayNameSnapshot: input.carDisplayNameSnapshot,
      });
      const read = TripMapper.fromEntityToRead(created);
      await this.carTripSync.onTripStarted(read.carId, read.id);
      try {
        await this.realtimePublisher.publishTripStarted(read);
      } catch (error) {
        this.logger.error(
          `Trip created but publish failed: tripId=${read.id}`,
          error,
        );
        throw new TripPublishFailedException(
          `Trip ${read.id} created, but realtime publish failed`,
          error,
        );
      }
      return read;
    } catch (error) {
      this.logger.error('Failed to create trip', error);
      throw TripDbErrors.mapError(error);
    }
  }

  async ensureTripAccessForUser(
    role: UserRole,
    userId: string,
    tripId: string,
  ): Promise<void> {
    if (role !== UserRole.DRIVER) {
      return;
    }
    const trip = await this.repository.findById(tripId);
    if (!trip) {
      throw new TripNotFoundException(`Trip with id ${tripId} was not found`);
    }
    if (trip.userId !== userId) {
      throw new ForbiddenException('Forbidden');
    }
  }

  async getTripHistoryShortInfoList(
    userId: string,
    options?: TripHistoryShortListOptions,
  ): Promise<TripHistoryShortInfoRead[]> {
    const rows = await this.repository.findHistoryShortByUserId(
      userId,
      options,
    );
    return rows.map(TripHistoryMapper.shortInfoFromSqlRow);
  }

  async getTripHistoryShortInfo(
    tripId: string,
  ): Promise<TripHistoryShortInfoRead> {
    const row = await this.repository.findHistoryShortByTripId(tripId);
    if (!row) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }
    return TripHistoryMapper.shortInfoFromSqlRow(row);
  }

  async getTripHistoryFullInfo(tripId: string): Promise<TripHistoryRead> {
    const row = await this.repository.findHistoryFullByTripId(tripId);
    if (!row) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }
    return TripHistoryMapper.fullInfoFromSqlRow(row);
  }

  async update(id: string, input: TripUpdate): Promise<TripRead> {
    this.logger.log(`Updating trip: ${id}`);
    try {
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new TripNotFoundException(`Trip with id ${id} was not found`);
      }
      const updatePatch = {
        status: input.status,
        finishedAt: input.finishedAt,
        pauseStartedAt: input.pauseStartedAt,
        totalPausedSec: input.totalPausedSec,
        startLat: input.startLat,
        startLng: input.startLng,
        finishLat: input.finishLat,
        finishLng: input.finishLng,
        distance: input.distance,
        duration: input.duration,
        geoZoneVersionId: input.geoZoneVersionId,
        carPlateSnapshot: input.carPlateSnapshot,
        carDisplayNameSnapshot: input.carDisplayNameSnapshot,
      };

      const finishing =
        input.status === TripStatus.FINISHED &&
        existing.status !== TripStatus.FINISHED;

      let updated: TripEntity;
      let firstFinish = false;

      if (finishing) {
        const transition =
          await this.repository.transitionToFinishedIfNotFinished(
            id,
            updatePatch,
          );
        updated = transition.entity;
        firstFinish = transition.applied;
      } else {
        updated = await this.repository.update(id, updatePatch);
      }

      const statusChanged =
        input.status !== undefined && input.status !== existing.status;
      const pauseFieldsChanged =
        input.pauseStartedAt !== undefined ||
        input.totalPausedSec !== undefined;

      /**
       * Финиш поездки => проверка PARKING-геозоны асинхронно в `ViolationBackgroundWorker`.
       *
       * Пример PATCH:
       * `{ "status": 4, "finishLat": 55.75, "finishLng": 37.61, "finishedAt": "..." }`
       */
      let read = TripMapper.fromEntityToRead(updated);

      if (firstFinish) {
        const priced = await this.pricingService.recalcAndPersist(id, {
          trigger: 'finish',
          publishMetrics: false,
        });
        if (priced) {
          read = priced;
        }
        await this.carTripSync.onTripFinished(id);
        await this.safePublishStateChanged(read, existing.status);
        await this.safePublishTripFinished(read);
        if (updated.finishLat != null && updated.finishLng != null) {
          const recordedAt =
            updated.finishedAt?.toISOString() ?? new Date().toISOString();
          this.jobQueue.enqueue({
            name: ViolationJobName.ParkingZoneCheck,
            payload: {
              tripId: id,
              recordedAt,
              lat: updated.finishLat,
              lon: updated.finishLng,
            },
            createdAtMs: Date.now(),
          });
        }
        return read;
      }

      if (statusChanged) {
        await this.safePublishStateChanged(read, existing.status);
        if (updated.status === TripStatus.CANCELLED) {
          await this.carTripSync.onTripCancelled(updated.carId);
        } else {
          this.pricingService.enqueueRecalc(id, 'status');
        }
      } else if (
        pauseFieldsChanged &&
        updated.status !== TripStatus.CANCELLED
      ) {
        this.pricingService.enqueueRecalc(id, 'status');
      }

      return read;
    } catch (error) {
      this.logger.error(`Failed to update trip: ${id}`, error);
      throw TripDbErrors.mapError(error);
    }
  }

  private async safePublishStateChanged(
    trip: TripRead,
    previousStatus?: TripStatus,
  ): Promise<void> {
    try {
      await this.realtimePublisher.publishTripStateChanged(
        trip,
        previousStatus,
      );
    } catch (error) {
      this.logger.warn(
        `publish trip.state.changed failed tripId=${trip.id}`,
        error,
      );
    }
  }

  private async safePublishTripFinished(trip: TripRead): Promise<void> {
    try {
      await this.realtimePublisher.publishTripFinished(trip);
    } catch (error) {
      this.logger.warn(`publish trip.finished failed tripId=${trip.id}`, error);
    }
  }
}
