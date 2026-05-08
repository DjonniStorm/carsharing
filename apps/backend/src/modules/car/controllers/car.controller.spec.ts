import { CarController } from './car.controller';
import { CarService } from '../services/car.service';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { CarRepository } from '../repositories/car.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { CarStatus } from '../entities/car-status';
import { CarMapper } from '../common/mapper';
import { Car } from '../entities/dtos/car';
import { CarRead } from '../entities/dtos/car.read';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

describe('CarController', () => {
  let controller: CarController;
  let service: CarService;
  let prisma: PrismaService;
  let repository: CarRepository;

  beforeEach(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
    repository = new CarRepository(prisma);
    service = new CarService(repository);
    controller = new CarController(service);
  });

  afterAll(async () => {
    await truncateApplicationTable(prisma, 'car');
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await truncateApplicationTable(prisma, 'car');
  });

  describe('Получение всех автомобилей', () => {
    it('Получает все автомобили', async () => {
      // arrange
      const cars = [
        {
          id: '1',
          brand: 'Toyota',
          model: 'Camry',
          licensePlate: '1234567890',
          color: 'Red',
          mileage: 100000,
          fuelLevel: 50,
          isAvailable: true,
          carStatus: CarStatus.AVAILABLE,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastKnownLat: 100,
          lastKnownLon: 100,
          lastPositionAt: new Date(),
        },
        {
          id: '2',
          brand: 'Honda',
          model: 'Accord',
          licensePlate: '1234567891',
          color: 'Blue',
          mileage: 100000,
          fuelLevel: 50,
          isAvailable: true,
          carStatus: CarStatus.AVAILABLE,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastKnownLat: 100,
          lastKnownLon: 100,
          lastPositionAt: new Date(),
        },
      ];

      for await (const car of cars) {
        await repository.create(CarMapper.toCarEntity(car));
      }

      // act
      const foundCars = await controller.findAll(false);
      expect(foundCars).toBeDefined();
      expect(foundCars).not.toBeNull();
      expect(foundCars.length).toBe(cars.length);
      for (let i = 0; i < cars.length; i++) {
        assertCar(cars[i], foundCars[i]);
      }
    });

    it('Получает все автомобили с includeDeleted true', async () => {
      // arrange
      const cars = [
        {
          id: '1',
          brand: 'Toyota',
          model: 'Camry',
          licensePlate: '1234567890',
          color: 'Red',
          mileage: 100000,
          fuelLevel: 50,
          isAvailable: true,
          carStatus: CarStatus.AVAILABLE,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastKnownLat: 100,
          lastKnownLon: 100,
          lastPositionAt: new Date(),
        },
        {
          id: '2',
          brand: 'Honda',
          model: 'Accord',
          licensePlate: '1234567891',
          color: 'Blue',
          mileage: 100000,
          fuelLevel: 50,
          isAvailable: true,
          carStatus: CarStatus.AVAILABLE,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastKnownLat: 100,
          lastKnownLon: 100,
          lastPositionAt: new Date(),
        },
        {
          id: '3',
          brand: 'Ford',
          model: 'Mustang',
          licensePlate: '1234567892',
          color: 'Green',
          mileage: 100000,
          fuelLevel: 50,
          isAvailable: true,
          carStatus: CarStatus.AVAILABLE,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastKnownLat: 100,
          lastKnownLon: 100,
          lastPositionAt: new Date(),
        },
      ];
      for await (const car of cars) {
        await repository.create(CarMapper.toCarEntity(car));
      }
      // act
      const foundCars = await controller.findAll(true);
      expect(foundCars).toBeDefined();
      expect(foundCars).not.toBeNull();
      expect(foundCars.length).toBe(cars.length);
      for (let i = 0; i < cars.length; i++) {
        assertCar(cars[i], foundCars[i]);
      }
    });

    it('Получает пустой массив если нет автомобилей', async () => {
      // act
      const foundCars = await controller.findAll(false);
      expect(foundCars).toBeDefined();
      expect(foundCars).not.toBeNull();
      expect(foundCars.length).toBe(0);
    });
  });

  describe('Получение автомобиля по ID', () => {
    it('Получает автомобиль по ID', async () => {
      // arrange
      const car: Car = {
        brand: 'Toyota',
        model: 'Camry',
        licensePlate: '1234567890',
        color: 'Red',
        mileage: 100000,
        fuelLevel: 50,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastKnownLat: 100,
        lastKnownLon: 100,
        lastPositionAt: new Date(),
      };
      const createdCar = await service.create(car);
      // act
      const foundCar = await controller.findById(createdCar.id);
      expect(foundCar).toBeDefined();
      expect(foundCar).not.toBeNull();
      assertCar(car, foundCar);
    });

    it('Получает ошибку если автомобиль не найден', async () => {
      // act
      await expect(controller.findById(uuidv4())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Получение автомобиля по номеру', () => {
    it('Получает автомобиль по номеру', async () => {
      // arrange
      const car = {
        id: '1',
        brand: 'Toyota',
        model: 'Camry',
        licensePlate: '1234567890',
        color: 'Red',
        mileage: 100000,
        fuelLevel: 50,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastKnownLat: 100,
        lastKnownLon: 100,
        lastPositionAt: new Date(),
      };
      await repository.create(CarMapper.toCarEntity(car));
      // act
      const foundCar = await controller.findByLicensePlate(car.licensePlate);
      expect(foundCar).toBeDefined();
      expect(foundCar).not.toBeNull();
      assertCar(car, foundCar);
    });

    it('Получает ошибку если автомобиль не найден', async () => {
      // act
      await expect(controller.findByLicensePlate(uuidv4())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Создание автомобиля', () => {
    it('Создает автомобиль', async () => {
      // arrange
      const car = {
        brand: 'Toyota',
        model: 'Camry',
        licensePlate: '1234567890',
        color: 'Red',
        mileage: 100000,
        fuelLevel: 50,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastKnownLat: 100,
        lastKnownLon: 100,
        lastPositionAt: new Date(),
      };
      // act
      const createdCar = await controller.create(car);
      expect(createdCar).toBeDefined();
      expect(createdCar).not.toBeNull();
      assertCar(car, createdCar);
    });

    it('Получает ошибку, если автомобиль с таким номером уже существует', async () => {
      // arrange
      const licensePlate = '1234567890';
      const car: Car = {
        brand: 'Toyota',
        model: 'Camry',
        licensePlate: licensePlate,
        color: 'Red',
        mileage: 100000,
        fuelLevel: 50,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastKnownLat: 100,
        lastKnownLon: 100,
        lastPositionAt: new Date(),
      };
      const car2: Car = {
        brand: 'Toyota',
        model: 'Camry',
        licensePlate: licensePlate,
        color: 'Red',
        mileage: 100000,
        fuelLevel: 50,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastKnownLat: 100,
        lastKnownLon: 100,
        lastPositionAt: new Date(),
      };

      await controller.create(car);
      // act
      await expect(controller.create(car2)).rejects.toThrow(ConflictException);
    });
  });

  describe('Обновление автомобиля', () => {
    it('Обновляет автомобиль', async () => {
      // arrange
      const car: Car = {
        brand: 'Toyota',
        model: 'Camry',
        licensePlate: '1234567890',
        color: 'Red',
        mileage: 100000,
        fuelLevel: 50,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastKnownLat: 100,
      };
      const createdCar = await service.create(car);
      // act
      const updatedCar = await controller.update(createdCar.id, {
        color: 'Blue',
        mileage: 100001,
        fuelLevel: 51,
        isAvailable: false,
        carStatus: CarStatus.UNAVAILABLE,
        isDeleted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastKnownLat: 101,
        lastKnownLon: 101,
        lastPositionAt: new Date(),
      });
      expect(updatedCar).toBeDefined();
      expect(updatedCar).not.toBeNull();
      expect(updatedCar.licensePlate).toBe(car.licensePlate);
      expect(updatedCar.color).toBe('Blue');
      expect(updatedCar.mileage).toBe(100001);
      expect(updatedCar.fuelLevel).toBe(51);
      expect(updatedCar.isAvailable).toBe(false);
      expect(updatedCar.carStatus).toBe(CarStatus.UNAVAILABLE);
      expect(updatedCar.isDeleted).toBe(true);
      expect(updatedCar.createdAt).toStrictEqual(updatedCar.createdAt);
      expect(updatedCar.updatedAt).toStrictEqual(updatedCar.updatedAt);
      expect(updatedCar.lastKnownLat).toBe(101);
      expect(updatedCar.lastKnownLon).toBe(101);
      expect(updatedCar.lastPositionAt).toStrictEqual(
        updatedCar.lastPositionAt,
      );
    });

    it('Получает ошибку, если автомобиль не найден', async () => {
      // act
      await expect(
        controller.update(uuidv4(), {
          color: 'Blue',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('Получает ошибку, если автомобиль с таким номером уже существует', async () => {
      // arrange
      const licensePlate = '1234567890';
      const licensePlate2 = '1234567891';
      const car: Car = {
        brand: 'Toyota',
        model: 'Camry',
        licensePlate: licensePlate,
        color: 'Red',
        mileage: 100000,
        fuelLevel: 50,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastKnownLat: 100,
        lastKnownLon: 100,
        lastPositionAt: new Date(),
      };

      await controller.create(car);

      const car2: Car = {
        brand: 'Toyota',
        model: 'Camry',
        licensePlate: licensePlate2,
        color: 'Red',
        mileage: 100000,
        fuelLevel: 50,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastKnownLat: 100,
        lastKnownLon: 100,
        lastPositionAt: new Date(),
      };

      const createdCar = await controller.create(car2);
      // act
      await expect(
        controller.update(createdCar.id, {
          licensePlate: car.licensePlate,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Удаление автомобиля', () => {
    it('Удаляет автомобиль', async () => {
      // arrange
      const car: Car = {
        brand: 'Toyota',
        model: 'Camry',
        licensePlate: '1234567890',
        color: 'Red',
        mileage: 100000,
        fuelLevel: 50,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastKnownLat: 100,
        lastKnownLon: 100,
        lastPositionAt: new Date(),
      };
      const createdCar = await service.create(car);
      // act
      const deletedCar = await controller.delete(createdCar.id);
      expect(deletedCar).toBeDefined();
      expect(deletedCar).not.toBeNull();
      expect(deletedCar.isDeleted).toBe(true);
    });

    it('Получает ошибку, если автомобиль не найден', async () => {
      // act
      await expect(controller.delete(uuidv4())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Восстановление автомобиля', () => {
    it('Восстанавливает автомобиль', async () => {
      // arrange
      const car: Car = {
        brand: 'Toyota',
        model: 'Camry',
        licensePlate: '1234567890',
        color: 'Red',
        mileage: 100000,
        fuelLevel: 50,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastKnownLat: 100,
        lastKnownLon: 100,
        lastPositionAt: new Date(),
      };
      const createdCar = await service.create(car);
      // act
      const restoredCar = await controller.restore(createdCar.id);
      expect(restoredCar).toBeDefined();
      expect(restoredCar).not.toBeNull();
      expect(restoredCar.isDeleted).toBe(false);
    });

    it('Получает ошибку, если автомобиль не найден', async () => {
      // act
      await expect(controller.restore(uuidv4())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Обновление позиции автомобиля', () => {
    it('Обновляет позицию автомобиля', async () => {
      // arrange
      const car: Car = {
        brand: 'Toyota',
        model: 'Camry',
        licensePlate: '1234567890',
        color: 'Red',
        mileage: 100000,
        fuelLevel: 50,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const createdCar = await service.create(car);
      const date = new Date();
      // act
      const updatedCar = await controller.updatePosition(createdCar.id, {
        lastKnownLat: 100,
        lastKnownLon: 100,
        lastPositionAt: date,
      });
      expect(updatedCar).toBeDefined();
      expect(updatedCar).not.toBeNull();
      expect(updatedCar.lastKnownLat).toBe(100);
      expect(updatedCar.lastKnownLon).toBe(100);
      expect(updatedCar.lastPositionAt).toStrictEqual(date);
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
    expect(found.updatedAt).toStrictEqual(car.updatedAt);
    expect(found.lastKnownLat).toBe(car.lastKnownLat);
    expect(found.lastKnownLon).toBe(car.lastKnownLon);
    expect(found.lastPositionAt).toStrictEqual(car.lastPositionAt);
  };
});
