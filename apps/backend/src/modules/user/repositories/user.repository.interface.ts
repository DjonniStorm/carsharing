import { UserEntity } from '../entities/user.entity';

export interface IUserRepository {
  findAll(includeDeleted: boolean): Promise<UserEntity[]>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByPhone(phone: string): Promise<UserEntity | null>;
  create(data: UserEntity): Promise<UserEntity>;
  update(id: string, data: UserEntity): Promise<UserEntity>;
  delete(id: string): Promise<UserEntity>;
  restore(id: string): Promise<UserEntity>;
}

export const IUserRepositoryToken = Symbol('IUserRepository');
