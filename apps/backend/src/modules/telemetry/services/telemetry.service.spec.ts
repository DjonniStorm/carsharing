import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { v4 as uuidv4 } from 'uuid';

import { CarStatus } from '../../car/entities/car-status';
import type {
  GeoJSONMultiPolygon,
  GeoJSONPosition,
} from '../../geozone/entities/geozone.geometry';
import { GeozoneType } from '../../geozone/entities/geozone.type';
import { GeozoneRepository } from '../../geozone/repositories/geozone.repository';
import { TripRepository } from '../../trip/repositories/trip.repository';
import type { ITripRealtimeOutbox } from '../../trip/realtime/trip-realtime.outbox.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { InMemoryJobQueue } from 'src/shared/background/in-memory-job-queue';
import { getTelemetryConfig } from '../common/telemetry.config';
import { TripPricingService } from '../../trip/pricing/trip-pricing.service';
import { TripPricingJobName } from '../../trip/pricing/trip-pricing-jobs';
import { TripRealtimePublisher } from '../../trip/services/trip-realtime.publisher';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { TelemetryNotFoundException } from '../common/errors';
import { TelemetryCreate } from '../entities/dto/telemetry.create';
import { TelemetryRepository } from '../repositories/telemetry.repository';
import { TelemetryService } from './telemetry.service';

describe('TelemetryService (integration)', () => {
  let prisma: PrismaService;
  let service: TelemetryService;
  let userId: string;
  let carId: string;
  let geoZoneVersionId: string;
  let tripId: string;

  beforeAll(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
  });

  beforeEach(async () => {
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
        name: `Telemetry service ${suffix.slice(0, 10)}`,
        email: `telemetry-service-${suffix}@test.local`,
        phone: `+79${suffix.replace(/[a-f]/gi, '7').slice(0, 10)}`,
        passwordHash: 'hash',
        role: 0,
        isActive: true,
        isDeleted: false,
      },
    });
    userId = user.id;

    const car = await prisma.car.create({
      data: {
        brand: 'Telemetry',
        model: 'ServiceSpec',
        licensePlate: `TS${suffix.slice(0, 8)}`,
        color: 'blue',
        mileage: 2000,
        fuelLevel: 55,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      },
    });
    carId = car.id;

    const geozoneRepository = new GeozoneRepository(prisma);
    const zone = await geozoneRepository.createWithInitialVersion({
      name: 'Telemetry service zone',
      type: GeozoneType.RENTAL,
      color: '#505050',
      createdByUserId: userId,
      geometry: sampleMultiPolygon(0),
      rules: null,
      pricePerMinute: 1,
      pricePerKm: 2,
      pausePricePerMinute: 0.5,
    });
    if (!zone.currentVersionId) {
      throw new Error('currentVersionId expected');
    }
    geoZoneVersionId = zone.currentVersionId;

    tripId = (
      await prisma.trip.create({
        data: {
          userId,
          carId,
          geoZoneVersionId,
          startedAt: new Date('2026-04-21T12:00:00.000Z'),
          distance: 0,
          duration: 0,
          status: 0,
        },
      })
    ).id;

    const tripOutbox: ITripRealtimeOutbox = {
      publish: async () => undefined,
    };
    const tripRepository = new TripRepository(prisma);
    const publisher = new TripRealtimePublisher(tripOutbox);
    const pricingQueue = new InMemoryJobQueue();
    const pricingService = new TripPricingService(
      tripRepository,
      geozoneRepository,
      new TelemetryRepository(prisma),
      pricingQueue,
      publisher,
    );

    service = new TelemetryService(
      new TelemetryRepository(prisma),
      new InMemoryJobQueue(),
      tripOutbox,
      tripRepository,
      pricingService,
    );
  });

  afterEach(async () => {
    await truncateApplicationTable(prisma, 'telemetry');
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff_preset');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('создаёт запись телеметрии и возвращает TelemetryRead', async () => {
      const created = await service.create(
        buildTelemetryCreate(tripId, '2026-04-21T12:01:00.000Z'),
      );
      expect(created.id).toBeTruthy();
      expect(created.tripId).toBe(tripId);
      expect(created.lat).toBe(55.75);
    });

    it('ставит pricing job после persist, но не при ingest throttle', async () => {
      const pricingQueue = new InMemoryJobQueue();
      const tripRepository = new TripRepository(prisma);
      const tripOutbox: ITripRealtimeOutbox = {
        publish: async () => undefined,
      };
      const publisher = new TripRealtimePublisher(tripOutbox);
      const pricingService = new TripPricingService(
        tripRepository,
        new GeozoneRepository(prisma),
        new TelemetryRepository(prisma),
        pricingQueue,
        publisher,
      );
      const localService = new TelemetryService(
        new TelemetryRepository(prisma),
        new InMemoryJobQueue(),
        tripOutbox,
        tripRepository,
        pricingService,
      );

      await localService.create(
        buildTelemetryCreate(tripId, '2026-04-21T12:03:00.000Z'),
      );
      const first = pricingQueue.dequeue();
      expect(first?.name).toBe(TripPricingJobName.Recalc);
      expect(first?.payload).toMatchObject({
        tripId,
        trigger: 'telemetry',
      });

      await localService.create(
        buildTelemetryCreate(tripId, '2026-04-21T12:03:01.000Z'),
      );
      expect(pricingQueue.dequeue()).toBeNull();

      const prevPeriod = process.env.TELEMETRY_PERIOD_SEC;
      process.env.TELEMETRY_PERIOD_SEC = '1';
      await new Promise((resolve) =>
        setTimeout(resolve, getTelemetryConfig().periodSec * 1000 + 50),
      );
      await localService.create(
        buildTelemetryCreate(tripId, '2026-04-21T12:03:02.000Z'),
      );
      if (prevPeriod === undefined) {
        delete process.env.TELEMETRY_PERIOD_SEC;
      } else {
        process.env.TELEMETRY_PERIOD_SEC = prevPeriod;
      }
      expect(pricingQueue.dequeue()?.name).toBe(TripPricingJobName.Recalc);
    });
  });

  describe('findById', () => {
    it('возвращает запись по id', async () => {
      const created = await service.create(
        buildTelemetryCreate(tripId, '2026-04-21T12:02:00.000Z'),
      );
      const found = await service.findById(created.id);
      expect(found.id).toBe(created.id);
    });

    it('бросает TelemetryNotFoundException для неизвестного id', async () => {
      await expect(service.findById(uuidv4())).rejects.toThrow(
        TelemetryNotFoundException,
      );
    });
  });

  describe('findManyByTripId', () => {
    it('возвращает список записей по tripId', async () => {
      const prevPeriod = process.env.TELEMETRY_PERIOD_SEC;
      process.env.TELEMETRY_PERIOD_SEC = '1';
      await service.create(
        buildTelemetryCreate(tripId, '2026-04-21T12:00:00.000Z'),
      );
      await new Promise((resolve) => setTimeout(resolve, 1_100));
      await service.create(
        buildTelemetryCreate(tripId, '2026-04-21T12:01:00.000Z'),
      );
      if (prevPeriod === undefined) {
        delete process.env.TELEMETRY_PERIOD_SEC;
      } else {
        process.env.TELEMETRY_PERIOD_SEC = prevPeriod;
      }

      const list = await service.findManyByTripId(tripId);
      expect(list).toHaveLength(2);
    });
  });
});

function buildTelemetryCreate(
  tripId: string,
  timestamp: string,
): TelemetryCreate {
  const dto = new TelemetryCreate();
  dto.timestamp = timestamp;
  dto.lat = 55.75;
  dto.lon = 37.61;
  dto.speed = 33.3;
  dto.acceleration = 0.9;
  dto.fuelLevel = 44;
  dto.tripId = tripId;
  return dto;
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
