import {
  CreateUserInput,
  UserEntity,
} from '../../../shared/types/repository.types';

export interface UserRepository {
  findById(id: number): Promise<UserEntity | null>;
  findByPhone(phone: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByIdentifier(identifier: string): Promise<UserEntity | null>;
  getOrCreateRoleId(roleName: string): Promise<number>;
  create(data: CreateUserInput): Promise<UserEntity>;
}
