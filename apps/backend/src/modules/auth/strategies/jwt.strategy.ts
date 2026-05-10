import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { IUserRepositoryToken } from 'src/modules/user/repositories/user.repository.interface';
import type { IUserRepository } from 'src/modules/user/repositories/user.repository.interface';

import type { JwtPayload } from '../types/jwt-payload';
import type { AuthenticatedUser } from '../types/authenticated-user';

/**
 * После проверки подписи JWT подгружает пользователя из БД и отсекает удалённых и с `isActive: false`,
 * чтобы не полагаться только на полезную нагрузку токена.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @Inject(IUserRepositoryToken) private readonly users: IUserRepository,
  ) {
    const secret =
      configService.get<string>('JWT_SECRET') ??
      configService.get<string>('AUTH_TOKEN_SECRET');
    if (!secret) {
      throw new Error(
        'JWT_SECRET or AUTH_TOKEN_SECRET must be set for JWT authentication',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.users.findById(payload.sub);
    if (!user || user.isDeleted || !user.isActive) {
      throw new UnauthorizedException('Unauthorized');
    }
    return {
      id: user.id,
      role: user.role,
      email: user.email,
    };
  }
}
