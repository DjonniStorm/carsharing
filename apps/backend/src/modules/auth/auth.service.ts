import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { EMAIL_REGEX } from 'src/shared/regexp/email';
import { IUserRepositoryToken } from 'src/modules/user/repositories/user.repository.interface';
import type { IUserRepository } from 'src/modules/user/repositories/user.repository.interface';
import type { UserEntity } from 'src/modules/user/entities/user.entity';
import type { JwtPayload } from './types/jwt-payload';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(IUserRepositoryToken)
    private readonly users: IUserRepository,
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

  private async findUserForLogin(login: string): Promise<UserEntity | null> {
    if (EMAIL_REGEX.test(login)) {
      return this.users.findByEmail(login);
    }
    return this.users.findByPhone(login);
  }
}
