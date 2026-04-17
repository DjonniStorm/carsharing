import { Injectable } from '@nestjs/common';
import {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleEntity,
} from '../../../../shared/types/repository.types';
import { VehicleRepository } from '../vehicle.repository';

@Injectable()
export class VehiclePrismaRepository implements VehicleRepository {
  private items: VehicleEntity[] = [];
  private nextId = 1;

  async findById(id: number): Promise<VehicleEntity | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async findAll(): Promise<VehicleEntity[]> {
    return this.items.filter((item) => item.deletedAt === null);
  }

  async findNearby(lat: number, lon: number): Promise<VehicleEntity[]> {
    return this.items.filter(
      (item) => item.deletedAt === null && item.location.lat === lat && item.location.lon === lon,
    );
  }

  async create(data: CreateVehicleInput): Promise<VehicleEntity> {
    const created: VehicleEntity = {
      ...data,
      id: this.nextId++,
      deletedAt: data.deletedAt ?? null,
    };
    this.items.push(created);
    return created;
  }

  async update(id: number, data: UpdateVehicleInput): Promise<VehicleEntity> {
    const item = await this.findById(id);
    if (!item) {
      throw new Error(`Vehicle ${id} not found`);
    }
    Object.assign(item, data);
    return item;
  }

  async softDelete(id: number): Promise<VehicleEntity> {
    return this.update(id, { deletedAt: new Date() });
  }

  async restore(id: number): Promise<VehicleEntity> {
    return this.update(id, { deletedAt: null });
  }
}
