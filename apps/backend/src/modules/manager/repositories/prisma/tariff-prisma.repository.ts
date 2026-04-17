import { Injectable } from '@nestjs/common';
import {
  CreateTariffInput,
  TariffEntity,
  UpdateTariffInput,
} from '../../../../shared/types/repository.types';
import { TariffRepository } from '../tariff.repository';

@Injectable()
export class TariffPrismaRepository implements TariffRepository {
  private items: TariffEntity[] = [];
  private nextId = 1;

  async findAll(): Promise<TariffEntity[]> {
    return this.items.filter((item) => item.deletedAt === null);
  }

  async findById(id: number): Promise<TariffEntity | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async create(data: CreateTariffInput): Promise<TariffEntity> {
    const created: TariffEntity = {
      ...data,
      id: this.nextId++,
      deletedAt: data.deletedAt ?? null,
    };
    this.items.push(created);
    return created;
  }

  async update(id: number, data: UpdateTariffInput): Promise<TariffEntity> {
    const item = await this.findById(id);
    if (!item) {
      throw new Error(`Tariff ${id} not found`);
    }
    Object.assign(item, data);
    return item;
  }

  async softDelete(id: number): Promise<TariffEntity> {
    return this.update(id, { deletedAt: new Date() });
  }

  async restore(id: number): Promise<TariffEntity> {
    return this.update(id, { deletedAt: null });
  }
}
