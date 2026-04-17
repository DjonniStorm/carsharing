import { UnauthorizedException } from '@nestjs/common';
import { RegisterDeviceType, VerificationChannel } from '../auth.dto';
import { UserRepository } from '../repositories/user.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let repository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByPhone: jest.fn(),
      findByEmail: jest.fn(),
      findByIdentifier: jest.fn(),
      getOrCreateRoleId: jest.fn(),
      create: jest.fn(),
    };
    service = new AuthService(repository);
  });

  describe('register', () => {
    it('registers manager from web and issues tokens', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.getOrCreateRoleId.mockResolvedValue(2);
      repository.create.mockResolvedValue({
        id: 10,
        name: 'Manager',
        phone: '',
        email: 'manager@example.com',
        passwordHash: 'stored',
        roleId: 2,
        isActive: true,
        isDeleted: false,
      });

      const result = await service.register({
        name: 'Manager',
        email: 'manager@example.com',
        password: 'strong-password',
        deviceType: RegisterDeviceType.WEB,
      });

      expect(repository.getOrCreateRoleId).toHaveBeenCalledWith('MANAGER');
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Manager',
          email: 'manager@example.com',
          roleId: 2,
        }),
      );
      expect(result.accessToken).toContain('.');
      expect(result.refreshToken).toContain('.');
    });

    it('requires phone for mobile registration', async () => {
      await expect(
        service.register({
          name: 'Driver',
          password: 'strong-password',
          deviceType: RegisterDeviceType.MOBILE,
        }),
      ).rejects.toThrow('Для регистрации водителя нужен телефон');
    });
  });

  describe('login', () => {
    it('logs in by email', async () => {
      const passwordHash = await (service as never).hashPassword(
        'strong-password',
      );
      repository.findByIdentifier.mockResolvedValue({
        id: 11,
        name: 'Manager',
        phone: '',
        email: 'manager@example.com',
        passwordHash,
        roleId: 2,
        isActive: true,
        isDeleted: false,
      });

      const result = await service.login({
        identifier: 'manager@example.com',
        password: 'strong-password',
      });

      expect(repository.findByIdentifier).toHaveBeenCalledWith(
        'manager@example.com',
      );
      expect(result.accessToken).toContain('.');
      expect(result.refreshToken).toContain('.');
    });

    it('rejects invalid password', async () => {
      const passwordHash = await (service as never).hashPassword(
        'valid-password',
      );
      repository.findByIdentifier.mockResolvedValue({
        id: 1,
        name: 'Driver',
        phone: '+79990001122',
        email: null,
        passwordHash,
        roleId: 1,
        isActive: true,
        isDeleted: false,
      });

      await expect(
        service.login({
          identifier: '+79990001122',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh/logout', () => {
    it('refreshes and revokes old refresh token', async () => {
      repository.findByPhone.mockResolvedValue(null);
      repository.getOrCreateRoleId.mockResolvedValue(1);
      repository.create.mockResolvedValue({
        id: 5,
        name: 'Driver',
        phone: '+79990001122',
        email: null,
        passwordHash: 'stored',
        roleId: 1,
        isActive: true,
        isDeleted: false,
      });

      const tokens = await service.register({
        name: 'Driver',
        phone: '+79990001122',
        password: 'strong-password',
        deviceType: RegisterDeviceType.MOBILE,
      });

      const refreshed = await service.refreshToken({
        refreshToken: tokens.refreshToken,
      });

      expect(refreshed.accessToken).not.toBe(tokens.accessToken);

      await expect(
        service.refreshToken({ refreshToken: tokens.refreshToken }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('revokes refresh token on logout', async () => {
      repository.findByPhone.mockResolvedValue(null);
      repository.getOrCreateRoleId.mockResolvedValue(1);
      repository.create.mockResolvedValue({
        id: 7,
        name: 'Driver',
        phone: '+79990001122',
        email: null,
        passwordHash: 'stored',
        roleId: 1,
        isActive: true,
        isDeleted: false,
      });

      const tokens = await service.register({
        name: 'Driver',
        phone: '+79990001122',
        password: 'strong-password',
        deviceType: RegisterDeviceType.MOBILE,
      });

      await service.logout({ refreshToken: tokens.refreshToken });

      await expect(
        service.refreshToken({ refreshToken: tokens.refreshToken }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('verification stubs', () => {
    it('resends code by email', async () => {
      const result = await service.resendVerificationCode({
        identifier: 'manager@example.com',
        channel: VerificationChannel.EMAIL,
      });

      expect(result).toEqual({
        sent: true,
        channel: VerificationChannel.EMAIL,
      });
    });
  });
});
