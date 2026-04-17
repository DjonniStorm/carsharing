import { Injectable } from '@nestjs/common';
import {
  CreateViolationInput,
  ViolationEntity,
} from '../../../../shared/types/repository.types';
import { ViolationRepository } from '../violation.repository';

@Injectable()
export class ViolationPrismaRepository implements ViolationRepository {
  private items: ViolationEntity[] = [];
  private nextId = 1;

  async findAll(): Promise<ViolationEntity[]> {
    return this.items;
  }

  async findById(id: number): Promise<ViolationEntity | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async create(data: CreateViolationInput): Promise<ViolationEntity> {
    const created: ViolationEntity = {
      ...data,
      id: this.nextId++,
      createdAt: data.createdAt ?? new Date(),
    };
    this.items.push(created);
    return created;
  }
}
