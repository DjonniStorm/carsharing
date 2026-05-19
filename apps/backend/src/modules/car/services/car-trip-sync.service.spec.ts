import { describe, expect, it, vi } from 'vitest';

import { TripCarAlreadyInUseException } from '../../trip/common/errors';
import { TripStatus } from '../../trip/entities/trip.status';
import type { TripEntity } from '../../trip/entities/trip.entity';
import type { ITripRealtimePublisher } from '../../trip/services/trip-realtime.publisher.interface';
import { ViolationStatus } from '../../violation/entities/violation.status';
import type { ViolationEntity } from '../../violation/entities/violation.entity';
import { CarStatus } from '../entities/car-status';
import type { CarEntity } from '../entities/car.entity';
import { CarTripSyncService } from './car-trip-sync.service';

function sampleCar(overrides: Partial<CarEntity> = {}): CarEntity {
  return {
    id: 'car-1',
    brand: 'Test',
    model: 'Car',
    licensePlate: 'A001AA',
    color: 'white',
    mileage: 1000,
    fuelLevel: 50,
    isAvailable: true,
    carStatus: CarStatus.AVAILABLE,
    isDeleted: false,
    lastKnownLat: 55.75,
    lastKnownLon: 37.61,
    lastPositionAt: '2026-05-18T10:00:00.000Z',
    createdAt: '2026-05-18T09:00:00.000Z',
    updatedAt: '2026-05-18T09:00:00.000Z',
    ...overrides,
  };
}

function sampleTrip(overrides: Partial<TripEntity> = {}): TripEntity {
  return {
    id: 'trip-1',
    userId: 'user-1',
    carId: 'car-1',
    geoZoneVersionId: 'gzv-1',
    status: TripStatus.FINISHED,
    startedAt: new Date('2026-05-18T10:00:00.000Z'),
    finishedAt: new Date('2026-05-18T11:00:00.000Z'),
    pauseStartedAt: null,
    totalPausedSec: 0,
    startLat: 55.75,
    startLng: 37.61,
    finishLat: 55.76,
    finishLng: 37.62,
    distance: 12.345,
    duration: 1,
    distanceMeters: 12_345,
    chargedMinutes: 60,
    chargedKm: 12.345,
    priceTime: 60,
    priceDistance: 24.69,
    pricePause: 0,
    priceTotal: 84.69,
    createdAt: new Date('2026-05-18T10:00:00.000Z'),
    updatedAt: new Date('2026-05-18T11:00:00.000Z'),
    carPlateSnapshot: null,
    carDisplayNameSnapshot: null,
    ...overrides,
  };
}

describe('CarTripSyncService', () => {
  it('assertCarAvailableForNewTrip throws when active trip exists', async () => {
    const trips = {
      findActiveByCarId: vi
        .fn()
        .mockResolvedValue(sampleTrip({ status: TripStatus.ACTIVE })),
    };
    const service = new CarTripSyncService(
      { findById: vi.fn(), update: vi.fn() } as never,
      trips as never,
      { findManyByTripId: vi.fn() } as never,
      { findAllByTripId: vi.fn() } as never,
      { publishCarStateChanged: vi.fn() } as never,
    );

    await expect(
      service.assertCarAvailableForNewTrip('car-1'),
    ).rejects.toBeInstanceOf(TripCarAlreadyInUseException);
  });

  it('onTripStarted sets IN_USE and publishes car state', async () => {
    const car = sampleCar();
    const updated = { ...car, carStatus: CarStatus.IN_USE, isAvailable: false };
    const cars = {
      update: vi.fn().mockResolvedValue(updated),
    };
    const publishCarStateChanged = vi.fn().mockResolvedValue(undefined);
    const service = new CarTripSyncService(
      cars as never,
      { findActiveByCarId: vi.fn() } as never,
      { findManyByTripId: vi.fn() } as never,
      { findAllByTripId: vi.fn() } as never,
      { publishCarStateChanged } as ITripRealtimePublisher,
    );

    await service.onTripStarted('car-1', 'trip-1');

    expect(cars.update).toHaveBeenCalledWith(
      'car-1',
      expect.objectContaining({
        carStatus: CarStatus.IN_USE,
        isAvailable: false,
      }),
    );
    expect(publishCarStateChanged).toHaveBeenCalledWith({
      carId: 'car-1',
      carStatus: CarStatus.IN_USE,
      isAvailable: false,
      fuelLevel: 50,
    });
  });

  it('onTripFinished adds mileage from distanceMeters and fuel from telemetry', async () => {
    const car = sampleCar({ mileage: 1000, fuelLevel: 40 });
    const trip = sampleTrip({ distanceMeters: 5000 });
    const cars = {
      findById: vi.fn().mockResolvedValue(car),
      updateFinishMetrics: vi
        .fn()
        .mockResolvedValueOnce({ ...car, mileage: 1005, fuelLevel: 22 }),
      update: vi.fn().mockResolvedValueOnce({
        ...car,
        mileage: 1005,
        fuelLevel: 22,
        carStatus: CarStatus.AVAILABLE,
        isAvailable: true,
      }),
    };
    const trips = {
      findById: vi.fn().mockResolvedValue(trip),
    };
    const telemetry = {
      findManyByTripId: vi.fn().mockResolvedValue([
        {
          id: 'tel-1',
          fuelLevel: 22,
          lat: 55.8,
          lon: 37.7,
        },
      ]),
    };
    const violations = {
      findAllByTripId: vi.fn().mockResolvedValue([]),
    };
    const publishCarStateChanged = vi.fn().mockResolvedValue(undefined);
    const service = new CarTripSyncService(
      cars as never,
      trips as never,
      telemetry as never,
      violations as never,
      { publishCarStateChanged } as ITripRealtimePublisher,
    );

    await service.onTripFinished('trip-1');

    expect(cars.updateFinishMetrics).toHaveBeenCalledWith(
      'car-1',
      expect.objectContaining({
        mileageIncrementKm: 5,
        fuelLevel: 22,
        lastKnownLat: 55.76,
        lastKnownLon: 37.62,
      }),
    );
    expect(publishCarStateChanged).toHaveBeenCalled();
  });

  it('onTripFinished applies OUT_OF_SERVICE when WRONG_PARKING violation exists', async () => {
    const car = sampleCar();
    const trip = sampleTrip();
    const cars = {
      findById: vi.fn().mockResolvedValue(car),
      updateFinishMetrics: vi
        .fn()
        .mockResolvedValueOnce({ ...car, mileage: 1012.345 }),
      update: vi.fn().mockResolvedValueOnce({
        ...car,
        carStatus: CarStatus.OUT_OF_SERVICE,
        isAvailable: false,
      }),
    };
    const violation: ViolationEntity = {
      id: 'v-1',
      type: ViolationStatus.WRONG_PARKING,
      description: 'bad park',
      createdAt: new Date(),
      tripId: 'trip-1',
    };
    const service = new CarTripSyncService(
      cars as never,
      { findById: vi.fn().mockResolvedValue(trip) } as never,
      { findManyByTripId: vi.fn().mockResolvedValue([]) } as never,
      { findAllByTripId: vi.fn().mockResolvedValue([violation]) } as never,
      { publishCarStateChanged: vi.fn() } as never,
    );

    await service.onTripFinished('trip-1');

    expect(cars.update).toHaveBeenLastCalledWith(
      'car-1',
      expect.objectContaining({
        carStatus: CarStatus.OUT_OF_SERVICE,
        isAvailable: false,
      }),
    );
  });
});
