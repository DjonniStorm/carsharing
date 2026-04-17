import { Injectable } from '@nestjs/common';
import {
  CreateTripInput,
  TripEntity,
  UpdateTripInput,
} from '../../../../shared/types/repository.types';
import { TripRepository } from '../trip.repository';

@Injectable()
export class TripPrismaRepository implements TripRepository {
  private items: TripEntity[] = [];
  private nextId = 1;

  async findById(id: number): Promise<TripEntity | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async findByDriverId(driverId: number): Promise<TripEntity[]> {
    return this.items.filter((item) => item.driverId === driverId);
  }

  async create(data: CreateTripInput): Promise<TripEntity> {
    const created: TripEntity = {
      ...data,
      id: this.nextId++,
      endTime: data.endTime ?? null,
      endLocation: data.endLocation ?? null,
    };
    this.items.push(created);
    return created;
  }

  async update(id: number, data: UpdateTripInput): Promise<TripEntity> {
    const item = await this.findById(id);
    if (!item) {
      throw new Error(`Trip ${id} not found`);
    }
    Object.assign(item, data);
    return item;
  }
}
