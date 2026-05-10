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
import { BadRequestException, NotFoundException } from '@nestjs/common';

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
import { ViolationCreate } from '../entities/dtos/violation.create';
import { ViolationUpdateStatus } from '../entities/dtos/violation.update-status';
import { ViolationStatus } from '../entities/violation.status';
import { ViolationRepository } from '../repositories/violation.repository';
import { ViolationTripRealtimePublisher } from '../realtime/violation-realtime.publisher.trip-outbox';
import type { AuthenticatedUser } from 'src/modules/auth/types/authenticated-user';
import { UserRole } from 'src/modules/user/entities/user.role';
import { ViolationService } from '../services/violation.service';
import { ViolationController } from './violation.controller';
import type { TripService } from 'src/modules/trip/services/trip.service';

const adminActor = (): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-000000000001',
  role: UserRole.MANAGER,
});

describe('ViolationController', () => {
  let prisma: PrismaService;
  let controller: ViolationController;
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
    await truncateApplicationTable(prisma, 'tariff_preset');
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
    const service = new ViolationService(
      new ViolationRepository(prisma),
      publisher,
    );
    const tripServiceStub = {
      ensureTripAccessForUser: async (): Promise<void> => undefined,
    } as unknown as TripService;
    controller = new ViolationController(service, tripServiceStub);
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
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('создаёт нарушение и возвращает read-модель', async () => {
      // Arrange
      const dto = new ViolationCreate();
      dto.tripId = tripId;
      dto.type = ViolationStatus.SPEEDING;
      dto.description = 'test';

      // Act
      const created = await controller.create(dto);

      // Assert
      expect(created.id).toBeTruthy();
      expect(created.tripId).toBe(tripId);
      expect(created.type).toBe(ViolationStatus.SPEEDING);
    });

    it('возвращает 400, если поездка не существует', async () => {
      // Arrange
      const dto = new ViolationCreate();
      dto.tripId = '00000000-0000-0000-0000-000000000000';
      dto.type = ViolationStatus.SPEEDING;
      dto.description = 'test';

      // Act + Assert
      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('возвращает нарушение по id', async () => {
      // Arrange
      const created = await controller.create(
        Object.assign(new ViolationCreate(), {
          tripId,
          type: ViolationStatus.LOW_FUEL,
          description: 'fuel',
        }),
      );

      // Act
      const found = await controller.findById(adminActor(), created.id);

      // Assert
      expect(found.id).toBe(created.id);
      expect(found.type).toBe(ViolationStatus.LOW_FUEL);
    });

    it('возвращает 404, если нарушение не найдено', async () => {
      // Arrange
      const missingId = uuidv4();

      // Act + Assert
      await expect(
        controller.findById(adminActor(), missingId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByTripId', () => {
    it('возвращает список нарушений по tripId', async () => {
      // Arrange
      await controller.create(
        Object.assign(new ViolationCreate(), {
          tripId,
          type: ViolationStatus.SPEEDING,
          description: 'a',
        }),
      );
      await controller.create(
        Object.assign(new ViolationCreate(), {
          tripId,
          type: ViolationStatus.LOW_FUEL,
          description: 'b',
        }),
      );

      // Act
      const list = await controller.findAllByTripId(adminActor(), tripId);

      // Assert
      expect(list.length).toBe(2);
    });

    it('возвращает 400 при ошибке базы данных', async () => {
      // Arrange
      const invalidTripId = 'not-a-uuid';

      // Act + Assert
      await expect(
        controller.findAllByTripId(adminActor(), invalidTripId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllByStatus', () => {
    it('возвращает список по статусу', async () => {
      // Arrange
      await controller.create(
        Object.assign(new ViolationCreate(), {
          tripId,
          type: ViolationStatus.SPEEDING,
          description: 'a',
        }),
      );
      await controller.create(
        Object.assign(new ViolationCreate(), {
          tripId,
          type: ViolationStatus.LOW_FUEL,
          description: 'b',
        }),
      );

      // Act
      const list = await controller.findAllByStatus(
        String(ViolationStatus.SPEEDING),
        'false',
      );

      // Assert
      expect(list.map((x) => x.type)).toEqual([ViolationStatus.SPEEDING]);
    });

    it('возвращает 400 при невалидном status в query', async () => {
      // Arrange
      const rawStatus = 'abc';

      // Act + Assert
      await expect(
        controller.findAllByStatus(rawStatus, 'false'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('обновляет статус нарушения', async () => {
      // Arrange
      const created = await controller.create(
        Object.assign(new ViolationCreate(), {
          tripId,
          type: ViolationStatus.OUT_OF_GEOZONE,
          description: 'zone',
        }),
      );
      const dto = new ViolationUpdateStatus();
      dto.status = ViolationStatus.IGNORED;

      // Act
      const updated = await controller.updateStatus(created.id, dto);

      // Assert
      expect(updated.id).toBe(created.id);
      expect(updated.type).toBe(ViolationStatus.IGNORED);
    });

    it('возвращает 404, если нарушение не найдено', async () => {
      // Arrange
      const dto = new ViolationUpdateStatus();
      dto.status = ViolationStatus.IGNORED;

      // Act + Assert
      await expect(controller.updateStatus(uuidv4(), dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('resolve', () => {
    it('разрешает нарушение', async () => {
      // Arrange
      const created = await controller.create(
        Object.assign(new ViolationCreate(), {
          tripId,
          type: ViolationStatus.WRONG_PARKING,
          description: 'park',
        }),
      );

      // Act
      const resolved = await controller.resolve(created.id);

      // Assert
      expect(resolved.type).toBe(ViolationStatus.RESOLVED);
    });

    it('возвращает 404, если нарушение не найдено', async () => {
      // Arrange
      const missingId = uuidv4();

      // Act + Assert
      await expect(controller.resolve(missingId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

async function seedTrip(prisma: PrismaService): Promise<string> {
  const suffix = uuidv4().replace(/-/g, '');
  const user = await prisma.user.create({
    data: {
      name: `Violation ctrl ${suffix.slice(0, 10)}`,
      email: `violation-ctrl-${suffix}@test.local`,
      phone: `+79${suffix.replace(/[a-f]/gi, '4').slice(0, 10)}`,
      passwordHash: 'hash',
      role: 0,
      isActive: true,
      isDeleted: false,
    },
  });

  const car = await prisma.car.create({
    data: {
      brand: 'Violation',
      model: 'CtrlSpec',
      licensePlate: `VC${suffix.slice(0, 8)}`,
      color: 'black',
      mileage: 1000,
      fuelLevel: 50,
      isAvailable: true,
      carStatus: CarStatus.AVAILABLE,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    },
  });

  const geozoneRepository = new GeozoneRepository(prisma);
  const zone = await geozoneRepository.createWithInitialVersion({
    name: 'Violation ctrl zone',
    type: GeozoneType.RENTAL,
    color: '#222222',
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
      geoZoneVersionId: zone.currentVersionId,
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
