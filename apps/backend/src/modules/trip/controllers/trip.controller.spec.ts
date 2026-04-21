import { BadRequestException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
import { TripCreate } from '../entities/dtos/trip.create';
import { TripUpdate } from '../entities/dtos/trip.update';
import { TripStatus } from '../entities/trip.status';
import { TripGateway } from '../gateways/trip.gateway';
import { LoggerTripRealtimeOutbox } from '../realtime/trip-realtime.outbox.logger';
import { TripRepository } from '../repositories/trip.repository';
import { TripService } from '../services/trip.service';
import { TripController } from './trip.controller';
import { TripRealtimePublisher } from '../services/trip-realtime.publisher';

describe('TripController', () => {
  let prisma: PrismaService;
  let controller: TripController;
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
    tariffVersionId = firstZone.currentVersionId;
    tariffVersionIdOther = secondZone.currentVersionId;

    const service = new TripService(
      new TripRepository(prisma),
      new TripRealtimePublisher(
        new LoggerTripRealtimeOutbox({
          publish: () => undefined,
        } as Pick<TripGateway, 'publish'>),
      ),
    );
    controller = new TripController(service);
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

  describe('create', () => {
    it('creates trip', async () => {
      const created = await controller.create(
        buildTripCreate({ userId, carId, tariffVersionId }),
      );
      expect(created.id).toBeGreaterThan(0);
      expect(created.userId).toBe(userId);
      expect(created.carId).toBe(carId);
      expect(created.tariffVersionId).toBe(tariffVersionId);
    });

    it('maps invalid relation to BadRequest', async () => {
      await expect(
        controller.create(
          buildTripCreate({
            userId,
            carId,
            tariffVersionId: uuidv4(),
          }),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns empty list when no rows', async () => {
      const list = await controller.findAll();
      expect(list).toEqual([]);
    });

    it('filters by tariffVersionId and status', async () => {
      await controller.create(
        buildTripCreate({
          userId,
          carId,
          tariffVersionId,
          status: TripStatus.PENDING,
        }),
      );
      const active = await controller.create(
        buildTripCreate({
          userId,
          carId,
          tariffVersionId: tariffVersionIdOther,
          status: TripStatus.ACTIVE,
        }),
      );

      const filtered = await controller.findAll(
        undefined,
        undefined,
        tariffVersionIdOther,
        String(TripStatus.ACTIVE),
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(active.id);
    });

    it('rejects non-integer status query', async () => {
      await expect(
        controller.findAll(undefined, undefined, undefined, '1.2'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid status enum value', async () => {
      await expect(
        controller.findAll(undefined, undefined, undefined, '99'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid startedAfter date', async () => {
      await expect(
        controller.findAll(undefined, undefined, undefined, undefined, 'bad-date'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects startedAfter > startedBefore', async () => {
      await expect(
        controller.findAll(
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
        buildTripCreate({ userId, carId, tariffVersionId }),
      );
      const found = await controller.findById(created.id);
      expect(found.id).toBe(created.id);
    });

    it('NotFound for missing id', async () => {
      await expect(controller.findById(9_999_999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates status and tariffVersionId', async () => {
      const created = await controller.create(
        buildTripCreate({ userId, carId, tariffVersionId }),
      );
      const patch = new TripUpdate();
      patch.status = TripStatus.FINISHED;
      patch.tariffVersionId = tariffVersionIdOther;
      const updated = await controller.update(created.id, patch);
      expect(updated.status).toBe(TripStatus.FINISHED);
      expect(updated.tariffVersionId).toBe(tariffVersionIdOther);
    });

    it('NotFound for missing id', async () => {
      await expect(controller.update(9_999_999, new TripUpdate())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('dto validation', () => {
    it('TripCreate: requires UUID ids and latitude range', async () => {
      const dto = buildTripCreate({
        userId: 'not-uuid',
        carId: 'bad',
        tariffVersionId: 'bad',
        startLat: 120,
      });
      const errors = await validate(dto);
      const props = errors.map((e) => e.property);
      expect(props).toContain('userId');
      expect(props).toContain('carId');
      expect(props).toContain('tariffVersionId');
      expect(props).toContain('startLat');
    });

    it('TripCreate: accepts boundary coords -90/90 and -180/180', async () => {
      const dto = buildTripCreate({
        userId,
        carId,
        tariffVersionId,
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
  dto.tariffVersionId = overrides.tariffVersionId ?? uuidv4();
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
