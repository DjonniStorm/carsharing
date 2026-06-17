import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { TelemetryDbErrors } from '../common/db-errors';
import { TelemetryNotFoundException } from '../common/errors';
import { TelemetryMapper } from '../common/mapper';
import { TelemetryCreate } from '../entities/dto/telemetry.create';
import { TelemetryRead } from '../entities/dto/telemetry.read';
import {
  ITelemetryRepositoryToken,
  type ITelemetryRepository,
} from '../repositories/telemetry.repository.interface';
import { ITelemetryService } from './telemetry.service.interface';
import { getTelemetryConfig } from '../common/telemetry.config';
import { Throttle } from 'src/shared/throttle/throttle';
import {
  IJobQueueToken,
  type IJobQueue,
} from 'src/shared/background/job-queue.interface';
import { ViolationJobName } from 'src/modules/violation/background/violation-jobs';
import {
  ICarTripSyncServiceToken,
  type ICarTripSyncService,
} from '../../car/services/car-trip-sync.service.interface';
import {
  ITripPricingServiceToken,
  type ITripPricingService,
} from '../../trip/pricing/trip-pricing.service.interface';
import { TripStatus } from '../../trip/entities/trip.status';
import {
  ITripRepositoryToken,
  type ITripRepository,
} from '../../trip/repositories/trip.repository.interface';
import {
  ITripRealtimeOutboxToken,
  type ITripRealtimeOutbox,
} from '../../trip/realtime/trip-realtime.outbox.interface';
import { TripWsEvent } from '../../trip/entities/realtime/trip-event';
import { createTripWsEvent } from '../../trip/realtime/trip-events.emitter';

@Injectable()
export class TelemetryService implements ITelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private readonly ingestThrottle = new Throttle();
  /** Отдельный throttle для WS: не спамим `trip.route.point` и `car.location` чаще периода. */
  private readonly wsThrottle = new Throttle();

  private readonly carFuelThrottle = new Throttle();

  constructor(
    @Inject(ITelemetryRepositoryToken)
    private readonly repository: ITelemetryRepository,
    @Inject(IJobQueueToken)
    private readonly jobQueue: IJobQueue,
    @Inject(ITripRealtimeOutboxToken)
    private readonly tripOutbox: ITripRealtimeOutbox,
    @Inject(ITripRepositoryToken)
    private readonly trips: ITripRepository,
    @Inject(ITripPricingServiceToken)
    private readonly tripPricing: ITripPricingService,
    @Inject(ICarTripSyncServiceToken)
    private readonly carTripSync: ICarTripSyncService,
  ) {}

  async create(input: TelemetryCreate): Promise<TelemetryRead> {
    this.logger.log('Creating telemetry point');
    const { periodSec } = getTelemetryConfig();
    const allow = this.ingestThrottle.allow(
      `telemetry:trip:${input.tripId}`,
      periodSec * 1000,
    );
    if (!allow) {
      this.logger.debug(
        `skip telemetry persist (throttled): tripId=${input.tripId}`,
      );
      this.jobQueue.enqueue({
        name: ViolationJobName.RentalMovementZoneCheck,
        payload: {
          tripId: input.tripId,
          recordedAt: input.timestamp,
          lat: input.lat,
          lon: input.lon,
          speed: input.speed,
          fuelLevel: input.fuelLevel,
        },
        createdAtMs: Date.now(),
      });
      // Принимаем запрос, но не пишем в БД.
      const read = new TelemetryRead();
      read.id = '';
      read.timestamp = input.timestamp;
      read.lat = input.lat;
      read.lon = input.lon;
      read.speed = input.speed;
      read.acceleration = input.acceleration;
      read.fuelLevel = input.fuelLevel;
      read.tripId = input.tripId;
      return read;
    }
    try {
      const created = await this.repository.create(input);
      this.jobQueue.enqueue({
        name: ViolationJobName.RentalMovementZoneCheck,
        payload: {
          tripId: input.tripId,
          recordedAt: input.timestamp,
          lat: input.lat,
          lon: input.lon,
          speed: input.speed,
          fuelLevel: input.fuelLevel,
        },
        createdAtMs: Date.now(),
      });
      void this.publishTripRealtimeFromTelemetry(input);
      this.tripPricing.enqueueRecalc(input.tripId, 'telemetry');
      void this.syncCarFuelFromTelemetry(input);
      return TelemetryMapper.fromEntityToRead(created);
    } catch (error) {
      this.logger.error('Failed to create telemetry point', error);
      throw TelemetryDbErrors.mapError(error);
    }
  }

  async findById(id: string): Promise<TelemetryRead> {
    this.logger.log(`Finding telemetry point by id: ${id}`);
    try {
      const telemetry = await this.repository.findById(id);
      if (!telemetry) {
        throw new TelemetryNotFoundException(
          `Telemetry with id ${id} was not found`,
        );
      }
      return TelemetryMapper.fromEntityToRead(telemetry);
    } catch (error) {
      this.logger.error(`Failed to find telemetry point by id: ${id}`, error);
      throw TelemetryDbErrors.mapError(error);
    }
  }

  async findManyByTripId(
    tripId: string,
    timeFrom?: Date,
    timeTo?: Date,
    limit?: number,
    offset?: number,
    sort?: 'asc' | 'desc',
  ): Promise<TelemetryRead[]> {
    this.logger.log(`Finding telemetry points by tripId: ${tripId}`);
    try {
      const list = await this.repository.findManyByTripId(
        tripId,
        timeFrom,
        timeTo,
        limit,
        offset,
        sort,
      );
      return list.map(TelemetryMapper.fromEntityToRead);
    } catch (error) {
      this.logger.error(
        `Failed to find telemetry points by tripId: ${tripId}`,
        error,
      );
      throw TelemetryDbErrors.mapError(error);
    }
  }

  /**
   * После сохранённой точки шлём два параллельных канала:
   * - `trip.route.point` => комната поездки (водитель/менеджер на trip);
   * - `car.location.updated` => комната машины (менеджерская карта).
   *
   * Пример подписки менеджера на машину: `subscribe.car` => room `car:{carId}`.
   */
  private async publishTripRealtimeFromTelemetry(
    input: TelemetryCreate,
  ): Promise<void> {
    const { periodSec } = getTelemetryConfig();
    const windowMs = periodSec * 1000;
    try {
      const trip = await this.trips.findById(input.tripId);
      if (!trip) {
        this.logger.debug(
          `skip telemetry WS: trip not found tripId=${input.tripId}`,
        );
        return;
      }
      const recordedAt = input.timestamp;

      if (
        this.wsThrottle.allow(
          `telemetry_ws:trip_route:${input.tripId}`,
          windowMs,
        )
      ) {
        await this.tripOutbox.publish(
          createTripWsEvent(
            TripWsEvent.TripRoutePoint,
            {
              tripId: input.tripId,
              carId: trip.carId,
              lat: input.lat,
              lng: input.lon,
              speed: input.speed,
              fuelLevel: input.fuelLevel,
              recordedAt,
            },
            { eventId: uuidv4(), ts: recordedAt },
          ),
        );
      }

      if (
        this.wsThrottle.allow(`telemetry_ws:car_loc:${trip.carId}`, windowMs)
      ) {
        await this.tripOutbox.publish(
          createTripWsEvent(
            TripWsEvent.CarLocationUpdated,
            {
              carId: trip.carId,
              lat: input.lat,
              lng: input.lon,
              positionAt: recordedAt,
            },
            { eventId: uuidv4(), ts: recordedAt },
          ),
        );
      }
    } catch (error) {
      this.logger.warn(
        `telemetry realtime publish failed tripId=${input.tripId}`,
        error,
      );
    }
  }

  private async syncCarFuelFromTelemetry(
    input: TelemetryCreate,
  ): Promise<void> {
    const { periodSec } = getTelemetryConfig();
    const windowMs = periodSec * 1000;
    if (
      !this.carFuelThrottle.allow(
        `telemetry_car_fuel:${input.tripId}`,
        windowMs,
      )
    ) {
      return;
    }
    try {
      const trip = await this.trips.findById(input.tripId);
      if (!trip) {
        return;
      }
      const ongoing: TripStatus[] = [
        TripStatus.PENDING,
        TripStatus.STARTED,
        TripStatus.ACTIVE,
        TripStatus.PAUSED,
      ];
      if (!ongoing.includes(trip.status)) {
        return;
      }
      await this.carTripSync.syncLiveFuel(trip.carId, input.fuelLevel);
    } catch (error) {
      this.logger.warn(
        `sync car fuel from telemetry failed tripId=${input.tripId}`,
        error,
      );
    }
  }
}
