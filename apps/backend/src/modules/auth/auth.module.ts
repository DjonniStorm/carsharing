import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret =
          config.get<string>('JWT_SECRET') ??
          config.get<string>('AUTH_TOKEN_SECRET');
        if (!secret) {
          throw new Error(
            'JWT_SECRET or AUTH_TOKEN_SECRET must be set for JWT authentication',
          );
        }
        const expiresIn =
          config.get<string>('JWT_EXPIRES_IN') ??
          config.get<string>('JWT_EXPIRATION') ??
          '1d';
        return {
          secret,
          signOptions: { expiresIn },
        } as JwtModuleOptions;
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
