import { randomUUID } from 'node:crypto';
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
import type { GeoJSONMultiPolygon, GeoJSONPosition } from '../../geozone/entities/geozone.geometry';
import { GeozoneType } from '../../geozone/entities/geozone.type';
import { CarStatus } from '../../car/entities/car-status';
import { TripStatus } from '../entities/trip.status';
import type { TripEntity } from '../entities/trip.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { TripRepository } from './trip.repository';

describe('TripRepository', () => {
  let prisma: PrismaService;
  let repository: TripRepository;
  let geozoneRepository: GeozoneRepository;
  let userId: string;
  let carId: string;
  let tariffVersionId: string;
  let tariffVersionIdOther: string;

  beforeAll(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');

    const suffix = uuidv4().replace(/-/g, '');
    const user = await prisma.user.create({
      data: {
        name: `Trip repo ${suffix.slice(0, 12)}`,
        email: `trip-repo-${suffix}@test.local`,
        phone: `+76${suffix.replace(/[a-f]/gi, '3').slice(0, 10)}`,
        passwordHash: 'hash',
        role: 0,
        isActive: true,
        isDeleted: false,
      },
    });
    userId = user.id;

    const car = await prisma.car.create({
      data: {
        brand: 'Test',
        model: 'TripSpec',
        licensePlate: `TR${suffix.slice(0, 8)}`,
        color: 'black',
        mileage: 1000,
        fuelLevel: 50,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      },
    });
    carId = car.id;

    geozoneRepository = new GeozoneRepository(prisma);
    const zone = await geozoneRepository.createWithInitialVersion({
      name: 'Зона для поездки',
      type: GeozoneType.RENTAL,
      color: '#333333',
      createdByUserId: userId,
      geometry: sampleMultiPolygon(0),
      rules: null,
      pricePerMinute: 1,
      pricePerKm: 2,
      pausePricePerMinute: 0.5,
    });
    if (!zone.currentVersionId) {
      throw new Error('ожидался currentVersionId у созданной зоны');
    }
    tariffVersionId = zone.currentVersionId;

    const zoneOther = await geozoneRepository.createWithInitialVersion({
      name: 'Вторая зона',
      type: GeozoneType.RENTAL,
      color: '#444444',
      createdByUserId: userId,
      geometry: sampleMultiPolygon(1),
      rules: null,
      pricePerMinute: 3,
      pricePerKm: 4,
      pausePricePerMinute: 1,
    });
    if (!zoneOther.currentVersionId) {
      throw new Error('ожидался currentVersionId у второй зоны');
    }
    tariffVersionIdOther = zoneOther.currentVersionId;

    repository = new TripRepository(prisma);
  });

  afterEach(async () => {
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');
  });

  afterAll(async () => {
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');
    await prisma.$disconnect();
  });

  describe('findMany', () => {
    it('возвращает пустой массив, если поездок нет', async () => {
      const list = await repository.findMany();
      expect(list).toEqual([]);
    });

    it('возвращает созданные поездки и сортирует по startedAt по убыванию', async () => {
      const older = new Date('2024-01-10T10:00:00.000Z');
      const newer = new Date('2024-02-20T12:00:00.000Z');
      const first = await repository.create({
        userId,
        carId,
        tariffVersionId,
        startedAt: older,
      });
      const second = await repository.create({
        userId,
        carId,
        tariffVersionId,
        startedAt: newer,
      });
      const list = await repository.findMany();
      expect(list.map((t) => t.id)).toEqual([second.id, first.id]);
    });

    it('фильтрует по userId, carId, tariffVersionId и status', async () => {
      await repository.create({
        userId,
        carId,
        tariffVersionId,
        status: TripStatus.PENDING,
      });
      const active = await repository.create({
        userId,
        carId,
        tariffVersionId: tariffVersionIdOther,
        status: TripStatus.ACTIVE,
      });

      const byUser = await repository.findMany({ userId });
      expect(byUser).toHaveLength(2);

      const byCar = await repository.findMany({ carId });
      expect(byCar).toHaveLength(2);

      const byVersion = await repository.findMany({
        tariffVersionId: tariffVersionIdOther,
      });
      expect(byVersion.map((t) => t.id)).toEqual([active.id]);

      const byStatus = await repository.findMany({ status: TripStatus.ACTIVE });
      expect(byStatus.map((t) => t.id)).toEqual([active.id]);
    });

    it('фильтрует по startedAfter / startedBefore', async () => {
      await repository.create({
        userId,
        carId,
        tariffVersionId,
        startedAt: new Date('2024-03-01T00:00:00.000Z'),
      });
      await repository.create({
        userId,
        carId,
        tariffVersionId,
        startedAt: new Date('2024-06-15T00:00:00.000Z'),
      });

      const mid = await repository.findMany({
        startedAfter: new Date('2024-04-01T00:00:00.000Z'),
        startedBefore: new Date('2024-07-01T00:00:00.000Z'),
      });
      expect(mid).toHaveLength(1);
      expect(mid[0].startedAt.toISOString().startsWith('2024-06-15')).toBe(
        true,
      );
    });
  });

  describe('findById', () => {
    it('возвращает null, если поездки с таким id нет', async () => {
      const found = await repository.findById(9_999_999);
      expect(found).toBeNull();
    });

    it('возвращает поездку по id с полями сущности', async () => {
      const created = await repository.create({
        userId,
        carId,
        tariffVersionId,
        status: TripStatus.STARTED,
        startLat: 55.75,
        startLng: 37.61,
        carPlateSnapshot: 'A123BC77',
        carDisplayNameSnapshot: 'Test Car',
      });
      const found = await repository.findById(Number(created.id));
      expect(found).not.toBeNull();
      assertTripScalarsEqual(found!, created);
    });

    it('опции withUser / withCar / withTariffVersion не ломают выборку (include в Prisma)', async () => {
      const created = await repository.create({
        userId,
        carId,
        tariffVersionId,
      });
      const id = Number(created.id);
      const withAll = await repository.findById(id, {
        withUser: true,
        withCar: true,
        withTariffVersion: true,
      });
      expect(withAll).not.toBeNull();
      assertTripScalarsEqual(withAll!, created);

      const row = await prisma.trip.findUnique({
        where: { id },
        include: { user: true, car: true, tariffVersion: true },
      });
      expect(row?.user?.id).toBe(userId);
      expect(row?.car?.id).toBe(carId);
      expect(row?.tariffVersion?.id).toBe(tariffVersionId);
    });
  });

  describe('create', () => {
    it('создаёт поездку с дефолтами status и временем', async () => {
      const before = Date.now();
      const created = await repository.create({
        userId,
        carId,
        tariffVersionId,
      });
      expect(created.status).toBe(TripStatus.PENDING);
      expect(created.startedAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
      expect(created.distance).toBe(0);
      expect(created.duration).toBe(0);
      expect(created.tariffVersionId).toBe(tariffVersionId);
    });

    it('P2003 при несуществующем tariffVersionId', async () => {
      await expect(
        repository.create({
          userId,
          carId,
          tariffVersionId: randomUUID(),
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });

    it('P2003 при несуществующем userId', async () => {
      await expect(
        repository.create({
          userId: randomUUID(),
          carId,
          tariffVersionId,
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });
  });

  describe('update', () => {
    it('обновляет поля и возвращает актуальную сущность', async () => {
      const t = await repository.create({
        userId,
        carId,
        tariffVersionId,
      });
      const id = Number(t.id);
      const finishedAt = new Date('2024-08-01T15:30:00.000Z');
      const updated = await repository.update(id, {
        status: TripStatus.FINISHED,
        finishedAt,
        distanceMeters: 12_500,
        priceTotal: 199.5,
        tariffVersionId: tariffVersionIdOther,
      });
      expect(updated.status).toBe(TripStatus.FINISHED);
      expect(updated.finishedAt?.getTime()).toBe(finishedAt.getTime());
      expect(updated.distanceMeters).toBe(12_500);
      expect(updated.priceTotal).toBe(199.5);
      expect(updated.tariffVersionId).toBe(tariffVersionIdOther);

      const again = await repository.findById(id);
      expect(again!.tariffVersionId).toBe(tariffVersionIdOther);
    });

    it('P2025 если поездки с таким id нет', async () => {
      await expect(
        repository.update(9_999_999, { status: TripStatus.FINISHED }),
      ).rejects.toMatchObject({ code: 'P2025' });
    });
  });
});

const assertTripScalarsEqual = (actual: TripEntity, expected: TripEntity) => {
  expect(actual.id).toBe(expected.id);
  expect(actual.userId).toBe(expected.userId);
  expect(actual.carId).toBe(expected.carId);
  expect(actual.tariffVersionId).toBe(expected.tariffVersionId);
  expect(actual.status).toBe(expected.status);
  expect(actual.startedAt.getTime()).toBe(expected.startedAt.getTime());
  expect(actual.finishedAt).toEqual(expected.finishedAt);
  expect(actual.pauseStartedAt).toEqual(expected.pauseStartedAt);
  expect(actual.totalPausedSec).toBe(expected.totalPausedSec);
  expect(actual.startLat).toBe(expected.startLat);
  expect(actual.startLng).toBe(expected.startLng);
  expect(actual.finishLat).toBe(expected.finishLat);
  expect(actual.finishLng).toBe(expected.finishLng);
  expect(actual.distance).toBe(expected.distance);
  expect(actual.duration).toBe(expected.duration);
  expect(actual.distanceMeters).toBe(expected.distanceMeters);
  expect(actual.chargedMinutes).toBe(expected.chargedMinutes);
  expect(actual.chargedKm).toBe(expected.chargedKm);
  expect(actual.priceTime).toBe(expected.priceTime);
  expect(actual.priceDistance).toBe(expected.priceDistance);
  expect(actual.pricePause).toBe(expected.pricePause);
  expect(actual.priceTotal).toBe(expected.priceTotal);
  expect(actual.createdAt.getTime()).toBe(expected.createdAt.getTime());
  expect(actual.updatedAt.getTime()).toBe(expected.updatedAt.getTime());
  expect(actual.carPlateSnapshot).toBe(expected.carPlateSnapshot);
  expect(actual.carDisplayNameSnapshot).toBe(expected.carDisplayNameSnapshot);
};

/** Как в `tariff.repository.spec.ts` / `geozone.repository.spec.ts`. */
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
