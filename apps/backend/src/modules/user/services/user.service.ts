import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserEntity } from '../entities/user.entity';
import {
  IUserRepositoryToken,
  type IUserRepository,
} from '../repositories/user.repository.interface';
import { CreateUserEntity } from '../entities/dtos/user.create';
import { IUserService } from './user.service.interface';
import { ReadUserEntity } from '../entities/dtos/user.read';
import { UserMapper } from '../common/mapper';
import * as bcrypt from 'bcryptjs';
import { UpdateUserEntity } from '../entities/dtos/user.update';
import { DbErrors } from '../common/db-errors';
import { UserNotFoundException } from '../common/errors';

@Injectable()
export class UserService implements IUserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @Inject(IUserRepositoryToken) private readonly repository: IUserRepository,
  ) {}

  async findAll(includeDeleted: boolean): Promise<ReadUserEntity[]> {
    this.logger.log('Finding all users');
    try {
      const users = await this.repository.findAll(includeDeleted);
      return users.map(UserMapper.toReadUserEntity);
    } catch (error) {
      this.logger.error('Failed to find all users', error);
      throw DbErrors.mapError(error);
    }
  }

  async findById(id: string): Promise<ReadUserEntity | null> {
    this.logger.log(`Finding user by id: ${id}`);
    const user = await this.repository.findById(id);
    if (!user) {
      this.logger.error(`User with id ${id} not found`);
      throw new UserNotFoundException(`Пользователь с id ${id} не найден`);
    }
    return UserMapper.toReadUserEntity(user);
  }

  async findByEmail(email: string): Promise<ReadUserEntity | null> {
    this.logger.log(`Finding user by email: ${email}`);
    const user = await this.repository.findByEmail(email);
    if (!user) {
      this.logger.error(`Failed to find user by email: ${email}`);
      throw new UserNotFoundException(
        `Пользователь с email ${email} не найден`,
      );
    }
    return UserMapper.toReadUserEntity(user);
  }

  async findByPhone(phone: string): Promise<ReadUserEntity | null> {
    this.logger.log(`Finding user by phone: ${phone}`);
    const user = await this.repository.findByPhone(phone);
    if (!user) {
      this.logger.error(`User with phone ${phone} not found`);
      throw new UserNotFoundException(
        `Пользователь с phone ${phone} не найден`,
      );
    }
    return UserMapper.toReadUserEntity(user);
  }

  async create(user: CreateUserEntity): Promise<ReadUserEntity> {
    try {
      this.logger.log(`Creating user: ${user.name}`);
      const userEntity = UserMapper.toUserEntity(user);
      userEntity.passwordHash = await bcrypt.hash(user.password, 10);
      UserEntity.validate(userEntity);
      const createdUser = await this.repository.create(userEntity);
      return UserMapper.toReadUserEntity(createdUser);
    } catch (error) {
      this.logger.error(`Failed to create user: ${user.name}`, error);
      throw DbErrors.mapError(error);
    }
  }

  async update(id: string, user: UpdateUserEntity): Promise<ReadUserEntity> {
    try {
      this.logger.log(`Updating user: ${user.name}`);
      const existingUser = await this.repository.findById(id);
      if (!existingUser) {
        this.logger.error(`User with id ${id} not found`);
        throw new UserNotFoundException(`Пользователь с id ${id} не найден`);
      }
      const userEntity = UserMapper.toUserEntityFromUpdate(user, existingUser);
      const updatedUser = await this.repository.update(id, userEntity);
      return UserMapper.toReadUserEntity(updatedUser);
    } catch (error) {
      this.logger.error(`Failed to update user: ${user.name}`, error);
      throw DbErrors.mapError(error);
    }
  }

  async delete(id: string): Promise<ReadUserEntity> {
    try {
      this.logger.log(`Deleting user: ${id}`);
      const existingUser = await this.repository.findById(id);
      if (!existingUser) {
        this.logger.error(`User with id ${id} not found`);
        throw new UserNotFoundException(`Пользователь с id ${id} не найден`);
      }
      const deletedUser = await this.repository.delete(id);
      return UserMapper.toReadUserEntity(deletedUser);
    } catch (error) {
      this.logger.error(`Failed to delete user: ${id}`, error);
      throw DbErrors.mapError(error);
    }
  }

  async restore(id: string): Promise<ReadUserEntity> {
    try {
      this.logger.log(`Restoring user: ${id}`);
      const existingUser = await this.repository.findById(id);
      if (!existingUser) {
        this.logger.error(`User with id ${id} not found`);
        throw new UserNotFoundException(`Пользователь с id ${id} не найден`);
      }
      const restoredUser = await this.repository.restore(id);
      return UserMapper.toReadUserEntity(restoredUser);
    } catch (error) {
      this.logger.error(`Failed to restore user: ${id}`, error);
      throw DbErrors.mapError(error);
    }
  }
}
