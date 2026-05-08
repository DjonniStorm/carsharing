import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { JwtPayload } from '../types/jwt-payload';
import type { AuthenticatedUser } from '../types/authenticated-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
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

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };
  }
}
