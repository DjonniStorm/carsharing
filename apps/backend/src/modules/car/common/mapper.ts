import { v4 as uuidv4 } from 'uuid';

import { CarEntity } from '../entities/car.entity';
import { Car } from '../entities/dtos/car';
import { CarRead } from '../entities/dtos/car.read';

type CarEntityPatch = {
  -readonly [K in keyof CarEntity]?: CarEntity[K];
};

export class CarMapper {
  static toCarRead(car: CarEntity): CarRead {
    return {
      id: car.id,
      brand: car.brand,
      model: car.model,
      licensePlate: car.licensePlate,
      color: car.color,
      mileage: car.mileage,
      fuelLevel: car.fuelLevel,
      isAvailable: car.isAvailable,
      carStatus: car.carStatus,
      isDeleted: car.isDeleted,
      createdAt: new Date(car.createdAt),
      updatedAt: car.updatedAt ? new Date(car.updatedAt) : null,
      lastKnownLat: car.lastKnownLat,
      lastKnownLon: car.lastKnownLon,
      lastPositionAt: car.lastPositionAt ? new Date(car.lastPositionAt) : null,
    };
  }

  static toCarEntity(car: Car): CarEntity {
    return new CarEntity(
      uuidv4(),
      car.brand,
      car.model,
      car.licensePlate,
      car.color,
      car.mileage,
      car.fuelLevel,
      car.isAvailable,
      car.carStatus,
      car.isDeleted,
      car.createdAt.toISOString(),
      car.updatedAt != null ? car.updatedAt.toISOString() : null,
      car.lastKnownLat ?? null,
      car.lastKnownLon ?? null,
      car.lastPositionAt != null ? car.lastPositionAt.toISOString() : null,
    );
  }

  static toPartialCarEntity(car: Partial<Car>): Partial<CarEntity> {
    const data: CarEntityPatch = {};
    if (car.brand !== undefined) {
      data.brand = car.brand;
    }
    if (car.model !== undefined) {
      data.model = car.model;
    }
    if (car.licensePlate !== undefined) {
      data.licensePlate = car.licensePlate;
    }
    if (car.color !== undefined) {
      data.color = car.color;
    }
    if (car.mileage !== undefined) {
      data.mileage = car.mileage;
    }
    if (car.fuelLevel !== undefined) {
      data.fuelLevel = car.fuelLevel;
    }
    if (car.isAvailable !== undefined) {
      data.isAvailable = car.isAvailable;
    }
    if (car.carStatus !== undefined) {
      data.carStatus = car.carStatus;
    }
    if (car.isDeleted !== undefined) {
      data.isDeleted = car.isDeleted;
    }
    if (car.createdAt !== undefined) {
      data.createdAt = car.createdAt.toISOString();
    }
    if (car.updatedAt !== undefined) {
      data.updatedAt =
        car.updatedAt != null ? car.updatedAt.toISOString() : null;
    }
    if (car.lastKnownLat !== undefined) {
      data.lastKnownLat = car.lastKnownLat;
    }
    if (car.lastKnownLon !== undefined) {
      data.lastKnownLon = car.lastKnownLon;
    }
    if (car.lastPositionAt !== undefined) {
      data.lastPositionAt =
        car.lastPositionAt != null ? car.lastPositionAt.toISOString() : null;
    }
    return data;
  }
}
