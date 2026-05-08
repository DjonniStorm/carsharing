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
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { TelemetryCreate } from '../entities/dto/telemetry.create';
import { TelemetryRepository } from '../repositories/telemetry.repository';
import { TelemetryService } from '../services/telemetry.service';
import { TelemetryController } from './telemetry.controller';

describe('TelemetryController', () => {
  let prisma: PrismaService;
  let controller: TelemetryController;
  let userId: string;
  let carId: string;
  let tariffVersionId: string;
  let tripId: string;

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
        name: `Telemetry ctrl ${suffix.slice(0, 10)}`,
        email: `telemetry-ctrl-${suffix}@test.local`,
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
        model: 'CtrlSpec',
        licensePlate: `TC${suffix.slice(0, 8)}`,
        color: 'white',
        mileage: 1500,
        fuelLevel: 60,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      },
    });
    carId = car.id;

    const geozoneRepository = new GeozoneRepository(prisma);
    const zone = await geozoneRepository.createWithInitialVersion({
      name: 'Telemetry ctrl zone',
      type: GeozoneType.RENTAL,
      color: '#222222',
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
          startedAt: new Date('2026-04-21T20:00:00.000Z'),
          distance: 0,
          duration: 0,
          status: 0,
        },
      })
    ).id;

    const tripOutbox: ITripRealtimeOutbox = {
      publish: async () => undefined,
    };
    const service = new TelemetryService(
      new TelemetryRepository(prisma),
      new InMemoryJobQueue(),
      tripOutbox,
      new TripRepository(prisma),
    );
    controller = new TelemetryController(service);
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
    it('создаёт запись телеметрии', async () => {
      const created = await controller.create(
        buildTelemetryCreate(tripId, '2026-04-21T20:01:00.000Z'),
      );
      expect(created.id).toBeTruthy();
      expect(created.tripId).toBe(tripId);
    });

    it('мапит невалидную связь в BadRequest', async () => {
      await expect(
        controller.create(
          buildTelemetryCreate(uuidv4(), '2026-04-21T20:02:00.000Z'),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('возвращает запись по id', async () => {
      const created = await controller.create(
        buildTelemetryCreate(tripId, '2026-04-21T20:03:00.000Z'),
      );
      const found = await controller.findById(created.id);
      expect(found.id).toBe(created.id);
    });

    it('мапит отсутствие записи в NotFound', async () => {
      await expect(controller.findById(uuidv4())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findManyByTripId', () => {
    it('фильтрует по tripId и параметрам выборки', async () => {
      await controller.create(buildTelemetryCreate(tripId, '2026-04-21T20:00:00.000Z'));
      await controller.create(buildTelemetryCreate(tripId, '2026-04-21T20:01:00.000Z'));

      const list = await controller.findManyByTripId(
        tripId,
        '2026-04-21T20:00:30.000Z',
        undefined,
        '1',
        '0',
        'desc',
      );
      expect(list).toHaveLength(1);
      expect(list[0].timestamp).toBe('2026-04-21T20:01:00.000Z');
    });

    it('бросает BadRequest для невалидной даты фильтра', async () => {
      await expect(
        controller.findManyByTripId(tripId, 'bad-date'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('dto validation', () => {
    it('TelemetryCreate: требует UUID tripId и валидные координаты', async () => {
      const dto = buildTelemetryCreate('bad-trip-id', '2026-04-21T20:04:00.000Z');
      dto.lat = 100;
      dto.lon = 200;
      const errors = await validate(dto);
      const props = errors.map((e) => e.property);
      expect(props).toContain('tripId');
      expect(props).toContain('lat');
      expect(props).toContain('lon');
    });
  });
});

function buildTelemetryCreate(tripId: string, timestamp: string): TelemetryCreate {
  const dto = new TelemetryCreate();
  dto.timestamp = timestamp;
  dto.lat = 55.75;
  dto.lon = 37.61;
  dto.speed = 21.3;
  dto.acceleration = 0.8;
  dto.fuelLevel = 40;
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

