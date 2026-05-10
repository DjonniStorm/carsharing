import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTables,
} from 'src/shared/testing';

import { GeozoneRepository } from '../../geozone/repositories/geozone.repository';
import { GeozoneType } from '../../geozone/entities/geozone.type';
import { ViolationRepository } from './violation.repository';
import { ViolationStatus } from '../entities/violation.status';

describe('ViolationRepository', () => {
  let prisma: PrismaService;
  let repository: ViolationRepository;
  let tripId: string;

  beforeAll(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
    repository = new ViolationRepository(prisma);
  });

  afterEach(async () => {
    await truncateApplicationTables(prisma);
  });

  afterAll(async () => {
    await truncateApplicationTables(prisma);
    await prisma.$disconnect();
  });

  async function seedTrip(): Promise<string> {
    const user = await prisma.user.create({
      data: {
        name: 'Violation repo user',
        email: 'violation-repo-user@test.local',
        phone: '+79990000001',
        passwordHash: 'hash',
        role: 0,
        isActive: true,
        isDeleted: false,
      },
    });

    const car = await prisma.car.create({
      data: {
        brand: 'Violation',
        model: 'Repo',
        licensePlate: 'VIO123',
        color: 'black',
        mileage: 1000,
        fuelLevel: 50,
        isAvailable: true,
        carStatus: 1,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      },
    });

    const geozoneRepository = new GeozoneRepository(prisma);
    const zone = await geozoneRepository.createWithInitialVersion({
      name: 'Violation repo zone',
      type: GeozoneType.RENTAL,
      color: '#000000',
      createdByUserId: user.id,
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [35.0, 55.7] as any,
              [35.15, 55.7],
              [35.15, 55.85],
              [35.0, 55.85],
              [35.0, 55.7],
            ],
          ],
        ],
      },
      rules: null,
      pricePerMinute: 1,
      pricePerKm: 2,
      pausePricePerMinute: 0.5,
    });
    expect(zone.currentVersionId).toBeTruthy();

    const trip = await prisma.trip.create({
      data: {
        userId: user.id,
        carId: car.id,
        geoZoneVersionId: zone.currentVersionId!,
        startedAt: new Date(),
        distance: 0,
        duration: 0,
        status: 1,
      },
    });
    return trip.id;
  }

  describe('create', () => {
    it('создаёт нарушение для существующей поездки', async () => {
      // Arrange
      tripId = await seedTrip();

      // Act
      const created = await repository.create({
        tripId,
        type: ViolationStatus.SPEEDING,
        description: 'speed',
      });

      // Assert
      expect(created.id).toBeTruthy();
      expect(created.tripId).toBe(tripId);
      expect(created.type).toBe(ViolationStatus.SPEEDING);
    });

    it('бросает ошибку при создании для несуществующей поездки', async () => {
      // Arrange
      const missingTripId = '00000000-0000-0000-0000-000000000000';

      // Act + Assert
      await expect(
        repository.create({
          tripId: missingTripId,
          type: ViolationStatus.SPEEDING,
          description: 'speed',
        }),
      ).rejects.toBeInstanceOf(Error);
    });
  });

  describe('findById', () => {
    it('возвращает нарушение по id', async () => {
      // Arrange
      tripId = await seedTrip();
      const created = await repository.create({
        tripId,
        type: ViolationStatus.LOW_FUEL,
        description: 'fuel',
      });

      // Act
      const found = await repository.findById(created.id);

      // Assert
      expect(found?.id).toBe(created.id);
      expect(found?.type).toBe(ViolationStatus.LOW_FUEL);
    });

    it('возвращает null, если нарушение не найдено', async () => {
      // Arrange
      const missingId = '00000000-0000-0000-0000-000000000000';

      // Act
      const found = await repository.findById(missingId);

      // Assert
      expect(found).toBeNull();
    });
  });

  describe('resolve', () => {
    it('ставит статус RESOLVED', async () => {
      // Arrange
      tripId = await seedTrip();
      const created = await repository.create({
        tripId,
        type: ViolationStatus.LOW_FUEL,
        description: 'fuel',
      });

      // Act
      const resolved = await repository.resolve(created.id);

      // Assert
      expect(resolved.type).toBe(ViolationStatus.RESOLVED);
    });

    it('бросает ошибку при resolve для несуществующего id', async () => {
      // Arrange
      const missingId = '00000000-0000-0000-0000-000000000000';

      // Act + Assert
      await expect(repository.resolve(missingId)).rejects.toBeInstanceOf(Error);
    });
  });
});
