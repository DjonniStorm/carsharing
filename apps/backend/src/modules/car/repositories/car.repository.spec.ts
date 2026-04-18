import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CarRepository } from './car.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { v4 as uuidv4 } from 'uuid';
import { CarEntity } from '../entities/car.entity';
import { CarStatus } from '../entities/car-status';

describe('CarRepository', () => {
  let repository: CarRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
    await truncateApplicationTable(prisma, 'car');
    repository = new CarRepository(prisma);
  });

  afterAll(async () => {
    await truncateApplicationTable(prisma, 'car');
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return all cars', async () => {
      // arrange
      const car = new CarEntity(
        uuidv4(),
        'mercedes-benz',
        'c-class',
        '1234567890',
        'black',
        100000,
        50,
        true,
        CarStatus.AVAILABLE,
        false,
        new Date().toISOString(),
        null,
        null,
        null,
        null,
      );

      const car2 = new CarEntity(
        uuidv4(),
        'bmw',
        'x5',
        '1234567891',
        'white',
        100000,
        50,
        true,
        CarStatus.AVAILABLE,
        false,
        new Date().toISOString(),
        null,
        null,
        null,
        null,
      );
      await repository.create(car);
      await repository.create(car2);

      // act
      const found = await repository.findAll(false);

      // assert
      expect(found).toBeDefined();
      expect(found).not.toBeNull();
      expect(found!.length).toBe(2);
      assertCar(car, found![0]);
      assertCar(car2, found![1]);
    });

    it('should return all cars with deleted cars', async () => {
      // arrange
      const car = new CarEntity(
        uuidv4(),
        'mercedes-benz',
        'c-class',
        '1234567890',
        'black',
        100000,
        50,
        true,
        CarStatus.AVAILABLE,
        false,
        new Date().toISOString(),
        null,
        null,
        null,
        null,
      );
      const car2 = new CarEntity(
        uuidv4(),
        'bmw',
        'x5',
        '1234567891',
        'white',
        100000,
        50,
        true,
        CarStatus.AVAILABLE,
        false,
        new Date().toISOString(),
        null,
        null,
        null,
        null,
      );
      await repository.create(car);
      await repository.create(car2);

      // act
      const found = await repository.findAll(true);

      // assert
      expect(found).toBeDefined();
      expect(found).not.toBeNull();
      expect(found!.length).toBe(2);
      assertCar(car, found![0]);
      assertCar(car2, found![1]);
    });
  });

  describe('findById', () => {
    it('should return car by id', async () => {
      // arrange
      const car = new CarEntity(
        uuidv4(),
        'mercedes-benz',
        'c-class',
        '1234567890',
        'black',
        100000,
        50,
        true,
        CarStatus.AVAILABLE,
        false,
        new Date().toISOString(),
        null,
        null,
        null,
        null,
      );
      await repository.create(car);
      // act
      const found = await repository.findById(car.id);
      // assert
      expect(found).toBeDefined();
      expect(found).not.toBeNull();
      assertCar(car, found!);
    });

    it('should return null if car not found', async () => {
      // arrange
      const id = uuidv4();
      // act
      const found = await repository.findById(id);
      // assert
      expect(found).toBeNull();
    });
  });

  describe('create', () => {
    it('should create car', async () => {
      // arrange
      const car = new CarEntity(
        uuidv4(),
        'mercedes-benz',
        'c-class',
        '1234567890',
        'black',
        100000,
        50,
        true,
        CarStatus.AVAILABLE,
        false,
        new Date().toISOString(),
        null,
        null,
        null,
        null,
      );
      // act
      const created = await repository.create(car);
      // assert
      expect(created).toBeDefined();
      assertCar(car, created);
    });
  });

  describe('update', () => {
    it('should update car', async () => {
      // arrange
      const car = new CarEntity(
        uuidv4(),
        'mercedes-benz',
        'c-class',
        '1234567890',
        'black',
        100000,
        50,
        true,
        CarStatus.AVAILABLE,
        false,
        new Date().toISOString(),
        null,
        null,
        null,
        null,
      );
      await repository.create(car);
      // act
      const updated = await repository.update(car.id, {
        brand: 'bmw',
        model: 'x5',
        licensePlate: '1234567891',
        color: 'white',
      });
      // assert
      expect(updated).toBeDefined();
      expect(updated).not.toBeNull();
      const expected = new CarEntity(
        car.id,
        'bmw',
        'x5',
        '1234567891',
        'white',
        car.mileage,
        car.fuelLevel,
        car.isAvailable,
        car.carStatus,
        car.isDeleted,
        car.createdAt,
        car.updatedAt,
        car.lastKnownLat,
        car.lastKnownLon,
        car.lastPositionAt,
      );
      assertCar(expected, updated);
    });
  });

  describe('updatePosition', () => {
    it('should update car position', async () => {
      // arrange
      const car = new CarEntity(
        uuidv4(),
        'mercedes-benz',
        'c-class',
        '1234567890',
        'black',
        100000,
        50,
        true,
        CarStatus.AVAILABLE,
        false,
        new Date().toISOString(),
        null,
        null,
        null,
        null,
      );
      await repository.create(car);
      // act
      const lastPositionAt = new Date().toISOString();
      const updated = await repository.updatePosition(
        car.id,
        50.0,
        50.0,
        lastPositionAt,
      );
      // assert
      expect(updated).toBeDefined();
      expect(updated).not.toBeNull();
      const expected = new CarEntity(
        car.id,
        car.brand,
        car.model,
        car.licensePlate,
        car.color,
        car.mileage,
        car.fuelLevel,
        car.isAvailable,
        car.carStatus,
        car.isDeleted,
        car.createdAt,
        car.updatedAt,
        50.0,
        50.0,
        lastPositionAt,
      );
      assertCar(expected, updated);
    });
  });

  describe('delete', () => {
    it('should delete car', async () => {
      // arrange
      const car = new CarEntity(
        uuidv4(),
        'mercedes-benz',
        'c-class',
        '1234567890',
        'black',
        100000,
        50,
        true,
        CarStatus.AVAILABLE,
        false,
        new Date().toISOString(),
        null,
        null,
        null,
        null,
      );
      await repository.create(car);
      // act
      const deleted = await repository.delete(car.id);
      // assert
      expect(deleted).toBeDefined();
      expect(deleted).not.toBeNull();
      expect(deleted.isDeleted).toBe(true);
      const expectedAfterDelete = new CarEntity(
        car.id,
        car.brand,
        car.model,
        car.licensePlate,
        car.color,
        car.mileage,
        car.fuelLevel,
        car.isAvailable,
        car.carStatus,
        true,
        car.createdAt,
        car.updatedAt,
        car.lastKnownLat,
        car.lastKnownLon,
        car.lastPositionAt,
      );
      assertCar(expectedAfterDelete, deleted);
    });
  });

  describe('restore', () => {
    it('should restore car', async () => {
      // arrange
      const car = new CarEntity(
        uuidv4(),
        'mercedes-benz',
        'c-class',
        '1234567890',
        'black',
        100000,
        50,
        true,
        CarStatus.AVAILABLE,
        false,
        new Date().toISOString(),
        null,
        null,
        null,
        null,
      );
      await repository.create(car);
      await repository.delete(car.id);
      // act
      const restored = await repository.restore(car.id);
      // assert
      expect(restored).toBeDefined();
      expect(restored).not.toBeNull();
      assertCar(car, { ...restored, isDeleted: false });
    });
  });

  describe('Errors in validation', () => {
    it('should throw error if car is not valid', async () => {
      // arrange
      const car = {} as CarEntity;
      // act
      const promise = repository.create(car);
      // assert
      await expect(promise).rejects.toThrow();
    });
  });

  const assertCar = (car: CarEntity, found: CarEntity) => {
    expect(found.id).toBe(car.id);
    expect(found.brand).toBe(car.brand);
    expect(found.model).toBe(car.model);
    expect(found.licensePlate).toBe(car.licensePlate);
    expect(found.color).toBe(car.color);
    expect(found.mileage).toBe(car.mileage);
    expect(found.fuelLevel).toBe(car.fuelLevel);
    expect(found.isAvailable).toBe(car.isAvailable);
    expect(found.carStatus).toBe(car.carStatus);
    expect(found.isDeleted).toBe(car.isDeleted);
    expect(found.createdAt).toBe(car.createdAt);
    expect(found.updatedAt).toBe(car.updatedAt);
    expect(found.lastKnownLat).toBe(car.lastKnownLat);
    expect(found.lastKnownLon).toBe(car.lastKnownLon);
    expect(found.lastPositionAt).toBe(car.lastPositionAt);
  };
});
