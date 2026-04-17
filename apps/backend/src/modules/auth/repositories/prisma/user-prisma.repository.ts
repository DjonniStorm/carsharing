import { Injectable } from '@nestjs/common';
import {
  CreateUserInput,
  UserEntity,
} from '../../../../shared/types/repository.types';
import { UserRepository } from '../user.repository';

@Injectable()
export class UserPrismaRepository implements UserRepository {
  private items: UserEntity[] = [];
  private nextId = 1;

  async findById(id: number): Promise<UserEntity | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    return this.items.find((item) => item.phone === phone) ?? null;
  }

  async create(data: CreateUserInput): Promise<UserEntity> {
    const created: UserEntity = {
      ...data,
      id: this.nextId++,
    };
    this.items.push(created);
    return created;
  }
}
