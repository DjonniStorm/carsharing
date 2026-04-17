import { Injectable } from '@nestjs/common';
import {
  CreateUserInput,
  UserEntity,
} from '../../../../shared/types/repository.types';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UserRepository } from '../user.repository';

@Injectable()
export class UserPrismaRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toUserEntity(user) : null;
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({ where: { phone } });
    return user ? this.toUserEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({ where: { email } });
    return user ? this.toUserEntity(user) : null;
  }

  async findByIdentifier(identifier: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: identifier }, { email: identifier }],
      },
    });
    return user ? this.toUserEntity(user) : null;
  }

  async getOrCreateRoleId(roleName: string): Promise<number> {
    const existing = await this.prisma.role.findFirst({
      where: { name: roleName },
    });
    if (existing) {
      return existing.id;
    }

    const created = await this.prisma.role.create({
      data: { name: roleName },
    });
    return created.id;
  }

  async create(data: CreateUserInput): Promise<UserEntity> {
    const created = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        roleId: data.roleId,
        isActive: data.isActive,
        isDeleted: data.isDeleted,
      },
    });
    return this.toUserEntity(created);
  }

  private toUserEntity(user: {
    id: number;
    name: string;
    email: string | null;
    phone: string;
    passwordHash: string;
    roleId: number;
    isActive: boolean;
    isDeleted: boolean;
  }): UserEntity {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      passwordHash: user.passwordHash,
      roleId: user.roleId,
      isActive: user.isActive,
      isDeleted: user.isDeleted,
    };
  }
}
