import { v4 as uuidv4 } from 'uuid';
import { CreateUserEntity } from '../entities/dtos/user.create';
import { ReadUserEntity } from '../entities/dtos/user.read';
import { UserEntity } from '../entities/user.entity';
import { UpdateUserEntity } from '../entities/dtos/user.update';

export class UserMapper {
  static toReadUserEntity(user: UserEntity): ReadUserEntity {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      isDeleted: user.isDeleted,
    };
  }

  static toUserEntity(user: CreateUserEntity): UserEntity {
    return new UserEntity(
      uuidv4(),
      user.name,
      user.email,
      user.phone,
      user.password,
      user.role,
      false,
      false,
    );
  }

  static toUserEntityFromUpdate(
    user: Partial<UpdateUserEntity>,
    existingUser: UserEntity,
  ): UserEntity {
    return new UserEntity(
      existingUser.id,
      user.name ?? existingUser.name,
      user.email ?? existingUser.email,
      user.phone ?? existingUser.phone,
      existingUser.passwordHash,
      user.role ?? existingUser.role,
      user.isActive ?? existingUser.isActive,
      user.isDeleted ?? existingUser.isDeleted,
    );
  }
}
