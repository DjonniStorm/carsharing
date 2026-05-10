import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'node:crypto';
import * as bcrypt from 'bcryptjs';

import { getNotificationConfig } from 'src/shared/notification/notification.config';
import { NotificationService } from 'src/shared/notification/notification.service';
import { EMAIL_REGEX } from 'src/shared/regexp/email';
import {
  EmailAlreadyExistsException,
  PhoneAlreadyExistsException,
  UserNotFoundException,
} from 'src/modules/user/common/errors';
import { IUserRepositoryToken } from 'src/modules/user/repositories/user.repository.interface';
import type { IUserRepository } from 'src/modules/user/repositories/user.repository.interface';
import { UserService } from 'src/modules/user/services/user.service';
import { ReadUserEntity } from 'src/modules/user/entities/dtos/user.read';
import { UserRole } from 'src/modules/user/entities/user.role';
import type { UserEntity } from 'src/modules/user/entities/user.entity';
import { isOpenManagerSelfRegisterEnabled } from './open-manager-register.config';
import type { JwtPayload } from './types/jwt-payload';
import type { LoginDto } from './dto/login.dto';
import type { PatchMeDto } from './dto/patch-me.dto';
import type { RegisterDto } from './dto/register.dto';
import type { RegisterResponseDto } from './dto/register-response.dto';
import type { VerifyEmailDto } from './dto/verify-email.dto';
import { isAuthSkipVerification } from './auth-skip-verification.config';
import {
  setPendingEmailVerification,
  getPendingEmailVerification,
  deletePendingEmailVerification,
} from './email-verification.store';

/**
 * Время жизни кода подтверждения email в миллисекундах.
 * 15 минут
 */
const EMAIL_VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;
/**
 * Длина кода подтверждения email.
 * 6 цифр
 */
const EMAIL_VERIFICATION_CODE_LENGTH = 6;

function randomDigits(length: number): string {
  let s = '';
  for (let i = 0; i < length; i++) {
    s += String(randomInt(0, 10));
  }
  return s;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(IUserRepositoryToken)
    private readonly users: IUserRepository,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly notifications: NotificationService,
  ) {}

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.findUserForLogin(dto.login.trim());
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.isDeleted || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
    };
    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }

  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    const role = this.resolveRegisterRole(dto);
    const skipVerification = isAuthSkipVerification();

    if (!skipVerification) {
      const notificationCfg = getNotificationConfig();
      if (!notificationCfg.email) {
        throw new BadRequestException(
          'Подтверждение email включено (AUTH_SKIP_VERIFICATION не задан или false), но SMTP не настроен. Укажите NOTIFICATION_EMAIL_* в окружении или установите AUTH_SKIP_VERIFICATION=true для локальных тестов.',
        );
      }
    }

    try {
      const created = await this.userService.registerPublic(
        {
          name: dto.name.trim(),
          email: dto.email.trim(),
          phone: dto.phone.trim(),
          password: dto.password,
        },
        role,
        { activateImmediately: skipVerification },
      );

      if (skipVerification) {
        const payload: JwtPayload = {
          sub: created.id,
          role: created.role,
          email: created.email,
        };
        const access_token = await this.jwtService.signAsync(payload);
        return { access_token };
      }

      const code = randomDigits(EMAIL_VERIFICATION_CODE_LENGTH);
      const expiresAt = Date.now() + EMAIL_VERIFICATION_CODE_TTL_MS;
      const codeHash = await bcrypt.hash(code, 10);
      setPendingEmailVerification(created.email, {
        userId: created.id,
        codeHash,
        expiresAt,
      });

      try {
        await this.notifications.sendVerificationCode({
          code,
          email: created.email,
        });
      } catch (err) {
        throw new BadRequestException(
          `Не удалось отправить код подтверждения: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      return {
        requiresVerification: true,
        message:
          'На указанный email отправлен код подтверждения. После ввода кода учётная запись будет активирована.',
      };
    } catch (error) {
      if (error instanceof EmailAlreadyExistsException) {
        throw new ConflictException(
          'Пользователь с таким email уже зарегистрирован',
        );
      }
      if (error instanceof PhoneAlreadyExistsException) {
        throw new ConflictException(
          'Пользователь с таким телефоном уже зарегистрирован',
        );
      }
      throw error;
    }
  }

  /**
   * Подтверждение email по коду из письма: выставляет `isActive: true` и выдаёт JWT.
   * Код хранится только в памяти процесса (см. `email-verification.store.ts`).
   */
  async verifyEmail(dto: VerifyEmailDto): Promise<{ access_token: string }> {
    const emailTrim = dto.email.trim();
    const pending = getPendingEmailVerification(emailTrim);
    if (!pending) {
      throw new BadRequestException(
        'Код недействителен или истёк. Зарегистрируйтесь снова.',
      );
    }

    const user = await this.users.findByEmail(emailTrim);
    if (!user || user.isDeleted) {
      deletePendingEmailVerification(emailTrim);
      throw new BadRequestException('Пользователь не найден');
    }
    if (user.id !== pending.userId) {
      deletePendingEmailVerification(emailTrim);
      throw new BadRequestException('Код не соответствует email');
    }

    const codeOk = await bcrypt.compare(dto.code.trim(), pending.codeHash);
    if (!codeOk) {
      throw new BadRequestException('Неверный код');
    }

    await this.users.setIsActive(user.id, true);
    deletePendingEmailVerification(emailTrim);

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
    };
    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }

  /**
   * Без OPEN_MANAGER_SELF_REGISTER поле `role` в теле запрещено (всегда DRIVER).
   * С флагом — можно передать MANAGER или DRIVER; SYSTEM_ADMIN по-прежнему только через админский API.
   */
  private resolveRegisterRole(dto: RegisterDto): UserRole {
    const open = isOpenManagerSelfRegisterEnabled();

    if (!open) {
      if (dto.role !== undefined) {
        throw new BadRequestException(
          'Поле role отключено. Для регистрации менеджера без JWT установите OPEN_MANAGER_SELF_REGISTER=true',
        );
      }
      return UserRole.DRIVER;
    }

    if (dto.role === undefined) {
      return UserRole.DRIVER;
    }

    if (dto.role === UserRole.SYSTEM_ADMIN) {
      throw new BadRequestException(
        'Роль SYSTEM_ADMIN через публичную регистрацию недоступна',
      );
    }

    if (dto.role === UserRole.MANAGER || dto.role === UserRole.DRIVER) {
      return dto.role;
    }

    throw new BadRequestException('Недопустимое значение role');
  }

  private async findUserForLogin(login: string): Promise<UserEntity | null> {
    if (EMAIL_REGEX.test(login)) {
      return this.users.findByEmail(login);
    }
    return this.users.findByPhone(login);
  }

  async patchProfile(userId: string, dto: PatchMeDto): Promise<ReadUserEntity> {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Имя не может быть пустым');
    }
    await this.getCurrentUser(userId);
    return this.userService.update(userId, { name });
  }

  /** Проверка, что пользователь из JWT всё ещё существует и может пользоваться API. */
  async getCurrentUser(userId: string): Promise<ReadUserEntity> {
    try {
      const user = await this.userService.findById(userId);
      if (user == null) {
        throw new UnauthorizedException('Invalid session');
      }
      if (user.isDeleted === true || user.isActive === false) {
        throw new UnauthorizedException('Invalid session');
      }
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof UserNotFoundException) {
        throw new UnauthorizedException('Invalid session');
      }
      throw error;
    }
  }
}
