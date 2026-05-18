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

import { GeozoneRepository } from '../../geozone/repositories/geozone.repository';
import type {
  GeoJSONMultiPolygon,
  GeoJSONPosition,
} from '../../geozone/entities/geozone.geometry';
import { GeozoneType } from '../../geozone/entities/geozone.type';
import { CarStatus } from '../../car/entities/car-status';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import {
  TripNotFoundException,
  TripRelationNotFoundException,
} from '../common/errors';
import { TripCreate } from '../entities/dtos/trip.create';
import { TripUpdate } from '../entities/dtos/trip.update';
import { TripStatus } from '../entities/trip.status';
import { InMemoryJobQueue } from 'src/shared/background/in-memory-job-queue';
import { TelemetryRepository } from '../../telemetry/repositories/telemetry.repository';
import { TripGateway } from '../gateways/trip.gateway';
import { TripPricingService } from '../pricing/trip-pricing.service';
import { LoggerTripRealtimeOutbox } from '../realtime/trip-realtime.outbox.logger';
import { TripRepository } from '../repositories/trip.repository';
import { TripRealtimePublisher } from './trip-realtime.publisher';
import { TripService } from './trip.service';

describe('TripService (integration)', () => {
  let prisma: PrismaService;
  let service: TripService;
  let userId: string;
  let carId: string;
  let geoZoneVersionId: string;
  let geoZoneVersionIdOther: string;

  beforeAll(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff_preset');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');

    const suffix = uuidv4().replace(/-/g, '');
    const user = await prisma.user.create({
      data: {
        name: `Trip service ${suffix.slice(0, 12)}`,
        email: `trip-service-${suffix}@test.local`,
        phone: `+78${suffix.replace(/[a-f]/gi, '6').slice(0, 10)}`,
        passwordHash: 'hash',
        role: 0,
        isActive: true,
        isDeleted: false,
      },
    });
    userId = user.id;

    const car = await prisma.car.create({
      data: {
        brand: 'Trip',
        model: 'Service',
        licensePlate: `TS${suffix.slice(0, 8)}`,
        color: 'white',
        mileage: 1_000,
        fuelLevel: 50,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      },
    });
    carId = car.id;

    const geozoneRepository = new GeozoneRepository(prisma);
    const firstZone = await geozoneRepository.createWithInitialVersion({
      name: 'Trip service zone',
      type: GeozoneType.RENTAL,
      color: '#404040',
      createdByUserId: userId,
      geometry: sampleMultiPolygon(0),
      rules: null,
      pricePerMinute: 1,
      pricePerKm: 2,
      pausePricePerMinute: 0.5,
    });
    const secondZone = await geozoneRepository.createWithInitialVersion({
      name: 'Trip service zone 2',
      type: GeozoneType.RENTAL,
      color: '#505050',
      createdByUserId: userId,
      geometry: sampleMultiPolygon(1),
      rules: null,
      pricePerMinute: 3,
      pricePerKm: 4,
      pausePricePerMinute: 1,
    });
    if (!firstZone.currentVersionId || !secondZone.currentVersionId) {
      throw new Error('currentVersionId must exist for trip tests');
    }
    geoZoneVersionId = firstZone.currentVersionId;
    geoZoneVersionIdOther = secondZone.currentVersionId;

    const tripRepository = new TripRepository(prisma);
    const publisher = new TripRealtimePublisher(
      new LoggerTripRealtimeOutbox({
        publish: () => undefined,
      } as Pick<TripGateway, 'publish'>),
    );
    const pricingService = new TripPricingService(
      tripRepository,
      geozoneRepository,
      new TelemetryRepository(prisma),
      new InMemoryJobQueue(),
      publisher,
    );
    service = new TripService(
      tripRepository,
      publisher,
      new InMemoryJobQueue(),
      pricingService,
    );
  });

  afterEach(async () => {
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff_preset');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');
  });

  afterAll(async () => {
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff_preset');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('creates trip and returns TripRead', async () => {
      const created = await service.create(
        createTripInput({
          userId,
          carId,
          geoZoneVersionId,
          status: TripStatus.STARTED,
          startLat: 55.75,
          startLng: 37.61,
        }),
      );
      expect(created.id).toBeTruthy();
      expect(created.userId).toBe(userId);
      expect(created.carId).toBe(carId);
      expect(created.geoZoneVersionId).toBe(geoZoneVersionId);
      expect(created.status).toBe(TripStatus.STARTED);
      expect(created.startLat).toBe(55.75);
      expect(created.startLng).toBe(37.61);
    });

    it('maps FK errors to TripRelationNotFoundException', async () => {
      await expect(
        service.create(
          createTripInput({
            userId,
            carId,
            geoZoneVersionId: uuidv4(),
          }),
        ),
      ).rejects.toThrow(TripRelationNotFoundException);
    });
  });

  describe('findMany', () => {
    it('returns empty list for no rows', async () => {
      const list = await service.findMany();
      expect(list).toEqual([]);
    });

    it('supports filters by status and geoZoneVersionId', async () => {
      await service.create(
        createTripInput({
          userId,
          carId,
          geoZoneVersionId,
          status: TripStatus.PENDING,
        }),
      );
      const active = await service.create(
        createTripInput({
          userId,
          carId,
          geoZoneVersionId: geoZoneVersionIdOther,
          status: TripStatus.ACTIVE,
        }),
      );
      const filtered = await service.findMany({
        status: TripStatus.ACTIVE,
        geoZoneVersionId: geoZoneVersionIdOther,
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(active.id);
    });
  });

  describe('findById', () => {
    it('returns item by id', async () => {
      const created = await service.create(
        createTripInput({
          userId,
          carId,
          geoZoneVersionId,
        }),
      );
      const found = await service.findById(created.id, {
        withUser: true,
        withCar: true,
        withGeoZoneVersion: true,
      });
      expect(found.id).toBe(created.id);
      expect(found.geoZoneVersionId).toBe(geoZoneVersionId);
    });

    it('throws TripNotFoundException for unknown id', async () => {
      await expect(service.findById(uuidv4())).rejects.toThrow(
        TripNotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates mutable fields and ignores client billing on finish', async () => {
      const created = await service.create(
        createTripInput({
          userId,
          carId,
          geoZoneVersionId,
          status: TripStatus.ACTIVE,
        }),
      );
      const startedAt = new Date(Date.now() - 10 * 60 * 1000);
      await prisma.trip.update({
        where: { id: created.id },
        data: { startedAt },
      });

      const patch = new TripUpdate();
      patch.status = TripStatus.FINISHED;
      patch.finishedAt = new Date();
      patch.distanceMeters = 12_345;
      patch.priceTotal = 321.5;
      const updated = await service.update(created.id, patch);
      expect(updated.status).toBe(TripStatus.FINISHED);
      expect(updated.geoZoneVersionId).toBe(geoZoneVersionId);
      expect(updated.priceTotal).not.toBe(321.5);
      expect(updated.chargedMinutes).toBe(10);
      expect(updated.priceTime).toBe(10);
    });

    it('throws TripNotFoundException for unknown id', async () => {
      await expect(service.update(uuidv4(), new TripUpdate())).rejects.toThrow(
        TripNotFoundException,
      );
    });
  });
});

function createTripInput(overrides: Partial<TripCreate>): TripCreate {
  const dto = new TripCreate();
  dto.userId = overrides.userId ?? uuidv4();
  dto.carId = overrides.carId ?? uuidv4();
  dto.geoZoneVersionId = overrides.geoZoneVersionId ?? uuidv4();
  dto.status = overrides.status;
  dto.startLat = overrides.startLat;
  dto.startLng = overrides.startLng;
  dto.carPlateSnapshot = overrides.carPlateSnapshot;
  dto.carDisplayNameSnapshot = overrides.carDisplayNameSnapshot;
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
