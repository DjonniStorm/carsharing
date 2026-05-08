import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CarEntity } from '../entities/car.entity';
import { ICarRepository } from './car.repository.interface';

@Injectable()
export class CarRepository implements ICarRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeDeleted: boolean): Promise<CarEntity[]> {
    return this.prisma.car.findMany({
      where: includeDeleted ? {} : { isDeleted: false },
    });
  }

  findById(id: string): Promise<CarEntity | null> {
    return this.prisma.car.findUnique({ where: { id } });
  }
  findByLicensePlate(licensePlate: string): Promise<CarEntity | null> {
    return this.prisma.car.findUnique({ where: { licensePlate } });
  }
  create(car: CarEntity): Promise<CarEntity> {
    return this.prisma.car.create({ data: car });
  }
  update(id: string, car: Partial<CarEntity>): Promise<CarEntity> {
    return this.prisma.car.update({ where: { id }, data: car });
  }
  updatePosition(
    id: string,
    lastKnownLat: number,
    lastKnownLon: number,
    lastPositionAt: string,
  ): Promise<CarEntity> {
    return this.prisma.car.update({
      where: { id },
      data: { lastKnownLat, lastKnownLon, lastPositionAt },
    });
  }
  delete(id: string): Promise<CarEntity> {
    return this.prisma.car.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
  restore(id: string): Promise<CarEntity> {
    return this.prisma.car.update({
      where: { id },
      data: { isDeleted: false },
    });
  }
}
