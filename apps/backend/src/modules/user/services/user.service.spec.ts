import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { UserService } from './user.service';
import { UserEntity } from '../entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../entities/user.role';
import { CreateUserEntity } from '../entities/dtos/user.create';
import * as bcrypt from 'bcryptjs';
import { ReadUserEntity } from '../entities/dtos/user.read';
import { UserRepository } from '../repositories/user.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { Prisma } from '@prisma/client';
import {
  DatabaseUserErrorException,
  EmailAlreadyExistsException,
  PhoneAlreadyExistsException,
  UserAlreadyExistsException,
  UserNotFoundException,
} from '../common/errors';
import { IUserRepository } from '../repositories/user.repository.interface';

vi.mock('bcryptjs');

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;
  let repo: UserRepository;

  beforeAll(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await truncateApplicationTable(prisma, 'user');
    repo = new UserRepository(prisma);
    service = new UserService(repo);
    vi.clearAllMocks();
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
  });

  afterAll(async () => {
    await truncateApplicationTable(prisma, 'user');
    await prisma.$disconnect();
  });

  describe('Корректные операции', () => {
    describe('Создание пользователя', () => {
      it('Хэшируется пароль', async () => {
        const password = 'password123';
        const passwordHash = 'hashed-password';
        const createUser = createCreateUserEntity({
          password: password,
        });

        vi.mocked(bcrypt.hash).mockResolvedValue(passwordHash as never);

        await service.create(createUser);

        expect(vi.mocked(bcrypt.hash)).toHaveBeenCalledWith(password, 10);
      });

      it('Создает пользователя', async () => {
        const user = createCreateUserEntity({
          name: 'test user',
          email: 'test@example.com',
          phone: '+79999999999',
          role: UserRole.DRIVER,
          password: 'password123',
        });

        const result = await service.create(user);

        expect(result).toBeDefined();
        expect(result).not.toBeNull();
        compareCreateAndReadEntities(user, result);
      });
    });
    describe('Обновление пользователя', () => {
      it('Обновляет email пользователя', async () => {
        const user = createCreateUserEntity({
          name: 'test user',
          email: 'test@example.com',
          phone: '+79999999999',
          role: UserRole.DRIVER,
          password: 'password123',
        });

        const newEmail = 'updated@example.com';

        const addedUser = await service.create(user);

        const result = await service.update(addedUser.id, {
          email: newEmail,
        });

        expect(result).toBeDefined();
        expect(result).not.toBeNull();
        expect(result.email).toBe(newEmail);
      });

      it('Обновляет phone пользователя', async () => {
        const user = createCreateUserEntity({
          name: 'test user',
          email: 'test@example.com',
          phone: '+79999999999',
          role: UserRole.DRIVER,
          password: 'password123',
        });

        const newPhone = '+79999999998';

        const addedUser = await service.create(user);

        const result = await service.update(addedUser.id, {
          phone: newPhone,
        });

        expect(result).toBeDefined();
        expect(result).not.toBeNull();
        expect(result.id).toBe(addedUser.id);
        expect(result.phone).toBe(newPhone);
      });

      it('Обновляет роль пользователя', async () => {
        const user = createCreateUserEntity({
          name: 'test user',
          email: 'test@example.com',
          phone: '+79999999999',
          role: UserRole.DRIVER,
          password: 'password123',
        });

        const newRole = UserRole.MANAGER;

        const addedUser = await service.create(user);

        const result = await service.update(addedUser.id, {
          role: newRole,
        });

        expect(result).toBeDefined();
        expect(result).not.toBeNull();
        expect(result.id).toBe(addedUser.id);
        expect(result.role).toBe(newRole);
      });

      it('Обновляет статус активности пользователя', async () => {
        const user = createCreateUserEntity({
          name: 'test user',
          email: 'test@example.com',
          phone: '+79999999999',
          role: UserRole.DRIVER,
          password: 'password123',
        });

        const newIsActive = true;

        const addedUser = await service.create(user);

        const result = await service.update(addedUser.id, {
          isActive: newIsActive,
        });

        expect(result).toBeDefined();
        expect(result).not.toBeNull();
        expect(result.id).toBe(addedUser.id);
        expect(result.isActive).toBe(newIsActive);
      });

      it('Обновляет имя пользователя', async () => {
        const user = createCreateUserEntity({
          name: 'test user',
          email: 'test@example.com',
          phone: '+79999999999',
          role: UserRole.DRIVER,
          password: 'password123',
        });

        const newName = 'updated user';

        const addedUser = await service.create(user);

        const result = await service.update(addedUser.id, {
          name: newName,
        });

        expect(result).toBeDefined();
        expect(result).not.toBeNull();
        expect(result.id).toBe(addedUser.id);
        expect(result.name).toBe(newName);
      });
    });

    describe('Удаление пользователя', () => {
      it('Удаляет пользователя', async () => {
        const user = createCreateUserEntity({
          name: 'test user',
          email: 'test@example.com',
          phone: '+79999999999',
          role: UserRole.DRIVER,
          password: 'password123',
        });

        const addedUser = await service.create(user);

        const result = await service.delete(addedUser.id);

        expect(result).toBeDefined();
        expect(result).not.toBeNull();
        expect(result.id).toBe(addedUser.id);
        expect(result.isDeleted).toBe(true);
      });
    });
  });

  describe('Некорректные операции', () => {
    describe('Создание пользователя', () => {
      it('Не создает пользователя с существующим email', async () => {
        const email = 'test@example.com';
        await service.create(createCreateUserEntity({ email }));

        const user = createCreateUserEntity({
          email,
        });

        await expect(service.create(user)).rejects.toThrow(
          EmailAlreadyExistsException,
        );
      });

      it('Не создает пользователя с существующим телефоном', async () => {
        const phone = '+79999999999';
        await service.create(
          createCreateUserEntity({
            email: 'first@example.com',
            phone,
          }),
        );

        const user = createCreateUserEntity({
          email: 'second@example.com',
          phone,
        });

        await expect(service.create(user)).rejects.toThrow(
          PhoneAlreadyExistsException,
        );
      });
    });

    describe('Обновление пользователя', () => {
      it('Не меняет email на уже занятый', async () => {
        const emailA = 'owner@example.com';
        const emailB = 'other@example.com';
        await service.create(
          createCreateUserEntity({
            name: 'owner user',
            email: emailA,
            phone: '+71111111111',
          }),
        );
        const second = await service.create(
          createCreateUserEntity({
            name: 'second user',
            email: emailB,
            phone: '+72222222222',
          }),
        );

        await expect(
          service.update(second.id, { email: emailA }),
        ).rejects.toThrow(EmailAlreadyExistsException);
      });

      it('Не меняет телефон на уже занятый', async () => {
        const phoneA = '+73333333333';
        await service.create(
          createCreateUserEntity({
            name: 'owner user',
            email: 'owner2@example.com',
            phone: phoneA,
          }),
        );
        const second = await service.create(
          createCreateUserEntity({
            name: 'second user',
            email: 'second2@example.com',
            phone: '+74444444444',
          }),
        );

        await expect(
          service.update(second.id, { phone: phoneA }),
        ).rejects.toThrow(PhoneAlreadyExistsException);
      });

      it('Не обновляет несуществующего пользователя', async () => {
        const missingId = uuidv4();

        await expect(
          service.update(missingId, { name: 'nobody' }),
        ).rejects.toThrow(UserNotFoundException);
      });
    });

    describe('Удаление пользователя', () => {
      it('Не удаляет несуществующего пользователя', async () => {
        await expect(service.delete(uuidv4())).rejects.toThrow(
          UserNotFoundException,
        );
      });
    });

    describe('Восстановление пользователя', () => {
      it('Не восстанавливает несуществующего пользователя', async () => {
        await expect(service.restore(uuidv4())).rejects.toThrow(
          UserNotFoundException,
        );
      });
    });

    describe('Поиск пользователя', () => {
      it('findById: нет пользователя', async () => {
        await expect(service.findById(uuidv4())).rejects.toThrow(
          UserNotFoundException,
        );
      });

      it('findByEmail: нет пользователя', async () => {
        await expect(service.findByEmail('missing@example.com')).rejects.toThrow(
          UserNotFoundException,
        );
      });

      it('findByPhone: нет пользователя', async () => {
        await expect(service.findByPhone('+75555555555')).rejects.toThrow(
          UserNotFoundException,
        );
      });
    });
  });

  describe('Маппинг ошибок Prisma (мок IUserRepository)', () => {
    let mockRepo: IUserRepository;

    const prismaKnown = (
      code: string,
      message: string,
      meta: Record<string, unknown> = {},
    ) =>
      new Prisma.PrismaClientKnownRequestError(message, {
        code,
        clientVersion: '7.6.0',
        meta,
      });

    beforeEach(() => {
      mockRepo = {
        findAll: vi.fn(),
        findById: vi.fn(),
        findByEmail: vi.fn(),
        findByPhone: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        restore: vi.fn(),
      };
      service = new UserService(mockRepo);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    });

    it('create: P2002 по email → EmailAlreadyExistsException', async () => {
      vi.mocked(mockRepo.create).mockRejectedValue(
        prismaKnown(
          'P2002',
          'Unique constraint failed on the fields: (`email`)',
        ),
      );

      await expect(service.create(createCreateUserEntity())).rejects.toThrow(
        EmailAlreadyExistsException,
      );
    });

    it('create: P2002 по телефону → PhoneAlreadyExistsException', async () => {
      vi.mocked(mockRepo.create).mockRejectedValue(
        prismaKnown(
          'P2002',
          'Unique constraint failed on the fields: (`phone`)',
        ),
      );

      await expect(service.create(createCreateUserEntity())).rejects.toThrow(
        PhoneAlreadyExistsException,
      );
    });

    it('create: P2002 по id → UserAlreadyExistsException', async () => {
      vi.mocked(mockRepo.create).mockRejectedValue(
        prismaKnown(
          'P2002',
          'Unique constraint failed on the fields: (`id`)',
        ),
      );

      await expect(service.create(createCreateUserEntity())).rejects.toThrow(
        UserAlreadyExistsException,
      );
    });

    it('create: P2002 без распознаваемого поля → DatabaseUserErrorException', async () => {
      vi.mocked(mockRepo.create).mockRejectedValue(
        prismaKnown('P2002', 'Unique constraint failed on the fields: (`unknown`)'),
      );

      await expect(service.create(createCreateUserEntity())).rejects.toThrow(
        DatabaseUserErrorException,
      );
    });

    it('update: P2025 → UserNotFoundException', async () => {
      const existing = new UserEntity(
        uuidv4(),
        'Existing User',
        'existing@example.com',
        '+76666666666',
        'hash',
        UserRole.DRIVER,
        false,
        false,
      );
      vi.mocked(mockRepo.findById).mockResolvedValue(existing);
      vi.mocked(mockRepo.update).mockRejectedValue(
        prismaKnown('P2025', 'Record to update not found.'),
      );

      await expect(
        service.update(existing.id, { name: 'new name' }),
      ).rejects.toThrow(UserNotFoundException);
    });

    it('findAll: неизвестный код Prisma → DatabaseUserErrorException', async () => {
      vi.mocked(mockRepo.findAll).mockRejectedValue(
        prismaKnown('P2011', 'Null constraint violation'),
      );

      await expect(service.findAll(false)).rejects.toThrow(
        DatabaseUserErrorException,
      );
      await expect(service.findAll(false)).rejects.toThrow(
        'Ошибка базы данных пользователя',
      );
    });

    it('delete: неизвестный код Prisma → DatabaseUserErrorException', async () => {
      const existing = new UserEntity(
        uuidv4(),
        'To delete',
        'todelete@example.com',
        '+77777777777',
        'hash',
        UserRole.DRIVER,
        false,
        false,
      );
      vi.mocked(mockRepo.findById).mockResolvedValue(existing);
      vi.mocked(mockRepo.delete).mockRejectedValue(
        prismaKnown('P2000', 'Input error'),
      );

      await expect(service.delete(existing.id)).rejects.toThrow(
        DatabaseUserErrorException,
      );
    });
  });

  const createReadUserEntity = (
    user: Partial<UserEntity> = {},
  ): ReadUserEntity => {
    return {
      id: user.id ?? uuidv4(),
      name: user.name ?? 'name 1',
      email: user.email ?? 'email@example.com',
      phone: user.phone ?? '+1234567890',
      role: user.role ?? UserRole.DRIVER,
      isActive: user.isActive ?? false,
      isDeleted: user.isDeleted ?? false,
    };
  };

  const createUserEntity = (
    user: Partial<CreateUserEntity> = {},
  ): UserEntity => {
    return new UserEntity(
      uuidv4(),
      user.name ?? 'name 1',
      user.email ?? 'email@example.com',
      user.phone ?? '+1234567890',
      user.password ?? 'password',
      user.role ?? UserRole.DRIVER,
      false,
      false,
    );
  };

  const createCreateUserEntity = (
    user: Partial<CreateUserEntity> = {},
  ): CreateUserEntity => {
    return {
      name: user.name ?? 'name 1',
      email: user.email ?? 'email@example.com',
      phone: user.phone ?? '+1234567890',
      password: user.password ?? 'password',
      role: user.role ?? UserRole.DRIVER,
    };
  };

  const compareCreateAndReadEntities = (
    user1: CreateUserEntity,
    user2: ReadUserEntity,
  ) => {
    expect(user1.name).toBe(user2.name);
    expect(user1.email).toBe(user2.email);
    expect(user1.phone).toBe(user2.phone);
    expect(user1.role).toBe(user2.role);
  };

  const compareUserEntities = (user1: UserEntity, user2: UserEntity) => {
    expect(user1.id).toBe(user2.id);
    expect(user1.name).toBe(user2.name);
    expect(user1.email).toBe(user2.email);
    expect(user1.phone).toBe(user2.phone);
    expect(user1.passwordHash).toBe(user2.passwordHash);
    expect(user1.role).toBe(user2.role);
    expect(user1.isActive).toBe(user2.isActive);
    expect(user1.isDeleted).toBe(user2.isDeleted);
  };

  const compareUserAndReadEntities = (
    user1: UserEntity,
    user2: ReadUserEntity,
  ) => {
    expect(user1.id).toBe(user2.id);
    expect(user1.name).toBe(user2.name);
    expect(user1.email).toBe(user2.email);
    expect(user1.phone).toBe(user2.phone);
    expect(user1.role).toBe(user2.role);
    expect(user1.isActive).toBe(user2.isActive);
    expect(user1.isDeleted).toBe(user2.isDeleted);
  };
});
