import { CreateUserEntity } from '../entities/dtos/user.create';
import { UpdateUserEntity } from '../entities/dtos/user.update';
import { ReadUserEntity } from '../entities/dtos/user.read';

export interface IUserService {
  findAll(includeDeleted: boolean): Promise<ReadUserEntity[]>;
  findById(id: string): Promise<ReadUserEntity | null>;
  findByEmail(email: string): Promise<ReadUserEntity | null>;
  findByPhone(phone: string): Promise<ReadUserEntity | null>;
  create(user: CreateUserEntity): Promise<ReadUserEntity>;
  update(id: string, user: Partial<UpdateUserEntity>): Promise<ReadUserEntity>;
  delete(id: string): Promise<ReadUserEntity>;
  restore(id: string): Promise<ReadUserEntity>;
}
