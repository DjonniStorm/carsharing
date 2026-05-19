import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  ITelemetryRepositoryToken,
  type ITelemetryRepository,
} from 'src/modules/telemetry/repositories/telemetry.repository.interface';
import {
  ITripRepositoryToken,
  type ITripRepository,
} from 'src/modules/trip/repositories/trip.repository.interface';
import { TripCarAlreadyInUseException } from 'src/modules/trip/common/errors';
import { TripEntity } from 'src/modules/trip/entities/trip.entity';
import { TripStatus } from 'src/modules/trip/entities/trip.status';
import {
  ITripRealtimePublisherToken,
  type ITripRealtimePublisher,
} from 'src/modules/trip/services/trip-realtime.publisher.interface';
import {
  IViolationRepositoryToken,
  type IViolationRepository,
} from 'src/modules/violation/repositories/violation.repository.interface';
import { ViolationStatus } from 'src/modules/violation/entities/violation.status';

import { evaluateCarAvailability } from '../common/car-availability.evaluator';
import { CarStatus } from '../entities/car-status';
import type { CarEntity } from '../entities/car.entity';
import {
  ICarRepositoryToken,
  type ICarRepository,
} from '../repositories/car.repository.interface';
import type { ICarTripSyncService } from './car-trip-sync.service.interface';

@Injectable()
export class CarTripSyncService implements ICarTripSyncService {
  private readonly logger = new Logger(CarTripSyncService.name);

  constructor(
    @Inject(ICarRepositoryToken)
    private readonly cars: ICarRepository,
    @Inject(ITripRepositoryToken)
    private readonly trips: ITripRepository,
    @Inject(ITelemetryRepositoryToken)
    private readonly telemetry: ITelemetryRepository,
    @Inject(IViolationRepositoryToken)
    private readonly violations: IViolationRepository,
    @Inject(ITripRealtimePublisherToken)
    private readonly realtimePublisher: ITripRealtimePublisher,
  ) {}

  async assertCarAvailableForNewTrip(carId: string): Promise<void> {
    const active = await this.trips.findActiveByCarId(carId);
    if (active) {
      throw new TripCarAlreadyInUseException(
        `Car ${carId} already has active trip ${active.id}`,
        carId,
        active.id,
      );
    }
  }

  async onTripStarted(carId: string, _tripId: string): Promise<void> {
    const updated = await this.cars.update(carId, {
      carStatus: CarStatus.IN_USE,
      isAvailable: false,
      updatedAt: new Date().toISOString(),
    });
    await this.publishCarStateSafe(updated);
  }

  async onTripFinished(tripId: string): Promise<void> {
    const trip = await this.trips.findById(tripId);
    if (!trip) {
      this.logger.warn(`onTripFinished: trip not found tripId=${tripId}`);
      return;
    }

    const car = await this.cars.findById(trip.carId);
    if (!car) {
      this.logger.warn(
        `onTripFinished: car not found carId=${trip.carId} tripId=${tripId}`,
      );
      return;
    }

    const patch = await this.buildFinishCarPatch(car, trip);
    const withMetrics = await this.cars.update(trip.carId, patch);

    await this.applyAvailabilityForTrip(tripId, trip.carId, withMetrics);
  }

  async onTripCancelled(carId: string): Promise<void> {
    const stillActive = await this.trips.findActiveByCarId(carId);
    if (stillActive) {
      return;
    }
    const updated = await this.cars.update(carId, {
      carStatus: CarStatus.AVAILABLE,
      isAvailable: true,
      updatedAt: new Date().toISOString(),
    });
    await this.publishCarStateSafe(updated);
  }

  async recalcAvailabilityForTrip(tripId: string): Promise<void> {
    const trip = await this.trips.findById(tripId);
    if (!trip || trip.status !== TripStatus.FINISHED) {
      return;
    }
    const car = await this.cars.findById(trip.carId);
    if (!car) {
      return;
    }
    await this.applyAvailabilityForTrip(tripId, trip.carId, car);
  }

  async syncLiveFuel(carId: string, fuelLevel: number): Promise<void> {
    const car = await this.cars.findById(carId);
    if (!car) {
      return;
    }
    const updated = await this.cars.update(carId, {
      fuelLevel,
      updatedAt: new Date().toISOString(),
    });
    await this.publishCarStateSafe(updated);
  }

  private async buildFinishCarPatch(
    car: CarEntity,
    trip: TripEntity,
  ): Promise<Partial<CarEntity>> {
    const points = await this.telemetry.findManyByTripId(
      trip.id,
      undefined,
      undefined,
      1,
      0,
      'desc',
    );
    const lastPoint = points[0];

    const kmDelta =
      trip.distanceMeters != null && trip.distanceMeters > 0
        ? trip.distanceMeters / 1000
        : (trip.chargedKm ?? 0);

    const finishedAtIso =
      trip.finishedAt?.toISOString() ?? new Date().toISOString();

    let lastKnownLat = trip.finishLat ?? lastPoint?.lat ?? car.lastKnownLat;
    let lastKnownLon = trip.finishLng ?? lastPoint?.lon ?? car.lastKnownLon;

    return {
      mileage: car.mileage + kmDelta,
      updatedAt: finishedAtIso,
      lastKnownLat,
      lastKnownLon,
      lastPositionAt: finishedAtIso,
      ...(lastPoint != null ? { fuelLevel: lastPoint.fuelLevel } : {}),
    };
  }

  private async applyAvailabilityForTrip(
    tripId: string,
    carId: string,
    carBefore: CarEntity,
  ): Promise<void> {
    const rows = await this.violations.findAllByTripId(tripId);
    const decision = evaluateCarAvailability(
      rows.map((v) => v.type as ViolationStatus),
    );

    const updated = await this.cars.update(carId, {
      carStatus: decision.carStatus,
      isAvailable: decision.isAvailable,
      updatedAt: new Date().toISOString(),
    });
    await this.publishCarStateSafe(updated);
  }

  private async publishCarStateSafe(car: CarEntity): Promise<void> {
    try {
      await this.realtimePublisher.publishCarStateChanged({
        carId: car.id,
        carStatus: car.carStatus,
        isAvailable: car.isAvailable,
        fuelLevel: car.fuelLevel,
      });
    } catch (error) {
      this.logger.warn(
        `publish car.state.changed failed carId=${car.id}`,
        error,
      );
    }
  }
}
