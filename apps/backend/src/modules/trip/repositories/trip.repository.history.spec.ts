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
import { TripStatus } from '../entities/trip.status';
import { ViolationStatus } from '../../violation/entities/violation.status';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Car, Telemetry, Trip } from '@prisma/client';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import type {
  TripHistoryFullSqlRow,
  TripHistorySqlRow,
} from '../common/trip-history.types';
import { TripRepository } from './trip.repository';

describe('TripRepository (история поездок, raw SQL)', () => {
  let prisma: PrismaService;
  let repository: TripRepository;
  let geozoneRepository: GeozoneRepository;
  let userId: string;
  let otherUserId: string;
  let carId: string;
  let geoZoneVersionId: string;

  beforeAll(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await truncateApplicationTable(prisma, 'violation_notification');
    await truncateApplicationTable(prisma, 'notification');
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
        name: `Hist repo ${suffix.slice(0, 12)}`,
        email: `trip-hist-${suffix}@test.local`,
        phone: `+77${suffix.replace(/[a-f]/gi, '3').slice(0, 10)}`,
        passwordHash: 'hash',
        role: 0,
        isActive: true,
        isDeleted: false,
      },
    });
    userId = user.id;

    const otherUser = await prisma.user.create({
      data: {
        name: `Hist other ${suffix.slice(0, 12)}`,
        email: `trip-hist-other-${suffix}@test.local`,
        phone: `+78${suffix.replace(/[a-f]/gi, '4').slice(0, 10)}`,
        passwordHash: 'hash',
        role: 0,
        isActive: true,
        isDeleted: false,
      },
    });
    otherUserId = otherUser.id;

    const car = await prisma.car.create({
      data: {
        brand: 'HistBrand',
        model: 'HistModel',
        licensePlate: `HR${suffix.slice(0, 8)}`,
        color: 'silver',
        mileage: 42_500.5,
        fuelLevel: 77.25,
        isAvailable: false,
        carStatus: CarStatus.IN_USE,
        isDeleted: false,
        createdAt: '2023-05-01T10:00:00.000Z',
        updatedAt: '2024-01-02T12:00:00.000Z',
        lastKnownLat: 55.751244,
        lastKnownLon: 37.618423,
        lastPositionAt: '2024-06-01T08:30:00.000Z',
      },
    });
    carId = car.id;

    geozoneRepository = new GeozoneRepository(prisma);
    const zone = await geozoneRepository.createWithInitialVersion({
      name: 'Зона истории',
      type: GeozoneType.RENTAL,
      color: '#111111',
      createdByUserId: userId,
      geometry: sampleMultiPolygon(0),
      rules: null,
      pricePerMinute: 1,
      pricePerKm: 2,
      pausePricePerMinute: 0.5,
    });
    if (!zone.currentVersionId) {
      throw new Error('ожидался currentVersionId');
    }
    geoZoneVersionId = zone.currentVersionId;

    repository = new TripRepository(prisma);
  });

  afterEach(async () => {
    await truncateApplicationTable(prisma, 'violation_notification');
    await truncateApplicationTable(prisma, 'notification');
    await truncateApplicationTable(prisma, 'violation');
    await truncateApplicationTable(prisma, 'telemetry');
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff_preset');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');
  });

  afterAll(async () => {
    await truncateApplicationTable(prisma, 'violation_notification');
    await truncateApplicationTable(prisma, 'notification');
    await truncateApplicationTable(prisma, 'violation');
    await truncateApplicationTable(prisma, 'telemetry');
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff_preset');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');
    await prisma.$disconnect();
  });

  describe('findHistoryShortByUserId', () => {
    describe('trip_json', () => {
      it('совпадает со строкой trip в БД (скаляры без привязки дат к Prisma)', async () => {
        const startedAt = new Date('2025-04-01T09:00:00.000Z');
        const finishedAt = new Date('2025-04-01T10:30:00.000Z');
        const pauseStartedAt = new Date('2025-04-01T09:45:00.000Z');
        const created = await repository.create({
          userId,
          carId,
          geoZoneVersionId,
          status: TripStatus.FINISHED,
          startedAt,
          startLat: 55.1,
          startLng: 37.2,
          carPlateSnapshot: 'SNAP77',
          carDisplayNameSnapshot: 'Display Name',
        });
        await repository.update(created.id, {
          finishedAt,
          pauseStartedAt,
          totalPausedSec: 120,
          finishLat: 55.9,
          finishLng: 37.9,
          distance: 12.5,
          duration: 1.25,
          distanceMeters: 5000,
          chargedMinutes: 90,
          chargedKm: 15,
          priceTime: 100.5,
          priceDistance: 200.25,
          pricePause: 10,
          priceTotal: 310.75,
        });

        const row = await prisma.trip.findUnique({ where: { id: created.id } });
        expect(row).not.toBeNull();

        const [hist] = await repository.findHistoryShortByUserId(userId);
        expect(hist).toBeDefined();
        assertTripJsonMatchesPrismaRow(hist!.trip_json, row!);
      });
    });

    describe('car_json', () => {
      it('совпадает со строкой car, привязанной к поездке', async () => {
        await repository.create({
          userId,
          carId,
          geoZoneVersionId,
        });
        const carRow = await prisma.car.findUnique({ where: { id: carId } });
        expect(carRow).not.toBeNull();

        const [hist] = await repository.findHistoryShortByUserId(userId);
        expect(hist).toBeDefined();
        assertCarJsonMatchesPrismaRow(hist!.car_json, carRow!);
      });
    });

    describe('violations_json', () => {
      it('пустой массив, если нарушений нет', async () => {
        await repository.create({
          userId,
          carId,
          geoZoneVersionId,
        });
        const [hist] = await repository.findHistoryShortByUserId(userId);
        expect(hist).toBeDefined();
        expect(hist!.violations_json).toEqual([]);
      });

      it('содержит нарушения с корректными полями и порядком (раньше по времени — раньше в массиве)', async () => {
        const trip = await repository.create({
          userId,
          carId,
          geoZoneVersionId,
        });
        const t1 = new Date('2025-05-01T10:00:00.000Z');
        const t2 = new Date('2025-05-01T12:00:00.000Z');
        const vLate = await prisma.violation.create({
          data: {
            tripId: trip.id,
            type: ViolationStatus.LOW_FUEL,
            description: 'позже',
            createdAt: t2,
          },
        });
        const vEarly = await prisma.violation.create({
          data: {
            tripId: trip.id,
            type: ViolationStatus.SPEEDING,
            description: 'раньше',
            createdAt: t1,
          },
        });

        const [hist] = await repository.findHistoryShortByUserId(userId);
        expect(hist).toBeDefined();
        const arr = hist!.violations_json as ViolationJson[];
        expect(arr).toHaveLength(2);
        expect(arr[0].id).toBe(vEarly.id);
        expect(arr[0].tripId).toBe(trip.id);
        expect(arr[0].type).toBe(ViolationStatus.SPEEDING);
        expect(arr[0].description).toBe('раньше');
        assertParsableTimestamp(arr[0].createdAt);

        expect(arr[1].id).toBe(vLate.id);
        expect(arr[1].type).toBe(ViolationStatus.LOW_FUEL);
        expect(arr[1].description).toBe('позже');
        assertParsableTimestamp(arr[1].createdAt);
      });
    });

    it('возвращает пустой массив для несуществующего userId', async () => {
      await repository.create({
        userId,
        carId,
        geoZoneVersionId,
      });
      const list = await repository.findHistoryShortByUserId(uuidv4());
      expect(list).toEqual([]);
    });

    it('не возвращает поездки другого пользователя', async () => {
      await repository.create({
        userId,
        carId,
        geoZoneVersionId,
      });
      await repository.create({
        userId: otherUserId,
        carId,
        geoZoneVersionId,
      });

      const mine = await repository.findHistoryShortByUserId(userId);
      expect(mine).toHaveLength(1);
      expect(asTripJson(mine[0]!.trip_json).userId).toBe(userId);

      const other = await repository.findHistoryShortByUserId(otherUserId);
      expect(other).toHaveLength(1);
      expect(asTripJson(other[0]!.trip_json).userId).toBe(otherUserId);
    });

    it('сортирует по start_time по убыванию', async () => {
      const older = new Date('2024-01-10T10:00:00.000Z');
      const newer = new Date('2025-02-20T12:00:00.000Z');
      const first = await repository.create({
        userId,
        carId,
        geoZoneVersionId,
        startedAt: older,
      });
      const second = await repository.create({
        userId,
        carId,
        geoZoneVersionId,
        startedAt: newer,
      });

      const list = await repository.findHistoryShortByUserId(userId);
      expect(list.map((r) => asTripJson(r.trip_json).id)).toEqual([
        second.id,
        first.id,
      ]);
    });

    it('учитывает limit и offset', async () => {
      const t0 = new Date('2024-01-01T00:00:00.000Z');
      const t1 = new Date('2024-02-01T00:00:00.000Z');
      const t2 = new Date('2024-03-01T00:00:00.000Z');
      const a = await repository.create({
        userId,
        carId,
        geoZoneVersionId,
        startedAt: t0,
      });
      const b = await repository.create({
        userId,
        carId,
        geoZoneVersionId,
        startedAt: t1,
      });
      const c = await repository.create({
        userId,
        carId,
        geoZoneVersionId,
        startedAt: t2,
      });

      const page = await repository.findHistoryShortByUserId(userId, {
        limit: 2,
        offset: 1,
      });
      expect(page.map((r) => asTripJson(r.trip_json).id)).toEqual([b.id, a.id]);
      expect(page.map((r) => asTripJson(r.trip_json).id)).not.toContain(c.id);
    });
  });

  describe('findHistoryShortByTripId', () => {
    describe('trip_json', () => {
      it('совпадает со строкой trip в БД', async () => {
        const created = await repository.create({
          userId,
          carId,
          geoZoneVersionId,
          status: TripStatus.ACTIVE,
          startedAt: new Date('2025-07-01T08:00:00.000Z'),
        });
        const row = await prisma.trip.findUnique({ where: { id: created.id } });
        expect(row).not.toBeNull();

        const hist = await repository.findHistoryShortByTripId(created.id);
        expect(hist).not.toBeNull();
        assertTripJsonMatchesPrismaRow(hist!.trip_json, row!);
      });
    });

    describe('car_json', () => {
      it('совпадает с автомобилем поездки', async () => {
        const trip = await repository.create({
          userId,
          carId,
          geoZoneVersionId,
        });
        const carRow = await prisma.car.findUnique({ where: { id: carId } });
        const hist = await repository.findHistoryShortByTripId(trip.id);
        expect(hist).not.toBeNull();
        assertCarJsonMatchesPrismaRow(hist!.car_json, carRow!);
      });
    });

    describe('violations_json', () => {
      it('пустой массив без нарушений', async () => {
        const trip = await repository.create({
          userId,
          carId,
          geoZoneVersionId,
        });
        const hist = await repository.findHistoryShortByTripId(trip.id);
        expect(hist!.violations_json).toEqual([]);
      });

      it('агрегирует нарушения для этой поездки', async () => {
        const trip = await repository.create({
          userId,
          carId,
          geoZoneVersionId,
        });
        await prisma.violation.create({
          data: {
            tripId: trip.id,
            type: ViolationStatus.OUT_OF_GEOZONE,
            description: 'выезд',
          },
        });

        const hist = await repository.findHistoryShortByTripId(trip.id);
        const arr = hist!.violations_json as ViolationJson[];
        expect(arr).toHaveLength(1);
        expect(arr[0].tripId).toBe(trip.id);
        expect(arr[0].type).toBe(ViolationStatus.OUT_OF_GEOZONE);
        expect(arr[0].description).toBe('выезд');
      });
    });

    it('возвращает null, если поездки с таким id нет', async () => {
      const found = await repository.findHistoryShortByTripId(uuidv4());
      expect(found).toBeNull();
    });
  });

  describe('findHistoryFullByTripId', () => {
    describe('trip_json', () => {
      it('совпадает со строкой trip в БД (как в short)', async () => {
        const created = await repository.create({
          userId,
          carId,
          geoZoneVersionId,
          status: TripStatus.STARTED,
          startedAt: new Date('2025-08-01T11:00:00.000Z'),
        });
        const row = await prisma.trip.findUnique({ where: { id: created.id } });
        expect(row).not.toBeNull();

        const hist = await repository.findHistoryFullByTripId(created.id);
        expect(hist).not.toBeNull();
        assertTripJsonMatchesPrismaRow(hist!.trip_json, row!);
      });
    });

    describe('car_json', () => {
      it('совпадает с автомобилем поездки', async () => {
        const trip = await repository.create({
          userId,
          carId,
          geoZoneVersionId,
        });
        const carRow = await prisma.car.findUnique({ where: { id: carId } });
        const hist = await repository.findHistoryFullByTripId(trip.id);
        expect(hist).not.toBeNull();
        assertCarJsonMatchesPrismaRow(hist!.car_json, carRow!);
      });
    });

    describe('violations_json', () => {
      it('пустой массив без нарушений', async () => {
        const trip = await repository.create({
          userId,
          carId,
          geoZoneVersionId,
        });
        const hist = await repository.findHistoryFullByTripId(trip.id);
        expect(hist!.violations_json).toEqual([]);
      });

      it('агрегирует нарушения для поездки', async () => {
        const trip = await repository.create({
          userId,
          carId,
          geoZoneVersionId,
        });
        await prisma.violation.create({
          data: {
            tripId: trip.id,
            type: ViolationStatus.WRONG_PARKING,
            description: 'парковка',
          },
        });

        const hist = await repository.findHistoryFullByTripId(trip.id);
        const arr = hist!.violations_json as ViolationJson[];
        expect(arr).toHaveLength(1);
        expect(arr[0].tripId).toBe(trip.id);
        expect(arr[0].type).toBe(ViolationStatus.WRONG_PARKING);
        expect(arr[0].description).toBe('парковка');
      });
    });

    describe('telemetry_json', () => {
      it('пустой массив без точек телеметрии', async () => {
        const trip = await repository.create({
          userId,
          carId,
          geoZoneVersionId,
        });
        const hist = await repository.findHistoryFullByTripId(trip.id);
        expect(hist!.telemetry_json).toEqual([]);
      });

      it('возвращает точки с полями как в БД и порядок по возрастанию timestamp', async () => {
        const trip = await repository.create({
          userId,
          carId,
          geoZoneVersionId,
        });
        const tsLate = new Date('2025-09-10T15:00:00.000Z');
        const tsEarly = new Date('2025-09-10T12:00:00.000Z');
        const telLate = await prisma.telemetry.create({
          data: {
            tripId: trip.id,
            timestamp: tsLate,
            lat: 55.777,
            lon: 37.555,
            speed: 60,
            acceleration: 0.5,
            fuelLevel: 40,
          },
        });
        const telEarly = await prisma.telemetry.create({
          data: {
            tripId: trip.id,
            timestamp: tsEarly,
            lat: 55.111,
            lon: 37.222,
            speed: 30,
            acceleration: 1,
            fuelLevel: 41,
          },
        });

        const hist = await repository.findHistoryFullByTripId(trip.id);
        expect(hist).not.toBeNull();
        const rows = await prisma.telemetry.findMany({
          where: { tripId: trip.id },
          orderBy: { timestamp: 'asc' },
        });
        assertTelemetryJsonMatchesRows(
          (hist as TripHistoryFullSqlRow).telemetry_json,
          rows,
        );
        const arr = hist!.telemetry_json as TelemetryJson[];
        expect(arr[0].id).toBe(telEarly.id);
        expect(arr[1].id).toBe(telLate.id);
      });
    });

    it('возвращает null, если поездки с таким id нет', async () => {
      const found = await repository.findHistoryFullByTripId(uuidv4());
      expect(found).toBeNull();
    });
  });
});

type ViolationJson = {
  id: string;
  tripId: string;
  type: number;
  description: string;
  createdAt: string | Date;
};

type TelemetryJson = {
  id: string;
  tripId: string;
  timestamp: string | Date;
  lat: unknown;
  lon: unknown;
  speed: number;
  acceleration: number;
  fuelLevel: number;
};

function asTripJson(raw: unknown): Record<string, unknown> {
  expect(raw).toBeTypeOf('object');
  expect(raw).not.toBeNull();
  return raw as Record<string, unknown>;
}

/** Даты в ответе SQL пока не сравниваем с Prisma (разный сериал в JSON); только «есть значение и оно парсится». */
function assertParsableTimestamp(v: unknown): void {
  expect(v).toBeDefined();
  expect(Number.isFinite(Date.parse(String(v)))).toBe(true);
}

function prismaDecimalToNum(
  v: { toNumber: () => number } | number | null | undefined,
): number | null {
  if (v === null || v === undefined) {
    return null;
  }
  if (typeof v === 'number') {
    return v;
  }
  return v.toNumber();
}

function assertTripJsonMatchesPrismaRow(
  tripJson: TripHistorySqlRow['trip_json'],
  row: Trip,
): void {
  const j = asTripJson(tripJson);
  expect(j.id).toBe(row.id);
  expect(j.userId).toBe(row.userId);
  expect(j.carId).toBe(row.carId);
  expect(j.geoZoneVersionId).toBe(row.geoZoneVersionId);
  expect(j.status).toBe(row.status);
  assertParsableTimestamp(j.startedAt);
  if (row.finishedAt === null) {
    expect(j.finishedAt).toBeNull();
  } else {
    assertParsableTimestamp(j.finishedAt);
  }
  if (row.pauseStartedAt === null) {
    expect(j.pauseStartedAt).toBeNull();
  } else {
    assertParsableTimestamp(j.pauseStartedAt);
  }
  expect(j.totalPausedSec).toBe(row.totalPausedSec);
  expect(num(j.startLat)).toBe(prismaDecimalToNum(row.startLat));
  expect(num(j.startLng)).toBe(prismaDecimalToNum(row.startLng));
  expect(num(j.finishLat)).toBe(prismaDecimalToNum(row.finishLat));
  expect(num(j.finishLng)).toBe(prismaDecimalToNum(row.finishLng));
  expect(j.distance).toBe(row.distance);
  expect(j.duration).toBe(row.duration);
  expect(j.distanceMeters).toBe(row.distanceMeters);
  expect(j.chargedMinutes).toBe(row.chargedMinutes);
  expect(j.chargedKm).toBe(row.chargedKm);
  expect(num(j.priceTime)).toBe(prismaDecimalToNum(row.priceTime));
  expect(num(j.priceDistance)).toBe(prismaDecimalToNum(row.priceDistance));
  expect(num(j.pricePause)).toBe(prismaDecimalToNum(row.pricePause));
  expect(num(j.priceTotal)).toBe(prismaDecimalToNum(row.priceTotal));
  assertParsableTimestamp(j.createdAt);
  assertParsableTimestamp(j.updatedAt);
  expect(j.carPlateSnapshot).toBe(row.carPlateSnapshot);
  expect(j.carDisplayNameSnapshot).toBe(row.carDisplayNameSnapshot);
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) {
    return null;
  }
  if (typeof v === 'number') {
    return v;
  }
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function assertTelemetryJsonMatchesRows(
  telemetryJson: TripHistoryFullSqlRow['telemetry_json'],
  rows: Telemetry[],
): void {
  expect(Array.isArray(telemetryJson)).toBe(true);
  const arr = telemetryJson as TelemetryJson[];
  expect(arr).toHaveLength(rows.length);
  for (let i = 0; i < rows.length; i++) {
    assertTelemetryItemMatchesRow(arr[i], rows[i]!);
  }
}

function assertTelemetryItemMatchesRow(j: TelemetryJson, row: Telemetry): void {
  expect(j.id).toBe(row.id);
  expect(j.tripId).toBe(row.tripId);
  expect(num(j.lat)).toBe(prismaDecimalToNum(row.lat));
  expect(num(j.lon)).toBe(prismaDecimalToNum(row.lon));
  expect(j.speed).toBe(row.speed);
  expect(j.acceleration).toBe(row.acceleration);
  expect(j.fuelLevel).toBe(row.fuelLevel);
  assertParsableTimestamp(j.timestamp);
}

function assertCarJsonMatchesPrismaRow(
  carJson: TripHistorySqlRow['car_json'],
  row: Car,
): void {
  const j = asTripJson(carJson);
  expect(j.id).toBe(row.id);
  expect(j.brand).toBe(row.brand);
  expect(j.model).toBe(row.model);
  expect(j.licensePlate).toBe(row.licensePlate);
  expect(j.color).toBe(row.color);
  expect(j.mileage).toBe(row.mileage);
  expect(j.fuelLevel).toBe(row.fuelLevel);
  expect(j.isAvailable).toBe(row.isAvailable);
  expect(j.carStatus).toBe(row.carStatus);
  expect(j.isDeleted).toBe(row.isDeleted);
  expect(String(j.createdAt)).toBe(row.createdAt);
  if (row.updatedAt === null || row.updatedAt === undefined) {
    expect(j.updatedAt).toBeNull();
  } else {
    expect(String(j.updatedAt)).toBe(row.updatedAt);
  }
  expect(num(j.lastKnownLat)).toBe(row.lastKnownLat);
  expect(num(j.lastKnownLon)).toBe(row.lastKnownLon);
  if (row.lastPositionAt === null || row.lastPositionAt === undefined) {
    expect(j.lastPositionAt).toBeNull();
  } else {
    expect(String(j.lastPositionAt)).toBe(row.lastPositionAt);
  }
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
