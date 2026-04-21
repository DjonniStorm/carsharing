import { Inject, Injectable, Logger } from '@nestjs/common';

import { TripDbErrors } from '../common/db-errors';
import {
  TripNotFoundException,
  TripPublishFailedException,
} from '../common/errors';
import { TripMapper } from '../common/mapper';
import { TripCreate } from '../entities/dtos/trip.create';
import { TripRead } from '../entities/dtos/trip.read';
import { TripUpdate } from '../entities/dtos/trip.update';
import {
  TripFindByIdOptions,
  TripListParams,
} from '../entities/trip-query.types';
import {
  ITripRepositoryToken,
  type ITripRepository,
} from '../repositories/trip.repository.interface';
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

  async findById(id: number, options?: TripFindByIdOptions): Promise<TripRead> {
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
      const created = await this.repository.create({
        userId: input.userId,
        carId: input.carId,
        tariffVersionId: input.tariffVersionId,
        status: input.status,
        startLat: input.startLat,
        startLng: input.startLng,
        carPlateSnapshot: input.carPlateSnapshot,
        carDisplayNameSnapshot: input.carDisplayNameSnapshot,
      });
      const read = TripMapper.fromEntityToRead(created);
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

  async update(id: number, input: TripUpdate): Promise<TripRead> {
    this.logger.log(`Updating trip: ${id}`);
    try {
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new TripNotFoundException(`Trip with id ${id} was not found`);
      }
      const updated = await this.repository.update(id, {
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
        distanceMeters: input.distanceMeters,
        chargedMinutes: input.chargedMinutes,
        chargedKm: input.chargedKm,
        priceTime: input.priceTime,
        priceDistance: input.priceDistance,
        pricePause: input.pricePause,
        priceTotal: input.priceTotal,
        tariffVersionId: input.tariffVersionId,
        carPlateSnapshot: input.carPlateSnapshot,
        carDisplayNameSnapshot: input.carDisplayNameSnapshot,
      });
      return TripMapper.fromEntityToRead(updated);
    } catch (error) {
      this.logger.error(`Failed to update trip: ${id}`, error);
      throw TripDbErrors.mapError(error);
    }
  }
}
