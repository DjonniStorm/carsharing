import { CreateUserEntity } from '../entities/dtos/user.create';
import { UpdateUserEntity } from '../entities/dtos/user.update';
import { ReadUserEntity } from '../entities/dtos/user.read';
import type { UserRole } from '../entities/user.role';

export type RegisterUserInput = Pick<
  CreateUserEntity,
  'name' | 'email' | 'phone' | 'password'
>;

export interface IUserService {
  findAll(includeDeleted: boolean): Promise<ReadUserEntity[]>;
  findById(id: string): Promise<ReadUserEntity | null>;
  findByEmail(email: string): Promise<ReadUserEntity | null>;
  findByPhone(phone: string): Promise<ReadUserEntity | null>;
  create(user: CreateUserEntity): Promise<ReadUserEntity>;

  /**
   * Публичная регистрация (без JWT).
   * `activateImmediately: false` — создаёт неактивную запись (ожидание кода на email).
   */
  registerPublic(
    input: RegisterUserInput,
    role: UserRole,
    options?: { activateImmediately?: boolean },
  ): Promise<ReadUserEntity>;
  update(id: string, user: Partial<UpdateUserEntity>): Promise<ReadUserEntity>;
  delete(id: string): Promise<ReadUserEntity>;
  restore(id: string): Promise<ReadUserEntity>;
}
