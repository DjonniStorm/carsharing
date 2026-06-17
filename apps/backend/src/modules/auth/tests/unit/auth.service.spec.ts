import { BadRequestException, HttpException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcryptjs';

import { NotificationService } from 'src/shared/notification/notification.service';
import type { IUserRepository } from 'src/modules/user/repositories/user.repository.interface';
import { UserService } from 'src/modules/user/services/user.service';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { UserRole } from 'src/modules/user/entities/user.role';
import { AuthService } from '../../auth.service';
import {
  getPendingVerification,
  resetAccountVerificationStoreForTests,
} from '../../account-verification.store';
import { VerificationChannel } from '../../verification-channel.enum';

vi.mock('src/shared/notification/notification.config', () => ({
  getNotificationConfig: vi.fn(),
}));

vi.mock('../../auth-skip-verification.config', () => ({
  isAuthSkipVerification: vi.fn(() => false),
}));

vi.mock('../../open-manager-register.config', () => ({
  isOpenManagerSelfRegisterEnabled: vi.fn(() => false),
}));

vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

import { getNotificationConfig } from 'src/shared/notification/notification.config';
import { isAuthSkipVerification } from '../../auth-skip-verification.config';

const userId = '550e8400-e29b-41d4-a716-446655440000';

function inactiveUser(): UserEntity {
  return new UserEntity(
    userId,
    'Test User',
    'user@example.com',
    '+79991234567',
    'hash',
    UserRole.DRIVER,
    false,
    false,
  );
}

function activeUser(): UserEntity {
  return new UserEntity(
    userId,
    'Test User',
    'user@example.com',
    '+79991234567',
    'hash',
    UserRole.DRIVER,
    true,
    false,
  );
}

describe('AuthService verification', () => {
  let service: AuthService;
  let users: IUserRepository;
  let userService: UserService;
  let jwtService: JwtService;
  let notifications: NotificationService;

  beforeEach(() => {
    resetAccountVerificationStoreForTests();
    vi.mocked(isAuthSkipVerification).mockReturnValue(false);

    users = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByPhone: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      restore: vi.fn(),
      setIsActive: vi.fn(),
    };

    userService = {
      registerPublic: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
    } as unknown as UserService;

    jwtService = {
      signAsync: vi.fn().mockResolvedValue('jwt-token'),
    } as unknown as JwtService;

    notifications = {
      sendVerificationCode: vi.fn().mockResolvedValue(undefined),
      sendFirebasePhoneVerification: vi.fn().mockResolvedValue({ sessionInfo: 'sess-1' }),
      getFirebaseRecaptchaParams: vi.fn().mockResolvedValue({
        recaptchaSiteKey: 'site-key',
      }),
      verifyFirebasePhoneCode: vi.fn().mockResolvedValue({
        idToken: 'firebase-jwt',
        phoneNumber: '+79991234567',
      }),
      sendEmail: vi.fn(),
      sendViolationNotice: vi.fn(),
    } as unknown as NotificationService;

    vi.mocked(getNotificationConfig).mockReturnValue({
      email: {
        host: 'smtp.test',
        port: 587,
        secure: false,
        auth: { user: 'u', pass: 'p' },
        from: 'test@test',
      },
      firebasePhone: {
        apiKey: 'key',
      },
    });

    service = new AuthService(users, userService, jwtService, notifications);
  });

  describe('register', () => {
    it('возвращает requiresVerification без отправки кода', async () => {
      vi.mocked(userService.registerPublic).mockResolvedValue({
        id: userId,
        name: 'Test',
        email: 'user@example.com',
        phone: '+79991234567',
        role: UserRole.DRIVER,
        isActive: false,
        isDeleted: false,
      });

      const result = await service.register({
        name: 'Test',
        email: 'user@example.com',
        phone: '+79991234567',
        password: 'secret123',
      });

      expect(result.requiresVerification).toBe(true);
      expect(result.email).toBe('user@example.com');
      expect(result.phone).toBe('+79991234567');
      expect(notifications.sendVerificationCode).not.toHaveBeenCalled();
      expect(notifications.sendFirebasePhoneVerification).not.toHaveBeenCalled();
    });
  });

  describe('sendVerificationCode', () => {
    beforeEach(() => {
      vi.mocked(users.findByEmail).mockResolvedValue(inactiveUser());
    });

    it('email: сохраняет pending и шлёт письмо', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('code-hash' as never);

      const result = await service.sendVerificationCode({
        email: 'user@example.com',
        channel: VerificationChannel.Email,
      });

      expect(result.channel).toBe(VerificationChannel.Email);
      expect(notifications.sendVerificationCode).toHaveBeenCalled();
      const pending = getPendingVerification('user@example.com');
      expect(pending?.channel).toBe(VerificationChannel.Email);
    });

    it('sms: сохраняет sessionInfo', async () => {
      const result = await service.sendVerificationCode({
        email: 'user@example.com',
        channel: VerificationChannel.Sms,
        recaptchaToken: 'recaptcha-token',
      });

      expect(result.channel).toBe(VerificationChannel.Sms);
      expect(notifications.sendFirebasePhoneVerification).toHaveBeenCalledWith(
        '+79991234567',
        'recaptcha-token',
      );
      const pending = getPendingVerification('user@example.com');
      expect(pending?.channel).toBe(VerificationChannel.Sms);
    });

    it('sms: без recaptchaToken → 400', async () => {
      await expect(
        service.sendVerificationCode({
          email: 'user@example.com',
          channel: VerificationChannel.Sms,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rate-limit: второй вызов подряд отклоняется', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('code-hash' as never);

      await service.sendVerificationCode({
        email: 'user@example.com',
        channel: VerificationChannel.Email,
      });

      await expect(
        service.sendVerificationCode({
          email: 'user@example.com',
          channel: VerificationChannel.Email,
        }),
      ).rejects.toBeInstanceOf(HttpException);
    });
  });

  describe('verifyAccount', () => {
    it('email: активирует пользователя и выдаёт JWT', async () => {
      vi.mocked(users.findByEmail).mockResolvedValue(inactiveUser());
      vi.mocked(bcrypt.hash).mockResolvedValue('code-hash' as never);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await service.sendVerificationCode({
        email: 'user@example.com',
        channel: VerificationChannel.Email,
      });

      const result = await service.verifyAccount({
        email: 'user@example.com',
        code: '123456',
      });

      expect(result.access_token).toBe('jwt-token');
      expect(users.setIsActive).toHaveBeenCalledWith(userId, true);
    });

    it('sms: проверяет firebase и phone match', async () => {
      vi.mocked(users.findByEmail).mockResolvedValue(inactiveUser());

      await service.sendVerificationCode({
        email: 'user@example.com',
        channel: VerificationChannel.Sms,
        recaptchaToken: 'recaptcha-token',
      });

      const result = await service.verifyAccount({
        email: 'user@example.com',
        code: '654321',
      });

      expect(result.access_token).toBe('jwt-token');
      expect(notifications.verifyFirebasePhoneCode).toHaveBeenCalled();
      expect(users.setIsActive).toHaveBeenCalledWith(userId, true);
    });

    it('sms: phone mismatch → 400', async () => {
      vi.mocked(users.findByEmail).mockResolvedValue(inactiveUser());
      vi.mocked(notifications.verifyFirebasePhoneCode).mockResolvedValue({
        idToken: 'firebase-jwt',
        phoneNumber: '+79990000000',
      });

      await service.sendVerificationCode({
        email: 'user@example.com',
        channel: VerificationChannel.Sms,
        recaptchaToken: 'recaptcha-token',
      });

      await expect(
        service.verifyAccount({
          email: 'user@example.com',
          code: '654321',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('login', () => {
    it('inactive: requiresVerification без JWT', async () => {
      vi.mocked(users.findByEmail).mockResolvedValue(inactiveUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login({
        login: 'user@example.com',
        password: 'secret',
      });

      expect(result.requiresVerification).toBe(true);
      expect(result.access_token).toBeUndefined();
      expect(result.email).toBe('user@example.com');
    });

    it('active: выдаёт JWT', async () => {
      vi.mocked(users.findByEmail).mockResolvedValue(activeUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login({
        login: 'user@example.com',
        password: 'secret',
      });

      expect(result.access_token).toBe('jwt-token');
    });

    it('неверный пароль → 401', async () => {
      vi.mocked(users.findByEmail).mockResolvedValue(activeUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.login({ login: 'user@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('verifyEmail alias', () => {
    it('делегирует в verifyAccount', async () => {
      vi.mocked(users.findByEmail).mockResolvedValue(inactiveUser());
      vi.mocked(bcrypt.hash).mockResolvedValue('code-hash' as never);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await service.sendVerificationCode({
        email: 'user@example.com',
        channel: VerificationChannel.Email,
      });

      const result = await service.verifyEmail({
        email: 'user@example.com',
        code: '123456',
      });

      expect(result.access_token).toBe('jwt-token');
    });
  });

  describe('register skip verification', () => {
    it('выдаёт JWT сразу', async () => {
      vi.mocked(isAuthSkipVerification).mockReturnValue(true);
      vi.mocked(userService.registerPublic).mockResolvedValue({
        id: userId,
        name: 'Test',
        email: 'user@example.com',
        phone: '+79991234567',
        role: UserRole.DRIVER,
        isActive: true,
        isDeleted: false,
      });

      const result = await service.register({
        name: 'Test',
        email: 'user@example.com',
        phone: '+79991234567',
        password: 'secret123',
      });

      expect(result.access_token).toBe('jwt-token');
    });
  });
});
