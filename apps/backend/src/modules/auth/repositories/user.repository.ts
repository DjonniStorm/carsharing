import {
  CreateUserInput,
  UserEntity,
} from '../../../shared/types/repository.types';

export interface UserRepository {
  findById(id: number): Promise<UserEntity | null>;
  findByPhone(phone: string): Promise<UserEntity | null>;
  create(data: CreateUserInput): Promise<UserEntity>;
}
