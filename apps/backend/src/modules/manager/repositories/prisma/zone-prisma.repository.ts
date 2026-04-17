import { Injectable } from '@nestjs/common';
import {
  CreateZoneInput,
  UpdateZoneInput,
  ZoneEntity,
} from '../../../../shared/types/repository.types';
import { ZoneRepository } from '../zone.repository';

@Injectable()
export class ZonePrismaRepository implements ZoneRepository {
  private items: ZoneEntity[] = [];
  private nextId = 1;

  async findAll(): Promise<ZoneEntity[]> {
    return this.items.filter((item) => item.deletedAt === null);
  }

  async findActive(): Promise<ZoneEntity[]> {
    return this.items.filter((item) => item.deletedAt === null && item.isActive);
  }

  async findById(id: number): Promise<ZoneEntity | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async create(data: CreateZoneInput): Promise<ZoneEntity> {
    const created: ZoneEntity = {
      ...data,
      id: this.nextId++,
      deletedAt: data.deletedAt ?? null,
    };
    this.items.push(created);
    return created;
  }

  async update(id: number, data: UpdateZoneInput): Promise<ZoneEntity> {
    const item = await this.findById(id);
    if (!item) {
      throw new Error(`Zone ${id} not found`);
    }
    Object.assign(item, data);
    return item;
  }

  async softDelete(id: number): Promise<ZoneEntity> {
    return this.update(id, { deletedAt: new Date() });
  }

  async restore(id: number): Promise<ZoneEntity> {
    return this.update(id, { deletedAt: null });
  }
}
