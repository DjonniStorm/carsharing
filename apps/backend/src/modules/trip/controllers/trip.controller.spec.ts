import { BadRequestException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
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
import type { AuthenticatedUser } from 'src/modules/auth/types/authenticated-user';
import { UserRole } from 'src/modules/user/entities/user.role';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { TripCreate } from '../entities/dtos/trip.create';
import { TripUpdate } from '../entities/dtos/trip.update';
import { TripStatus } from '../entities/trip.status';
import { InMemoryJobQueue } from 'src/shared/background/in-memory-job-queue';
import { CarRepository } from '../../car/repositories/car.repository';
import { CarTripSyncService } from '../../car/services/car-trip-sync.service';
import { TelemetryRepository } from '../../telemetry/repositories/telemetry.repository';
import { ViolationRepository } from '../../violation/repositories/violation.repository';
import { TripGateway } from '../gateways/trip.gateway';
import { TripPricingService } from '../pricing/trip-pricing.service';
import { LoggerTripRealtimeOutbox } from '../realtime/trip-realtime.outbox.logger';
import { TripRepository } from '../repositories/trip.repository';
import { TripService } from '../services/trip.service';
import { TripController } from './trip.controller';
import { TripRealtimePublisher } from '../services/trip-realtime.publisher';

const adminActor = (): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-000000000001',
  role: UserRole.MANAGER,
});

const driverActor = (userId: string): AuthenticatedUser => ({
  id: userId,
  role: UserRole.DRIVER,
});

describe('TripController', () => {
  let prisma: PrismaService;
  let controller: TripController;
  let userId: string;
  let carId: string;
  let carId2: string;
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
        name: `Trip ctrl ${suffix.slice(0, 12)}`,
        email: `trip-ctrl-${suffix}@test.local`,
        phone: `+74${suffix.replace(/[a-f]/gi, '8').slice(0, 10)}`,
        passwordHash: 'hash',
        role: 0,
        isActive: true,
        isDeleted: false,
      },
    });
    userId = user.id;

    const car = await prisma.car.create({
      data: {
        brand: 'Ctrl',
        model: 'Trip',
        licensePlate: `CT${suffix.slice(0, 8)}`,
        color: 'silver',
        mileage: 5_000,
        fuelLevel: 70,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      },
    });
    carId = car.id;

    const car2 = await prisma.car.create({
      data: {
        brand: 'Ctrl',
        model: 'Trip2',
        licensePlate: `CT2${suffix.slice(0, 7)}`,
        color: 'black',
        mileage: 3_000,
        fuelLevel: 65,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      },
    });
    carId2 = car2.id;

    const geozoneRepository = new GeozoneRepository(prisma);
    const firstZone = await geozoneRepository.createWithInitialVersion({
      name: 'Trip ctrl zone',
      type: GeozoneType.RENTAL,
      color: '#111111',
      createdByUserId: userId,
      geometry: sampleMultiPolygon(0),
      rules: null,
      pricePerMinute: 1,
      pricePerKm: 2,
      pausePricePerMinute: 0.5,
    });
    const secondZone = await geozoneRepository.createWithInitialVersion({
      name: 'Trip ctrl zone 2',
      type: GeozoneType.RENTAL,
      color: '#222222',
      createdByUserId: userId,
      geometry: sampleMultiPolygon(1),
      rules: null,
      pricePerMinute: 3,
      pricePerKm: 4,
      pausePricePerMinute: 1,
    });
    if (!firstZone.currentVersionId || !secondZone.currentVersionId) {
      throw new Error('currentVersionId expected');
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
    const carTripSync = new CarTripSyncService(
      new CarRepository(prisma),
      tripRepository,
      new TelemetryRepository(prisma),
      new ViolationRepository(prisma),
      publisher,
    );
    const service = new TripService(
      tripRepository,
      publisher,
      new InMemoryJobQueue(),
      pricingService,
      carTripSync,
    );
    controller = new TripController(service);
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
    it('creates trip', async () => {
      const created = await controller.create(
        driverActor(userId),
        buildTripCreate({ userId, carId, geoZoneVersionId }),
      );
      expect(created.id).toBeTruthy();
      expect(created.userId).toBe(userId);
      expect(created.carId).toBe(carId);
      expect(created.geoZoneVersionId).toBe(geoZoneVersionId);
    });

    it('maps invalid relation to BadRequest', async () => {
      await expect(
        controller.create(
          driverActor(userId),
          buildTripCreate({
            userId,
            carId,
            geoZoneVersionId: uuidv4(),
          }),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns empty list when no rows', async () => {
      const list = await controller.findAll(adminActor());
      expect(list).toEqual([]);
    });

    it('filters by geoZoneVersionId and status', async () => {
      await controller.create(
        driverActor(userId),
        buildTripCreate({
          userId,
          carId: carId2,
          geoZoneVersionId,
          status: TripStatus.PENDING,
        }),
      );
      const active = await controller.create(
        driverActor(userId),
        buildTripCreate({
          userId,
          carId,
          geoZoneVersionId: geoZoneVersionIdOther,
          status: TripStatus.ACTIVE,
        }),
      );

      const filtered = await controller.findAll(
        adminActor(),
        undefined,
        undefined,
        geoZoneVersionIdOther,
        String(TripStatus.ACTIVE),
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(active.id);
    });

    it('rejects non-integer status query', async () => {
      await expect(
        controller.findAll(
          adminActor(),
          undefined,
          undefined,
          undefined,
          '1.2',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid status enum value', async () => {
      await expect(
        controller.findAll(adminActor(), undefined, undefined, undefined, '99'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid startedAfter date', async () => {
      await expect(
        controller.findAll(
          adminActor(),
          undefined,
          undefined,
          undefined,
          undefined,
          'bad-date',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects startedAfter > startedBefore', async () => {
      await expect(
        controller.findAll(
          adminActor(),
          undefined,
          undefined,
          undefined,
          undefined,
          '2025-01-02T00:00:00.000Z',
          '2025-01-01T00:00:00.000Z',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('returns trip by id', async () => {
      const created = await controller.create(
        driverActor(userId),
        buildTripCreate({ userId, carId, geoZoneVersionId }),
      );
      const found = await controller.findById(adminActor(), created.id);
      expect(found.id).toBe(created.id);
    });

    it('NotFound for missing id', async () => {
      await expect(controller.findById(adminActor(), uuidv4())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates status and geoZoneVersionId', async () => {
      const created = await controller.create(
        driverActor(userId),
        buildTripCreate({ userId, carId, geoZoneVersionId }),
      );
      const patch = new TripUpdate();
      patch.status = TripStatus.FINISHED;
      patch.geoZoneVersionId = geoZoneVersionIdOther;
      const updated = await controller.update(adminActor(), created.id, patch);
      expect(updated.status).toBe(TripStatus.FINISHED);
      expect(updated.geoZoneVersionId).toBe(geoZoneVersionIdOther);
    });

    it('NotFound for missing id', async () => {
      await expect(
        controller.update(adminActor(), uuidv4(), new TripUpdate()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('dto validation', () => {
    it('TripCreate: requires UUID ids and latitude range', async () => {
      const dto = buildTripCreate({
        userId: 'not-uuid',
        carId: 'bad',
        geoZoneVersionId: 'bad',
        startLat: 120,
      });
      const errors = await validate(dto);
      const props = errors.map((e) => e.property);
      expect(props).toContain('userId');
      expect(props).toContain('carId');
      expect(props).toContain('geoZoneVersionId');
      expect(props).toContain('startLat');
    });

    it('TripCreate: accepts boundary coords -90/90 and -180/180', async () => {
      const dto = buildTripCreate({
        userId,
        carId,
        geoZoneVersionId,
        startLat: -90,
        startLng: 180,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('TripUpdate: rejects negative totals and price > max', async () => {
      const dto = new TripUpdate();
      dto.totalPausedSec = -1;
      dto.priceTotal = 1_000_000_000_000;
      const errors = await validate(dto);
      const props = errors.map((e) => e.property);
      expect(props).toContain('totalPausedSec');
      expect(props).toContain('priceTotal');
    });

    it('TripUpdate: accepts zero values for billable fields', async () => {
      const dto = new TripUpdate();
      dto.totalPausedSec = 0;
      dto.distance = 0;
      dto.duration = 0;
      dto.priceTotal = 0;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});

function buildTripCreate(overrides: Partial<TripCreate>): TripCreate {
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
