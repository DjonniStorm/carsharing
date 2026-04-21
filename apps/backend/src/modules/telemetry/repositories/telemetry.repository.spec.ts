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
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { TelemetryCreate } from '../entities/dto/telemetry.create';
import { TelemetryRepository } from './telemetry.repository';

describe('TelemetryRepository', () => {
  let prisma: PrismaService;
  let repository: TelemetryRepository;
  let userId: string;
  let carId: string;
  let tariffVersionId: string;
  let tripId: string;
  let secondTripId: string;

  beforeAll(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await truncateApplicationTable(prisma, 'telemetry');
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');

    const suffix = uuidv4().replace(/-/g, '');
    const user = await prisma.user.create({
      data: {
        name: `Telemetry repo ${suffix.slice(0, 10)}`,
        email: `telemetry-repo-${suffix}@test.local`,
        phone: `+79${suffix.replace(/[a-f]/gi, '5').slice(0, 10)}`,
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
        model: 'Spec',
        licensePlate: `TM${suffix.slice(0, 8)}`,
        color: 'gray',
        mileage: 5000,
        fuelLevel: 50,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      },
    });
    carId = car.id;

    const geozoneRepository = new GeozoneRepository(prisma);
    const zone = await geozoneRepository.createWithInitialVersion({
      name: 'Telemetry repo zone',
      type: GeozoneType.RENTAL,
      color: '#444444',
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
    tariffVersionId = zone.currentVersionId;

    tripId = (
      await prisma.trip.create({
        data: {
          userId,
          carId,
          tariffVersionId,
          startedAt: new Date('2026-04-21T10:00:00.000Z'),
          distance: 0,
          duration: 0,
          status: 0,
        },
      })
    ).id;
    secondTripId = (
      await prisma.trip.create({
        data: {
          userId,
          carId,
          tariffVersionId,
          startedAt: new Date('2026-04-21T11:00:00.000Z'),
          distance: 0,
          duration: 0,
          status: 0,
        },
      })
    ).id;

    repository = new TelemetryRepository(prisma);
  });

  afterEach(async () => {
    await truncateApplicationTable(prisma, 'telemetry');
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('создаёт запись телеметрии для существующего tripId', async () => {
      const created = await repository.create(
        buildTelemetryCreate(tripId, '2026-04-21T10:01:00.000Z'),
      );

      expect(created.id).toBeTruthy();
      expect(created.tripId).toBe(tripId);
      expect(created.speed).toBe(42.5);
      expect(created.timestamp.toISOString()).toBe('2026-04-21T10:01:00.000Z');
    });

    it('бросает ошибку при несуществующем tripId (FK)', async () => {
      await expect(
        repository.create(
          buildTelemetryCreate(uuidv4(), '2026-04-21T10:02:00.000Z'),
        ),
      ).rejects.toMatchObject({ code: 'P2003' });
    });
  });

  describe('findById', () => {
    it('возвращает запись по id', async () => {
      const created = await repository.create(
        buildTelemetryCreate(tripId, '2026-04-21T10:03:00.000Z'),
      );

      const found = await repository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.tripId).toBe(tripId);
    });

    it('возвращает null, если id не найден', async () => {
      const found = await repository.findById(uuidv4());
      expect(found).toBeNull();
    });
  });

  describe('findManyByTripId', () => {
    it('возвращает пустой массив, если данных нет', async () => {
      const list = await repository.findManyByTripId(tripId);
      expect(list).toEqual([]);
    });

    it('фильтрует по tripId', async () => {
      await repository.create(
        buildTelemetryCreate(tripId, '2026-04-21T10:00:00.000Z'),
      );
      await repository.create(
        buildTelemetryCreate(secondTripId, '2026-04-21T10:00:30.000Z'),
      );

      const list = await repository.findManyByTripId(tripId);
      expect(list).toHaveLength(1);
      expect(list[0].tripId).toBe(tripId);
    });

    it('применяет параметр timeFrom', async () => {
      await repository.create(
        buildTelemetryCreate(tripId, '2026-04-21T10:00:00.000Z'),
      );
      await repository.create(
        buildTelemetryCreate(tripId, '2026-04-21T10:05:00.000Z'),
      );

      const list = await repository.findManyByTripId(
        tripId,
        new Date('2026-04-21T10:01:00.000Z'),
      );
      expect(list).toHaveLength(1);
      expect(list[0].timestamp.toISOString()).toBe('2026-04-21T10:05:00.000Z');
    });

    it('применяет параметр timeTo', async () => {
      await repository.create(
        buildTelemetryCreate(tripId, '2026-04-21T10:00:00.000Z'),
      );
      await repository.create(
        buildTelemetryCreate(tripId, '2026-04-21T10:05:00.000Z'),
      );

      const list = await repository.findManyByTripId(
        tripId,
        undefined,
        new Date('2026-04-21T10:01:00.000Z'),
      );
      expect(list).toHaveLength(1);
      expect(list[0].timestamp.toISOString()).toBe('2026-04-21T10:00:00.000Z');
    });

    it('применяет параметр limit', async () => {
      await repository.create(
        buildTelemetryCreate(tripId, '2026-04-21T10:00:00.000Z'),
      );
      await repository.create(
        buildTelemetryCreate(tripId, '2026-04-21T10:01:00.000Z'),
      );

      const list = await repository.findManyByTripId(
        tripId,
        undefined,
        undefined,
        1,
      );
      expect(list).toHaveLength(1);
    });

    it('применяет параметр offset', async () => {
      await repository.create(
        buildTelemetryCreate(tripId, '2026-04-21T10:00:00.000Z'),
      );
      await repository.create(
        buildTelemetryCreate(tripId, '2026-04-21T10:01:00.000Z'),
      );

      const list = await repository.findManyByTripId(
        tripId,
        undefined,
        undefined,
        undefined,
        1,
      );
      expect(list).toHaveLength(1);
      expect(list[0].timestamp.toISOString()).toBe('2026-04-21T10:01:00.000Z');
    });

    it('применяет параметр sort', async () => {
      const first = buildTelemetryCreate(tripId, '2026-04-21T10:00:00.000Z');
      const second = buildTelemetryCreate(tripId, '2026-04-21T10:01:00.000Z');
      await repository.create(first);
      await repository.create(second);

      const list = await repository.findManyByTripId(
        tripId,
        undefined,
        undefined,
        undefined,
        undefined,
        'desc',
      );
      expect(list).toHaveLength(2);
      expect(list[0].timestamp.toISOString()).toBe(second.timestamp);
      expect(list[1].timestamp.toISOString()).toBe(first.timestamp);
    });

    it('возвращает пустой массив для несуществующего tripId', async () => {
      const list = await repository.findManyByTripId(uuidv4());
      expect(list).toEqual([]);
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
  dto.speed = 42.5;
  dto.acceleration = 1.2;
  dto.fuelLevel = 48;
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
