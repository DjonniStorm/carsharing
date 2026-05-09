import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { EMAIL_REGEX } from 'src/shared/regexp/email';
import {
  EmailAlreadyExistsException,
  PhoneAlreadyExistsException,
} from 'src/modules/user/common/errors';
import { IUserRepositoryToken } from 'src/modules/user/repositories/user.repository.interface';
import type { IUserRepository } from 'src/modules/user/repositories/user.repository.interface';
import { UserService } from 'src/modules/user/services/user.service';
import { UserRole } from 'src/modules/user/entities/user.role';
import type { UserEntity } from 'src/modules/user/entities/user.entity';
import { isOpenManagerSelfRegisterEnabled } from './open-manager-register.config';
import type { JwtPayload } from './types/jwt-payload';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(IUserRepositoryToken)
    private readonly users: IUserRepository,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
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

  async register(dto: RegisterDto): Promise<{ access_token: string }> {
    const role = this.resolveRegisterRole(dto);

    try {
      const created = await this.userService.registerPublic(
        {
          name: dto.name.trim(),
          email: dto.email.trim(),
          phone: dto.phone.trim(),
          password: dto.password,
        },
        role,
      );
      const payload: JwtPayload = {
        sub: created.id,
        role: created.role,
        email: created.email,
      };
      const access_token = await this.jwtService.signAsync(payload);
      return { access_token };
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
}
