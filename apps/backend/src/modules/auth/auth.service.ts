import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'node:crypto';
import * as bcrypt from 'bcryptjs';

import { getNotificationConfig } from 'src/shared/notification/notification.config';
import { NotificationService } from 'src/shared/notification/notification.service';
import { Throttle } from 'src/shared/throttle/throttle';
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
import type { LoginResponseDto } from './dto/login-response.dto';
import type { PatchMeDto } from './dto/patch-me.dto';
import type { RegisterDto } from './dto/register.dto';
import type { RegisterResponseDto } from './dto/register-response.dto';
import type { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import type { SendVerificationCodeResponseDto } from './dto/send-verification-code-response.dto';
import type { VerifyAccountDto } from './dto/verify-account.dto';
import type { VerifyEmailDto } from './dto/verify-email.dto';
import { isAuthSkipVerification } from './auth-skip-verification.config';
import {
  setPendingVerification,
  getPendingVerification,
  deletePendingVerification,
} from './account-verification.store';
import { VerificationChannel } from './verification-channel.enum';

/** Время жизни pending-кода подтверждения (15 мин). */
const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;
/** Длина кода подтверждения email (6 цифр). */
const VERIFICATION_CODE_LENGTH = 6;
/** Минимальный интервал между send-verification-code на пользователя. */
const SEND_VERIFICATION_THROTTLE_MS = 60 * 1000;

function randomDigits(length: number): string {
  let s = '';
  for (let i = 0; i < length; i++) {
    s += String(randomInt(0, 10));
  }
  return s;
}

function normalizeE164Phone(phone: string): string {
  return phone.trim().replace(/\s/g, '');
}

@Injectable()
export class AuthService {
  private readonly sendVerificationThrottle = new Throttle();

  constructor(
    @Inject(IUserRepositoryToken)
    private readonly users: IUserRepository,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly notifications: NotificationService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.findUserForLogin(dto.login.trim());
    if (!user || user.isDeleted) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      return {
        requiresVerification: true,
        email: user.email,
        phone: user.phone,
        message: 'Подтвердите регистрацию',
      };
    }

    const access_token = await this.signAccessToken(user);
    return { access_token };
  }

  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    const role = this.resolveRegisterRole(dto);
    const skipVerification = isAuthSkipVerification();

    if (!skipVerification) {
      const notificationCfg = getNotificationConfig();
      if (!notificationCfg.email && !notificationCfg.firebasePhone) {
        throw new BadRequestException(
          'Подтверждение регистрации включено, но не настроен ни SMTP (NOTIFICATION_EMAIL_*), ни Firebase Phone Auth (FIREBASE_*). Установите AUTH_SKIP_VERIFICATION=true для локальных тестов.',
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
        const access_token = await this.signAccessTokenFromRead(created);
        return { access_token };
      }

      return {
        requiresVerification: true,
        email: created.email,
        phone: created.phone,
        message: 'Выберите способ подтверждения регистрации',
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

  async getFirebaseRecaptchaParams(): Promise<{ recaptchaSiteKey: string }> {
    const notificationCfg = getNotificationConfig();
    if (!notificationCfg.firebasePhone) {
      throw new BadRequestException('Канал SMS не настроен (FIREBASE_API_KEY)');
    }

    try {
      return await this.notifications.getFirebaseRecaptchaParams();
    } catch (err) {
      throw new BadRequestException(
        `Не удалось получить параметры reCAPTCHA: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async sendVerificationCode(
    dto: SendVerificationCodeDto,
  ): Promise<SendVerificationCodeResponseDto> {
    const emailTrim = dto.email.trim();
    const user = await this.users.findByEmail(emailTrim);
    if (!user || user.isDeleted) {
      throw new BadRequestException('Пользователь не найден');
    }
    if (user.isActive) {
      throw new BadRequestException('Учётная запись уже активирована');
    }

    const throttleKey = `verify-send:${user.id}`;
    if (!this.sendVerificationThrottle.allow(throttleKey, SEND_VERIFICATION_THROTTLE_MS)) {
      throw new HttpException(
        'Код уже отправлен. Повторите запрос через минуту.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const notificationCfg = getNotificationConfig();
    const expiresAt = Date.now() + VERIFICATION_CODE_TTL_MS;

    if (dto.channel === VerificationChannel.Email) {
      if (!notificationCfg.email) {
        throw new BadRequestException(
          'Канал email не настроен (NOTIFICATION_EMAIL_*)',
        );
      }

      const code = randomDigits(VERIFICATION_CODE_LENGTH);
      const codeHash = await bcrypt.hash(code, 10);
      setPendingVerification(emailTrim, {
        channel: VerificationChannel.Email,
        userId: user.id,
        codeHash,
        expiresAt,
      });

      try {
        await this.notifications.sendVerificationCode({
          code,
          email: user.email,
        });
      } catch (err) {
        deletePendingVerification(emailTrim);
        throw new BadRequestException(
          `Не удалось отправить код на email: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      return {
        channel: VerificationChannel.Email,
        message: 'Код подтверждения отправлен на email',
      };
    }

    if (!notificationCfg.firebasePhone) {
      throw new BadRequestException(
        'Канал SMS не настроен (FIREBASE_API_KEY)',
      );
    }

    const recaptchaToken = dto.recaptchaToken?.trim();
    if (!recaptchaToken) {
      throw new BadRequestException(
        'Для SMS нужен recaptchaToken (reCAPTCHA на клиенте)',
      );
    }

    try {
      const { sessionInfo } = await this.notifications.sendFirebasePhoneVerification(
        user.phone,
        recaptchaToken,
      );
      setPendingVerification(emailTrim, {
        channel: VerificationChannel.Sms,
        userId: user.id,
        sessionInfo,
        expiresAt,
      });
    } catch (err) {
      throw new BadRequestException(
        `Не удалось отправить SMS: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return {
      channel: VerificationChannel.Sms,
      message: 'Код подтверждения отправлен по SMS',
    };
  }

  async verifyAccount(dto: VerifyAccountDto): Promise<{ access_token: string }> {
    const emailTrim = dto.email.trim();
    const pending = getPendingVerification(emailTrim);
    if (!pending) {
      throw new BadRequestException(
        'Код недействителен или истёк. Запросите новый код.',
      );
    }

    const user = await this.users.findByEmail(emailTrim);
    if (!user || user.isDeleted) {
      deletePendingVerification(emailTrim);
      throw new BadRequestException('Пользователь не найден');
    }
    if (user.id !== pending.userId) {
      deletePendingVerification(emailTrim);
      throw new BadRequestException('Код не соответствует email');
    }
    if (user.isActive) {
      deletePendingVerification(emailTrim);
      throw new BadRequestException('Учётная запись уже активирована');
    }

    const codeTrim = dto.code.trim();

    if (pending.channel === VerificationChannel.Email) {
      const codeOk = await bcrypt.compare(codeTrim, pending.codeHash);
      if (!codeOk) {
        throw new BadRequestException('Неверный код');
      }
    } else {
      try {
        const result = await this.notifications.verifyFirebasePhoneCode(
          pending.sessionInfo,
          codeTrim,
        );
        if (
          normalizeE164Phone(result.phoneNumber) !== normalizeE164Phone(user.phone)
        ) {
          throw new BadRequestException('Номер телефона не совпадает с учётной записью');
        }
      } catch (err) {
        if (err instanceof BadRequestException) {
          throw err;
        }
        throw new BadRequestException(
          err instanceof Error ? err.message : 'Неверный код',
        );
      }
    }

    await this.users.setIsActive(user.id, true);
    deletePendingVerification(emailTrim);

    const access_token = await this.signAccessToken(user);
    return { access_token };
  }

  /** Alias для backward compat (mobile). */
  async verifyEmail(dto: VerifyEmailDto): Promise<{ access_token: string }> {
    return this.verifyAccount(dto);
  }

  private async signAccessToken(user: UserEntity): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
    };
    return this.jwtService.signAsync(payload);
  }

  private async signAccessTokenFromRead(user: ReadUserEntity): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
    };
    return this.jwtService.signAsync(payload);
  }

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
