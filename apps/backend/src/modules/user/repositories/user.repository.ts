import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IUserRepository } from './user.repository.interface';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}
  findAll(includeDeleted: boolean): Promise<UserEntity[]> {
    return this.prisma.user.findMany({
      where: includeDeleted ? {} : { isDeleted: false },
    });
  }
  findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
  findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findFirst({ where: { email } });
  }
  findByPhone(phone: string): Promise<UserEntity | null> {
    return this.prisma.user.findFirst({ where: { phone } });
  }
  create(data: UserEntity): Promise<UserEntity> {
    return this.prisma.user.create({ data: { ...data } });
  }
  update(id: string, data: UserEntity): Promise<UserEntity> {
    return this.prisma.user.update({ where: { id }, data: { ...data } });
  }
  delete(id: string): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
  restore(id: string): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id },
      data: { isDeleted: false },
    });
  }
}
