import { Test, type TestingModule } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';

import { CarRepository } from 'src/modules/car/repositories/car.repository';
import { ICarRepositoryToken } from 'src/modules/car/repositories/car.repository.interface';
import { CarStatus } from 'src/modules/car/entities/car-status';
import { CarTripSyncService } from 'src/modules/car/services/car-trip-sync.service';
import { ICarTripSyncServiceToken } from 'src/modules/car/services/car-trip-sync.service.interface';
import type {
  GeoJSONMultiPolygon,
  GeoJSONPosition,
} from 'src/modules/geozone/entities/geozone.geometry';
import { GeozoneType } from 'src/modules/geozone/entities/geozone.type';
import { GeozoneRepository } from 'src/modules/geozone/repositories/geozone.repository';
import { TelemetryRepository } from 'src/modules/telemetry/repositories/telemetry.repository';
import { ITelemetryRepositoryToken } from 'src/modules/telemetry/repositories/telemetry.repository.interface';
import { ViolationRepository } from 'src/modules/violation/repositories/violation.repository';
import { IViolationRepositoryToken } from 'src/modules/violation/repositories/violation.repository.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { InMemoryJobQueue } from 'src/shared/background/in-memory-job-queue';
import { IJobQueueToken } from 'src/shared/background/job-queue.interface';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';

import { ONGOING_TRIP_STATUSES, TripStatus } from '../entities/trip.status';
import { ITripPricingServiceToken } from '../pricing/trip-pricing.service.interface';
import { TripRepository } from '../repositories/trip.repository';
import { ITripRepositoryToken } from '../repositories/trip.repository.interface';
import {
  ITripRealtimePublisherToken,
  type ITripRealtimePublisher,
} from '../services/trip-realtime.publisher.interface';
import { TripService } from '../services/trip.service';

export type ConcurrentTripFixture = {
  prisma: PrismaService;
  tripService: TripService;
  carTripSync: CarTripSyncService;
  jobQueue: InMemoryJobQueue;
  userId: string;
  carId: string;
  geoZoneVersionId: string;
  initialCarMileage: number;
};

class NoopTripRealtimePublisher implements ITripRealtimePublisher {
  async publishTripStarted(): Promise<void> {
    return;
  }

  async publishTripStateChanged(): Promise<void> {
    return;
  }

  async publishTripMetricsUpdated(): Promise<void> {
    return;
  }

  async publishTripFinished(): Promise<void> {
    return;
  }

  async publishCarStateChanged(): Promise<void> {
    return;
  }
}

export async function setupConcurrentTripFixture(): Promise<{
  fixture: ConcurrentTripFixture;
  moduleRef: TestingModule;
}> {
  loadBackendDevEnv();
  const prisma = createTestPrismaService();
  await prisma.$connect();

  await truncateApplicationTable(prisma, 'violation');
  await truncateApplicationTable(prisma, 'telemetry');
  await truncateApplicationTable(prisma, 'trip');
  await truncateApplicationTable(prisma, 'tariff_preset');
  await truncateApplicationTable(prisma, 'geo_zone_version');
  await truncateApplicationTable(prisma, 'geo_zone');
  await truncateApplicationTable(prisma, 'car');
  await truncateApplicationTable(prisma, 'user');

  const suffix = uuidv4().replace(/-/g, '');
  const user = await prisma.user.create({
    data: {
      name: `Race trip ${suffix.slice(0, 10)}`,
      email: `race-trip-${suffix}@test.local`,
      phone: `+79${suffix.replace(/[a-f]/gi, '6').slice(0, 10)}`,
      passwordHash: 'hash',
      role: 0,
      isActive: true,
      isDeleted: false,
    },
  });

  const initialCarMileage = 1_000;
  const car = await prisma.car.create({
    data: {
      brand: 'Race',
      model: 'Car',
      licensePlate: `RC${suffix.slice(0, 8)}`,
      color: 'white',
      mileage: initialCarMileage,
      fuelLevel: 70,
      isAvailable: true,
      carStatus: CarStatus.AVAILABLE,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    },
  });

  const geozoneRepository = new GeozoneRepository(prisma);
  const zone = await geozoneRepository.createWithInitialVersion({
    name: 'Concurrent trip zone',
    type: GeozoneType.RENTAL,
    color: '#444444',
    createdByUserId: user.id,
    geometry: sampleMultiPolygon(0),
    rules: null,
    pricePerMinute: 1,
    pricePerKm: 2,
    pausePricePerMinute: 0.5,
  });
  if (!zone.currentVersionId) {
    throw new Error('currentVersionId expected');
  }

  const tripRepository = new TripRepository(prisma);
  const carRepository = new CarRepository(prisma);
  const telemetryRepository = new TelemetryRepository(prisma);
  const violationRepository = new ViolationRepository(prisma);
  const jobQueue = new InMemoryJobQueue();

  const moduleRef = await Test.createTestingModule({
    providers: [
      { provide: PrismaService, useValue: prisma },
      { provide: ITripRepositoryToken, useValue: tripRepository },
      { provide: ICarRepositoryToken, useValue: carRepository },
      { provide: ITelemetryRepositoryToken, useValue: telemetryRepository },
      { provide: IViolationRepositoryToken, useValue: violationRepository },
      TripService,
      CarTripSyncService,
      {
        provide: ITripRealtimePublisherToken,
        useClass: NoopTripRealtimePublisher,
      },
      { provide: IJobQueueToken, useValue: jobQueue },
      {
        provide: ITripPricingServiceToken,
        useValue: {
          enqueueRecalc: () => undefined,
          recalcAndPersist: async () => null,
        },
      },
      {
        provide: ICarTripSyncServiceToken,
        useExisting: CarTripSyncService,
      },
    ],
  }).compile();

  const tripService = moduleRef.get(TripService);
  const carTripSync = moduleRef.get(CarTripSyncService);

  return {
    fixture: {
      prisma,
      tripService,
      carTripSync,
      jobQueue,
      userId: user.id,
      carId: car.id,
      geoZoneVersionId: zone.currentVersionId,
      initialCarMileage,
    },
    moduleRef,
  };
}

export async function teardownConcurrentTripFixture(
  prisma: PrismaService,
  moduleRef: TestingModule,
): Promise<void> {
  await moduleRef.close();
  await truncateApplicationTable(prisma, 'violation');
  await truncateApplicationTable(prisma, 'telemetry');
  await truncateApplicationTable(prisma, 'trip');
  await truncateApplicationTable(prisma, 'tariff_preset');
  await truncateApplicationTable(prisma, 'geo_zone_version');
  await truncateApplicationTable(prisma, 'geo_zone');
  await truncateApplicationTable(prisma, 'car');
  await truncateApplicationTable(prisma, 'user');
  await prisma.$disconnect();
}

export async function countOngoingTripsForCar(
  prisma: PrismaService,
  carId: string,
): Promise<number> {
  return prisma.trip.count({
    where: {
      carId,
      status: { in: ONGOING_TRIP_STATUSES },
    },
  });
}

const sampleMultiPolygon = (seed: number): GeoJSONMultiPolygon => {
  const baseLon = 35 + seed * 0.01;
  const ring: GeoJSONPosition[] = [
    [baseLon, 55.7],
    [baseLon + 0.15, 55.7],
    [baseLon + 0.15, 55.85],
    [baseLon, 55.85],
    [baseLon, 55.7],
  ];
  return {
    type: 'MultiPolygon',
    coordinates: [[ring]] as unknown as GeoJSONMultiPolygon['coordinates'],
  };
};
