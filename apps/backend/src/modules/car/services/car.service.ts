import { Inject, Injectable, Logger } from '@nestjs/common';

import { DbErrors } from '../common/db-errors';
import {
  CarAlreadyDeletedException,
  CarAlreadyRestoredException,
  CarNotFoundException,
  LicensePlateAlreadyExistsException,
} from '../common/errors';
import { CarMapper } from '../common/mapper';
import { CarEntity } from '../entities/car.entity';
import { Car } from '../entities/dtos/car';
import { CarRead } from '../entities/dtos/car.read';
import {
  ICarRepositoryToken,
  type ICarRepository,
} from '../repositories/car.repository.interface';
import { ICarService } from './car.service.interface';

@Injectable()
export class CarService implements ICarService {
  private readonly logger = new Logger(CarService.name);

  constructor(
    @Inject(ICarRepositoryToken) private readonly repository: ICarRepository,
  ) {}

  async findAll(includeDeleted: boolean): Promise<CarRead[]> {
    this.logger.log('Finding all cars');
    try {
      const cars = await this.repository.findAll(includeDeleted);
      return cars.map(CarMapper.toCarRead);
    } catch (error) {
      this.logger.error('Failed to find all cars', error);
      throw DbErrors.mapError(error);
    }
  }

  async findById(id: string): Promise<CarRead> {
    this.logger.log(`Finding car by id: ${id}`);
    const car = await this.repository.findById(id);
    if (!car) {
      this.logger.error(`Car with id ${id} not found`);
      throw new CarNotFoundException(`Автомобиль с id ${id} не найден`);
    }
    return CarMapper.toCarRead(car);
  }

  async findByLicensePlate(licensePlate: string): Promise<CarRead> {
    this.logger.log(`Finding car by license plate: ${licensePlate}`);
    const car = await this.repository.findByLicensePlate(licensePlate);
    if (!car) {
      this.logger.error(`Car with license plate ${licensePlate} not found`);
      throw new CarNotFoundException(
        `Автомобиль с номером ${licensePlate} не найден`,
      );
    }
    return CarMapper.toCarRead(car);
  }

  async create(car: Car): Promise<CarRead> {
    this.logger.log(`Creating car: ${car.licensePlate}`);
    try {
      const carEntity = CarMapper.toCarEntity(car);
      CarEntity.validate(carEntity);
      const createdCar = await this.repository.create(carEntity);
      return CarMapper.toCarRead(createdCar);
    } catch (error) {
      this.logger.error(`Failed to create car: ${car.licensePlate}`, error);
      throw DbErrors.mapError(error);
    }
  }

  async update(id: string, car: Partial<Car>): Promise<CarRead> {
    this.logger.log(`Updating car: ${id}`);
    try {
      const existing = await this.repository.findById(id);
      if (!existing) {
        this.logger.error(`Car with id ${id} not found`);
        throw new CarNotFoundException(`Автомобиль с id ${id} не найден`);
      }
      const patch = CarMapper.toPartialCarEntity({
        ...car,
        updatedAt: new Date(car.updatedAt ?? new Date()),
      });
      const updatedCar = await this.repository.update(id, patch);
      return CarMapper.toCarRead(updatedCar);
    } catch (error) {
      this.logger.error(`Failed to update car: ${id}`, error);
      throw DbErrors.mapError(error);
    }
  }

  async delete(id: string): Promise<CarRead> {
    this.logger.log(`Deleting car: ${id}`);
    const existing = await this.repository.findById(id);
    if (!existing) {
      this.logger.error(`Car with id ${id} not found`);
      throw new CarNotFoundException(`Автомобиль с id ${id} не найден`);
    }
    if (existing.isDeleted === true) {
      this.logger.error(`Car with id ${id} is already deleted`);
      throw new CarAlreadyDeletedException(`Автомобиль с id ${id} уже удален`);
    }
    const deleted = await this.repository.delete(id);
    return CarMapper.toCarRead(deleted);
  }

  async restore(id: string): Promise<CarRead> {
    this.logger.log(`Restoring car: ${id}`);
    const existing = await this.repository.findById(id);
    if (!existing) {
      this.logger.error(`Car with id ${id} not found`);
      throw new CarNotFoundException(`Автомобиль с id ${id} не найден`);
    }
    if (existing.isDeleted === false) {
      this.logger.error(`Car with id ${id} is not deleted`);
      throw new CarAlreadyRestoredException(
        `Автомобиль с id ${id} уже восстановлен`,
      );
    }
    const restored = await this.repository.restore(id);
    return CarMapper.toCarRead(restored);
  }

  async updatePosition(
    id: string,
    lastKnownLat: number,
    lastKnownLon: number,
    lastPositionAt: Date,
  ): Promise<CarRead> {
    this.logger.log(`Updating car position: ${id}`);
    const existing = await this.repository.findById(id);
    if (!existing) {
      this.logger.error(`Car with id ${id} not found`);
      throw new CarNotFoundException(`Автомобиль с id ${id} не найден`);
    }
    const updated = await this.repository.updatePosition(
      id,
      lastKnownLat,
      lastKnownLon,
      lastPositionAt.toISOString(),
    );
    return CarMapper.toCarRead(updated);
  }
}
