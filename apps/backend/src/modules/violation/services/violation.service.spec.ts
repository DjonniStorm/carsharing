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

import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { CarStatus } from '../../car/entities/car-status';
import type {
  GeoJSONMultiPolygon,
  GeoJSONPosition,
} from '../../geozone/entities/geozone.geometry';
import { GeozoneType } from '../../geozone/entities/geozone.type';
import { GeozoneRepository } from '../../geozone/repositories/geozone.repository';
import { TripGateway } from '../../trip/gateways/trip.gateway';
import { LoggerTripRealtimeOutbox } from '../../trip/realtime/trip-realtime.outbox.logger';
import { TripRepository } from '../../trip/repositories/trip.repository';
import { ViolationNotFoundException } from '../common/errors';
import { ViolationCreate } from '../entities/dtos/violation.create';
import { ViolationStatus } from '../entities/violation.status';
import { ViolationRepository } from '../repositories/violation.repository';
import { ViolationTripRealtimePublisher } from '../realtime/violation-realtime.publisher.trip-outbox';
import { ViolationService } from './violation.service';

describe('ViolationService (integration)', () => {
  let prisma: PrismaService;
  let service: ViolationService;

  let tripId: string;

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
    await truncateApplicationTable(prisma, 'tariff');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');

    tripId = await seedTrip(prisma);
    const gateway = {
      publish: (): undefined => undefined,
    } as Pick<TripGateway, 'publish'>;
    const outbox = new LoggerTripRealtimeOutbox(gateway as never);
    const publisher = new ViolationTripRealtimePublisher(
      outbox,
      new TripRepository(prisma),
    );
    service = new ViolationService(new ViolationRepository(prisma), publisher);
  });

  afterEach(async () => {
    await truncateApplicationTable(prisma, 'violation_notification');
    await truncateApplicationTable(prisma, 'notification');
    await truncateApplicationTable(prisma, 'violation');
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
    it('создаёт нарушение', async () => {
      // Arrange
      const dto = buildViolationCreate(tripId, ViolationStatus.SPEEDING);

      // Act
      const created = await service.create(dto);

      // Assert
      expect(created.id).toBeTruthy();
      expect(created.tripId).toBe(tripId);
      expect(created.type).toBe(ViolationStatus.SPEEDING);
    });

    it('бросает ошибку при создании для несуществующей поездки', async () => {
      // Arrange
      const dto = buildViolationCreate(
        '00000000-0000-0000-0000-000000000000',
        ViolationStatus.SPEEDING,
      );

      // Act + Assert
      await expect(service.create(dto)).rejects.toBeInstanceOf(Error);
    });
  });

  describe('findById', () => {
    it('возвращает нарушение по id', async () => {
      // Arrange
      const created = await service.create(
        buildViolationCreate(tripId, ViolationStatus.LOW_FUEL),
      );

      // Act
      const found = await service.findById(created.id);

      // Assert
      expect(found?.id).toBe(created.id);
      expect(found?.type).toBe(ViolationStatus.LOW_FUEL);
    });

    it('возвращает null для неизвестного id', async () => {
      // Arrange
      const missingId = uuidv4();

      // Act
      const found = await service.findById(missingId);

      // Assert
      expect(found).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('обновляет статус нарушения', async () => {
      // Arrange
      const created = await service.create(
        buildViolationCreate(tripId, ViolationStatus.OUT_OF_GEOZONE),
      );

      // Act
      const updated = await service.updateStatus(
        created.id,
        ViolationStatus.IGNORED,
      );

      // Assert
      expect(updated.id).toBe(created.id);
      expect(updated.type).toBe(ViolationStatus.IGNORED);
    });

    it('бросает ViolationNotFoundException для несуществующего id', async () => {
      // Arrange
      const missingId = uuidv4();

      // Act + Assert
      await expect(
        service.updateStatus(missingId, ViolationStatus.IGNORED),
      ).rejects.toThrow(ViolationNotFoundException);
    });
  });

  describe('resolve', () => {
    it('ставит статус RESOLVED', async () => {
      // Arrange
      const created = await service.create(
        buildViolationCreate(tripId, ViolationStatus.WRONG_PARKING),
      );

      // Act
      const resolved = await service.resolve(created.id);

      // Assert
      expect(resolved.type).toBe(ViolationStatus.RESOLVED);
    });

    it('бросает ViolationNotFoundException для несуществующего id', async () => {
      // Arrange
      const missingId = uuidv4();

      // Act + Assert
      await expect(service.resolve(missingId)).rejects.toThrow(
        ViolationNotFoundException,
      );
    });
  });
});

function buildViolationCreate(tripId: string, type: ViolationStatus): ViolationCreate {
  const dto = new ViolationCreate();
  dto.tripId = tripId;
  dto.type = type;
  dto.description = 'test';
  return dto;
}

async function seedTrip(prisma: PrismaService): Promise<string> {
  const suffix = uuidv4().replace(/-/g, '');
  const user = await prisma.user.create({
    data: {
      name: `Violation service ${suffix.slice(0, 10)}`,
      email: `violation-service-${suffix}@test.local`,
      phone: `+79${suffix.replace(/[a-f]/gi, '6').slice(0, 10)}`,
      passwordHash: 'hash',
      role: 0,
      isActive: true,
      isDeleted: false,
    },
  });

  const car = await prisma.car.create({
    data: {
      brand: 'Violation',
      model: 'ServiceSpec',
      licensePlate: `VS${suffix.slice(0, 8)}`,
      color: 'red',
      mileage: 1200,
      fuelLevel: 50,
      isAvailable: true,
      carStatus: CarStatus.AVAILABLE,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    },
  });

  const geozoneRepository = new GeozoneRepository(prisma);
  const zone = await geozoneRepository.createWithInitialVersion({
    name: 'Violation service zone',
    type: GeozoneType.RENTAL,
    color: '#404040',
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

  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      carId: car.id,
      tariffVersionId: zone.currentVersionId,
      startedAt: new Date('2026-05-08T10:00:00.000Z'),
      distance: 0,
      duration: 0,
      status: 0,
    },
  });

  return trip.id;
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

