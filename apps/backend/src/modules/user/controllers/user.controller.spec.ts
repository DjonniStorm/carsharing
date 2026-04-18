import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UserController } from './user.controller';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { CreateUserEntity } from '../entities/dtos/user.create';
import { UserRole } from '../entities/user.role';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;
  let repository: UserRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
    repository = new UserRepository(prisma);
    service = new UserService(repository);
    controller = new UserController(service);
  });

  afterAll(async () => {
    await truncateApplicationTable(prisma, 'user');
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await truncateApplicationTable(prisma, 'user');
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = await controller.findAll();
      expect(users).toBeDefined();
      expect(users).not.toBeNull();
      expect(users.length).toBe(0);
    });

    it('should return all users with includeDeleted true', async () => {
      const payloads: CreateUserEntity[] = [
        {
          name: 'test user',
          email: 'test@example.com',
          phone: '+79999999999',
          password: 'password',
          role: UserRole.DRIVER,
        },
        {
          name: 'test user 2',
          email: 'test2@example.com',
          phone: '+79999999998',
          password: 'password',
          role: UserRole.MANAGER,
        },
        {
          name: 'test user 3',
          email: 'test3@example.com',
          phone: '+79999999997',
          password: 'password',
          role: UserRole.MANAGER,
        },
      ];

      const created: Awaited<ReturnType<UserService['create']>>[] = [];
      for (const user of payloads) {
        created.push(await service.create(user));
      }
      await service.delete(created[2].id);

      const foundUsers = await controller.findAll(true);
      expect(foundUsers).toBeDefined();
      expect(foundUsers).not.toBeNull();
      expect(foundUsers.length).toBe(payloads.length);
    });

    it('should return only not deleted users', async () => {
      const payloads: CreateUserEntity[] = [
        {
          name: 'test user',
          email: 'test@example.com',
          phone: '+79999999999',
          password: 'password',
          role: UserRole.DRIVER,
        },
        {
          name: 'test user 2',
          email: 'test2@example.com',
          phone: '+79999999998',
          password: 'password',
          role: UserRole.MANAGER,
        },
        {
          name: 'test user 3',
          email: 'test3@example.com',
          phone: '+79999999997',
          password: 'password',
          role: UserRole.MANAGER,
        },
      ];

      const created: Awaited<ReturnType<UserService['create']>>[] = [];
      for (const user of payloads) {
        created.push(await service.create(user));
      }
      await service.delete(created[2].id);

      const foundUsers = await controller.findAll(false);
      expect(foundUsers).toBeDefined();
      expect(foundUsers).not.toBeNull();
      expect(foundUsers.length).toBe(payloads.length - 1);
    });
  });
});
