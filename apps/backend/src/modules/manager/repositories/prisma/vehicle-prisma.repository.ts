import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleEntity,
} from '../../../../shared/types/repository.types';
import { PrismaService } from '../../../../prisma/prisma.service';
import { VehicleRepository } from '../vehicle.repository';

@Injectable()
export class VehiclePrismaRepository implements VehicleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<VehicleEntity | null> {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: { sessionInfo: true, carStatus: true },
    });
    if (!car || car.isDeleted) {
      return null;
    }
    return this.toVehicleEntity(car);
  }

  async findAll(): Promise<VehicleEntity[]> {
    const cars = await this.prisma.car.findMany({
      where: { isDeleted: false },
      include: { sessionInfo: true, carStatus: true },
      orderBy: { id: 'asc' },
    });
    return cars.map((car) => this.toVehicleEntity(car));
  }

  async findNearby(lat: number, lon: number): Promise<VehicleEntity[]> {
    const cars = await this.findAll();
    return cars.filter(
      (car) => car.location.lat === lat && car.location.lon === lon,
    );
  }

  async create(data: CreateVehicleInput): Promise<VehicleEntity> {
    const status = await this.getOrCreateStatus(data.status);
    const created = await this.prisma.car.create({
      data: {
        mileage: 0,
        fuelLevel: 100,
        isAvailable: data.status === 'ACTIVE',
        isDeleted: false,
        carStatusId: status.id,
        sessionInfo: {
          create: {
            brand: data.brand,
            model: data.model,
            licensePlate: data.plateNumber,
            color: 'unknown',
            currentLat: new Prisma.Decimal(data.location.lat),
            currentLon: new Prisma.Decimal(data.location.lon),
          },
        },
      },
      include: { sessionInfo: true, carStatus: true },
    });
    return this.toVehicleEntity(created);
  }

  async update(id: number, data: UpdateVehicleInput): Promise<VehicleEntity> {
    const current = await this.prisma.car.findUnique({
      where: { id },
      include: { sessionInfo: true, carStatus: true },
    });
    if (!current || current.isDeleted) {
      throw new Error(`Vehicle ${id} not found`);
    }
    if (data.status) {
      const status = await this.getOrCreateStatus(data.status);
      await this.prisma.car.update({
        where: { id },
        data: {
          carStatusId: status.id,
          isAvailable: data.status === 'ACTIVE',
        },
      });
    }

    if (data.brand || data.model || data.plateNumber || data.location) {
      await this.prisma.carSessionInfo.update({
        where: { carId: id },
        data: {
          brand: data.brand ?? undefined,
          model: data.model ?? undefined,
          licensePlate: data.plateNumber ?? undefined,
          currentLat:
            data.location?.lat !== undefined
              ? new Prisma.Decimal(data.location.lat)
              : undefined,
          currentLon:
            data.location?.lon !== undefined
              ? new Prisma.Decimal(data.location.lon)
              : undefined,
        },
      });
    }

    const updated = await this.prisma.car.findUnique({
      where: { id },
      include: { sessionInfo: true, carStatus: true },
    });
    if (!updated) {
      throw new Error(`Vehicle ${id} not found`);
    }
    return this.toVehicleEntity(updated);
  }

  async softDelete(id: number): Promise<VehicleEntity> {
    const updated = await this.prisma.car.update({
      where: { id },
      data: { isDeleted: true, isAvailable: false },
      include: { sessionInfo: true, carStatus: true },
    });
    return this.toVehicleEntity(updated, new Date());
  }

  async restore(id: number): Promise<VehicleEntity> {
    const updated = await this.prisma.car.update({
      where: { id },
      data: { isDeleted: false },
      include: { sessionInfo: true, carStatus: true },
    });
    return this.toVehicleEntity(updated, null);
  }

  private async getOrCreateStatus(name: VehicleEntity['status']) {
    const existing = await this.prisma.carStatus.findFirst({ where: { name } });
    if (existing) {
      return existing;
    }
    return this.prisma.carStatus.create({ data: { name } });
  }

  private toVehicleEntity(
    car: {
      id: number;
      isDeleted: boolean;
      carStatus?: { name: string } | null;
      sessionInfo?: {
        brand: string;
        model: string;
        licensePlate: string;
        currentLat: Prisma.Decimal;
        currentLon: Prisma.Decimal;
      } | null;
    },
    deletedAtOverride?: Date | null,
  ): VehicleEntity {
    return {
      id: car.id,
      brand: car.sessionInfo?.brand ?? 'unknown',
      model: car.sessionInfo?.model ?? 'unknown',
      plateNumber: car.sessionInfo?.licensePlate ?? 'unknown',
      status:
        car.carStatus?.name === 'IN_USE' || car.carStatus?.name === 'BLOCKED'
          ? (car.carStatus.name as VehicleEntity['status'])
          : 'ACTIVE',
      location: {
        lat: Number(car.sessionInfo?.currentLat ?? 0),
        lon: Number(car.sessionInfo?.currentLon ?? 0),
      },
      deletedAt:
        deletedAtOverride !== undefined
          ? deletedAtOverride
          : car.isDeleted
            ? new Date('1970-01-01T00:00:00.000Z')
            : null,
    };
  }
}
