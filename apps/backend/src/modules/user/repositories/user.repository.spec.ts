import { randomUUID } from 'node:crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from '../../../shared/testing';
import { UserEntity } from '../entities/user.entity';
import { UserRole } from '../entities/user.role';
import { UserRepository } from './user.repository';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { UpdateUserEntity } from '../entities/dtos/user.update';

/**
 * Интеграция с БД: `vitest.setup.ts` уже подгрузил `.env` + `.env.test` (приоритет у `.env.test`).
 * Здесь {@link loadBackendDevEnv} — только если нужен именно девовский `DATABASE_URL` из `.env`.
 */
describe('UserRepository (integration)', () => {
  let prisma: PrismaService;
  let repository: UserRepository;

  beforeAll(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await truncateApplicationTable(prisma, 'user');
    repository = new UserRepository(prisma);
  });

  afterAll(async () => {
    await truncateApplicationTable(prisma, 'user');
    await prisma.$disconnect();
  });

  it('Создание пользователя', async () => {
    // arrange
    const user = new UserEntity(
      randomUUID(),
      'Integration user',
      'integration.user@example.com',
      '+1234567890',
      'password-hash',
      UserRole.DRIVER,
    );

    // act
    const created = await repository.create(user);

    // assert
    expect(created).toBeDefined();
    expect(created.id).toBe(user.id);
    expect(created.name).toBe(user.name);
    expect(created.email).toBe(user.email);
    expect(created.phone).toBe(user.phone);
    expect(created.passwordHash).toBe(user.passwordHash);
    expect(created.role).toBe(user.role);
    expect(created.isActive).toBe(false);
    expect(created.isDeleted).toBe(false);
  });

  it('Поиск всех пользователей', async () => {
    // arrange
    const user = new UserEntity(
      randomUUID(),
      'Integration user',
      'integration.user@example.com',
      '+1234567890',
      'password-hash',
      UserRole.DRIVER,
    );
    const user2 = new UserEntity(
      randomUUID(),
      'Integration user 2',
      'integration.user2@example.com',
      '+1234567891',
      'password-hash',
      UserRole.MANAGER,
    );

    // act
    await repository.create(user);
    await repository.create(user2);

    const found = await repository.findAll();

    // assert
    expect(found).toBeDefined();
    expect(found).not.toBeNull();
    expect(found!.length).toBe(2);
    expect(found![0].id).toBe(user.id);
    expect(found![0].name).toBe(user.name);
    expect(found![0].email).toBe(user.email);
    expect(found![0].phone).toBe(user.phone);
    expect(found![0].passwordHash).toBe(user.passwordHash);
    expect(found![0].role).toBe(user.role);
    expect(found![0].isActive).toBe(false);
    expect(found![0].isDeleted).toBe(false);
    expect(found![1].id).toBe(user2.id);
    expect(found![1].name).toBe(user2.name);
    expect(found![1].email).toBe(user2.email);
    expect(found![1].phone).toBe(user2.phone);
    expect(found![1].passwordHash).toBe(user2.passwordHash);
    expect(found![1].role).toBe(user2.role);
    expect(found![1].isActive).toBe(false);
    expect(found![1].isDeleted).toBe(false);
  });

  it('Поиск пользователя по email', async () => {
    // arrange
    const user = new UserEntity(
      randomUUID(),
      'Integration user',
      'integration.user@example.com',
      '+1234567890',
      'password-hash',
      UserRole.DRIVER,
    );

    // act
    await repository.create(user);

    const found = await repository.findByEmail(user.email);

    // assert
    expect(found).toBeDefined();
    expect(found).not.toBeNull();
    expect(found!.id).toBe(user.id);
    expect(found!.name).toBe(user.name);
    expect(found!.email).toBe(user.email);
    expect(found!.phone).toBe(user.phone);
    expect(found!.passwordHash).toBe(user.passwordHash);
    expect(found!.role).toBe(user.role);
    expect(found!.isActive).toBe(false);
    expect(found!.isDeleted).toBe(false);
  });

  it('Поиск пользователя по phone', async () => {
    // arrange
    const user = new UserEntity(
      randomUUID(),
      'Integration user',
      'integration.user@example.com',
      '+1234567890',
      'password-hash',
      UserRole.DRIVER,
    );

    // act
    await repository.create(user);

    const found = await repository.findByPhone(user.phone);

    // assert
    expect(found).toBeDefined();
    expect(found).not.toBeNull();
    expect(found!.id).toBe(user.id);
    expect(found!.name).toBe(user.name);
    expect(found!.email).toBe(user.email);
    expect(found!.phone).toBe(user.phone);
    expect(found!.passwordHash).toBe(user.passwordHash);
    expect(found!.role).toBe(user.role);
    expect(found!.isActive).toBe(false);
    expect(found!.isDeleted).toBe(false);
  });

  it('Обновление пользователя', async () => {
    // arrange
    const user = new UserEntity(
      randomUUID(),
      'Integration user',
      'integration.user@example.com',
      '+1234567890',
      'password-hash',
      UserRole.DRIVER,
    );

    // act
    await repository.create(user);
    user.name = 'Updated user';
    user.email = 'updated.user@example.com';
    const updated = await repository.update(user.id, user);

    // assert
    expect(updated).toBeDefined();
    expect(updated.id).toBe(user.id);
    expect(updated.name).toBe(user.name);
    expect(updated.email).toBe(user.email);
    expect(updated.phone).toBe(user.phone);
    expect(updated.passwordHash).toBe(user.passwordHash);
    expect(updated.role).toBe(user.role);
    expect(updated.isActive).toBe(false);
    expect(updated.isDeleted).toBe(false);
  });

  it('Удаление пользователя', async () => {
    // arrange
    const user = new UserEntity(
      randomUUID(),
      'Integration user',
      'integration.user@example.com',
      '+1234567890',
      'password-hash',
      UserRole.DRIVER,
    );

    // act
    await repository.create(user);
    const deleted = await repository.delete(user.id);

    // assert
    expect(deleted).toBeDefined();
    expect(deleted.id).toBe(user.id);
    expect(deleted.name).toBe(user.name);
    expect(deleted.email).toBe(user.email);
    expect(deleted.phone).toBe(user.phone);
    expect(deleted.passwordHash).toBe(user.passwordHash);
    expect(deleted.role).toBe(user.role);
    expect(deleted.isActive).toBe(false);
    expect(deleted.isDeleted).toBe(true);
  });

  it('Поиск всех пользователей с включенным статусом удаления', async () => {
    // arrange
    const user = new UserEntity(
      randomUUID(),
      'Integration user',
      'integration.user@example.com',
      '+1234567890',
      'password-hash',
      UserRole.DRIVER,
      false,
      true,
    );

    const user2 = new UserEntity(
      randomUUID(),
      'Integration user 2',
      'integration.user2@example.com',
      '+1234567891',
      'password-hash',
      UserRole.MANAGER,
    );

    // act
    await repository.create(user);
    await repository.create(user2);

    const found = await repository.findAll(true);

    // assert
    expect(found).toBeDefined();

    expect(found).not.toBeNull();
    expect(found!.length).toBe(2);
    expect(found![0].id).toBe(user.id);
    expect(found![0].name).toBe(user.name);
    expect(found![0].email).toBe(user.email);
    expect(found![0].phone).toBe(user.phone);
    expect(found![0].passwordHash).toBe(user.passwordHash);
    expect(found![0].role).toBe(user.role);
    expect(found![0].isActive).toBe(false);
    expect(found![0].isDeleted).toBe(true);
    expect(found![1].id).toBe(user2.id);
    expect(found![1].name).toBe(user2.name);
    expect(found![1].email).toBe(user2.email);
    expect(found![1].phone).toBe(user2.phone);
    expect(found![1].passwordHash).toBe(user2.passwordHash);
    expect(found![1].role).toBe(user2.role);
    expect(found![1].isActive).toBe(false);
    expect(found![1].isDeleted).toBe(false);
  });

  describe('Проверка ограничений уникальности', () => {
    it('Проверка уникальности email', async () => {
      // arrange
      const user = new UserEntity(
        randomUUID(),
        'Integration user',
        'integration.user@example.com',
        '+1234567890',
        'password-hash',
        UserRole.DRIVER,
      );

      // act
      await repository.create(user);

      const user2 = new UserEntity(
        randomUUID(),
        'Integration user',
        'integration.user@example.com',
        '+1234567890',
        'password-hash',
        UserRole.DRIVER,
      );

      let error: Error | null = null;
      try {
        await repository.create(user2);
      } catch (e) {
        error = e as Error;
      }

      // assert
      expect(error).toBeDefined();
      expect(error).not.toBeNull();
    });

    it('Проверка уникальности phone', async () => {
      // arrange
      const user = new UserEntity(
        randomUUID(),
        'Integration user',
        'integration.user@example.com',
        '+1234567890',
        'password-hash',
        UserRole.DRIVER,
      );

      // act
      await repository.create(user);

      const user2 = new UserEntity(
        randomUUID(),
        'Integration user',
        'integration.user@example.com',
        '+1234567890',
        'password-hash',
        UserRole.DRIVER,
      );

      let error: Error | null = null;
      try {
        await repository.create(user2);
      } catch (e) {
        error = e as Error;
      }

      // assert
      expect(error).toBeDefined();
      expect(error).not.toBeNull();
    });
  });
});
