import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CarService } from './car.service';
import { CarRepository } from '../repositories/car.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { Car } from '../entities/dtos/car';
import { CarRead } from '../entities/dtos/car.read';
import { CarStatus } from '../entities/car-status';
import { CarMapper } from '../common/mapper';
import { v4 as uuidv4 } from 'uuid';
import {
  CarAlreadyExistsException,
  CarNotFoundException,
  LicensePlateAlreadyExistsException,
} from '../common/errors';

describe('CarService', () => {
  let service: CarService;
  let repository: CarRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
    repository = new CarRepository(prisma);
    service = new CarService(repository);
  });

  afterEach(async () => {
    await truncateApplicationTable(prisma, 'car');
  });

  afterAll(async () => {
    await truncateApplicationTable(prisma, 'car');
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return all cars', async () => {
      // arrange
      const car = createCar({ licensePlate: '1234567890' });
      const carEntity = CarMapper.toCarEntity(car);
      await repository.create(carEntity);
      const car2 = createCar({ licensePlate: '1234567891' });
      const car2Entity = CarMapper.toCarEntity(car2);
      await repository.create(car2Entity);
      // act
      const result = await service.findAll(false);
      // assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result.length).toBe(2);
      assertCar(car, result[0]);
      assertCar(car2, result[1]);
    });

    it('should return all cars with deleted cars', async () => {
      // arrange
      const car = createCar({ licensePlate: '1234567890' });
      const carEntity = CarMapper.toCarEntity(car);
      await repository.create(carEntity);
      const car2 = createCar({ licensePlate: '1234567891' });
      const car2Entity = CarMapper.toCarEntity(car2);
      await repository.create(car2Entity);
      await repository.delete(carEntity.id);
      await repository.delete(car2Entity.id);
      // act
      const result = await service.findAll(true);
      // assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result.length).toBe(2);
    });
  });

  describe('findById', () => {
    it('should return car by id', async () => {
      // arrange
      const car = createCar({ licensePlate: '1234567890' });
      const carEntity = CarMapper.toCarEntity(car);
      await repository.create(carEntity);
      // act
      const result = await service.findById(carEntity.id);
      // assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      assertCar(car, result);
    });

    it('should throw an error if car not found', async () => {
      // arrange
      const id = uuidv4();
      // act
      await expect(service.findById(id)).rejects.toThrow(CarNotFoundException);
    });
  });

  describe('findByLicensePlate', () => {
    it('should return car by license plate', async () => {
      // arrange
      const car = createCar({ licensePlate: '1234567890' });
      const carEntity = CarMapper.toCarEntity(car);
      await repository.create(carEntity);
      // act
      const result = await service.findByLicensePlate(carEntity.licensePlate);
    });
    it('should throw an error if car not found', async () => {
      // arrange
      const licensePlate = '1234567890';
      // act
      await expect(service.findByLicensePlate(licensePlate)).rejects.toThrow(
        CarNotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new car', async () => {
      // arrange
      const car = createCar();
      // act
      const result = await service.create(car);
      // assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      assertCar(car, result);
    });
  });

  describe('update', () => {
    it('should update a car', async () => {
      // arrange
      const car = createCar();
      const carEntity = CarMapper.toCarEntity(car);
      await repository.create(carEntity);
      // act
      const result = await service.update(carEntity.id, car);
      // assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      assertCar(car, result);
    });
    it('should throw an error if updated license plate already exists', async () => {
      // arrange
      const car = createCar({ licensePlate: '1234567890' });
      const carEntity = CarMapper.toCarEntity(car);
      await repository.create(carEntity);
      const car2 = createCar({ licensePlate: '1234567810' });
      const car2Entity = CarMapper.toCarEntity(car2);
      await repository.create(car2Entity);

      const carToUpdate = { ...car2, licensePlate: carEntity.licensePlate };
      // act
      await expect(service.update(car2Entity.id, carToUpdate)).rejects.toThrow(
        LicensePlateAlreadyExistsException,
      );
    });
    it('should throw an error if car not found', async () => {
      // arrange
      const id = uuidv4();
      const car = createCar();
      // act
      await expect(service.update(id, car)).rejects.toThrow(
        CarNotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a car', async () => {
      // arrange
      const car = createCar();
      const carEntity = CarMapper.toCarEntity(car);
      await repository.create(carEntity);
      // act
      const result = await service.delete(carEntity.id);
      // assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result.isDeleted).toBe(true);
      assertCar({ ...car, isDeleted: true }, result);
    });
    it('should throw an error if car not found', async () => {
      // arrange
      const id = uuidv4();
      // act
      await expect(service.delete(id)).rejects.toThrow(CarNotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore a car', async () => {
      // arrange
      const car = createCar();
      const carEntity = CarMapper.toCarEntity(car);
      await repository.create(carEntity);
      await repository.delete(carEntity.id);
      // act
      const result = await service.restore(carEntity.id);
      // assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result.isDeleted).toBe(false);
      assertCar({ ...car, isDeleted: false }, result);
    });
    it('should throw an error if car not found', async () => {
      // arrange
      const id = uuidv4();
      // act
      await expect(service.restore(id)).rejects.toThrow(CarNotFoundException);
    });
  });

  describe('updatePosition', () => {
    it('should update a car position', async () => {
      // arrange
      const car = createCar();
      const carEntity = CarMapper.toCarEntity(car);
      await repository.create(carEntity);
      const lastPositionAt = new Date();
      const lastKnownLat = 100;
      const lastKnownLon = 100;
      // act
      const result = await service.updatePosition(
        carEntity.id,
        lastKnownLat,
        lastKnownLon,
        lastPositionAt,
      );
      // assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result.lastKnownLat).toBe(lastKnownLat);
      expect(result.lastKnownLon).toBe(lastKnownLon);
      expect(result.lastPositionAt).toStrictEqual(lastPositionAt);
      expect(result.createdAt.toISOString()).toStrictEqual(carEntity.createdAt);
      expect(result.brand).toBe(carEntity.brand);
      expect(result.model).toBe(carEntity.model);
      expect(result.licensePlate).toBe(carEntity.licensePlate);
      expect(result.color).toBe(carEntity.color);
      expect(result.mileage).toBe(carEntity.mileage);
      expect(result.fuelLevel).toBe(carEntity.fuelLevel);
      expect(result.isAvailable).toBe(carEntity.isAvailable);
      expect(result.carStatus).toBe(carEntity.carStatus);
      expect(result.isDeleted).toBe(carEntity.isDeleted);
      expect(result.createdAt.toISOString()).toStrictEqual(carEntity.createdAt);

      expect(result.lastKnownLat).toBe(lastKnownLat);
      expect(result.lastKnownLon).toBe(lastKnownLon);
      expect(result.lastPositionAt?.toISOString()).toStrictEqual(
        lastPositionAt.toISOString(),
      );
    });
    it('should throw an error if car not found', async () => {
      // arrange
      const id = uuidv4();
      // act
      await expect(
        service.updatePosition(id, 100, 100, new Date()),
      ).rejects.toThrow(CarNotFoundException);
    });
  });

  const assertCar = (car: Car, found: CarRead) => {
    expect(found.brand).toBe(car.brand);
    expect(found.model).toBe(car.model);
    expect(found.licensePlate).toBe(car.licensePlate);
    expect(found.color).toBe(car.color);
    expect(found.mileage).toBe(car.mileage);
    expect(found.fuelLevel).toBe(car.fuelLevel);
    expect(found.isAvailable).toBe(car.isAvailable);
    expect(found.carStatus).toBe(car.carStatus);
    expect(found.isDeleted).toBe(car.isDeleted);
    expect(found.createdAt).toStrictEqual(car.createdAt);
    expect(found.lastKnownLat).toBe(car.lastKnownLat);
    expect(found.lastKnownLon).toBe(car.lastKnownLon);
    expect(found.lastPositionAt).toBe(car.lastPositionAt);
  };

  const assertCarRead = (car: CarRead, found: Car) => {
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

  const createCar = (car: Partial<Car> = {}): Car => {
    const newCar = new Car();
    newCar.brand = car.brand ?? 'mercedes-benz';
    newCar.model = car.model ?? 'c-class';
    newCar.licensePlate = car.licensePlate ?? '1234567890';
    newCar.color = car.color ?? 'black';
    newCar.mileage = car.mileage ?? 100000;
    newCar.fuelLevel = car.fuelLevel ?? 50;
    newCar.isAvailable = car.isAvailable ?? true;
    newCar.carStatus = car.carStatus ?? CarStatus.AVAILABLE;
    newCar.isDeleted = car.isDeleted ?? false;
    newCar.createdAt = car.createdAt ?? new Date();
    newCar.updatedAt = car.updatedAt ?? null;
    newCar.lastKnownLat = car.lastKnownLat ?? null;
    newCar.lastKnownLon = car.lastKnownLon ?? null;
    newCar.lastPositionAt = car.lastPositionAt ?? null;
    return newCar;
  };

  const createCarRead = (car: Partial<CarRead> = {}): CarRead => {
    const newCarRead = new CarRead();
    newCarRead.id = car.id ?? uuidv4();
    newCarRead.brand = car.brand ?? 'mercedes-benz';
    newCarRead.model = car.model ?? 'c-class';
    newCarRead.licensePlate = car.licensePlate ?? '1234567890';
    newCarRead.color = car.color ?? 'black';
    newCarRead.mileage = car.mileage ?? 100000;
    newCarRead.fuelLevel = car.fuelLevel ?? 50;
    newCarRead.isAvailable = car.isAvailable ?? true;
    newCarRead.carStatus = car.carStatus ?? CarStatus.AVAILABLE;
    newCarRead.isDeleted = car.isDeleted ?? false;
    newCarRead.createdAt = car.createdAt ?? new Date();
    newCarRead.updatedAt = car.updatedAt ?? null;
    newCarRead.lastKnownLat = car.lastKnownLat ?? null;
    return newCarRead;
  };
});
