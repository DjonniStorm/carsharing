import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  createHmac,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { AuthTokens } from '../types/auth.types';
import type { UserRepository } from '../repositories/user.repository';
import { REPOSITORY_TOKENS } from '../../../shared/tokens/repository.tokens';
import { CreateUserInput } from '../../../shared/types/repository.types';
import { RegisterDeviceType, VerificationChannel } from '../auth.dto';

const scryptAsync = promisify(scrypt);

type TokenType = 'access' | 'refresh';

type RegisterInput = {
  deviceType: RegisterDeviceType;
  name: string;
  password: string;
  phone?: string;
  email?: string | null;
};

type LoginInput = {
  identifier: string;
  password: string;
};

type VerifySmsInput = {
  phone: string;
  code: string;
};

type VerifyEmailInput = {
  email: string;
  code: string;
};

type ResendCodeInput = {
  identifier: string;
  channel: VerificationChannel;
};

type RefreshTokenInput = {
  refreshToken: string;
};

type LogoutInput = {
  refreshToken: string;
};

type TokenPayload = {
  sub: number;
  type: TokenType;
  exp: number;
  jti: string;
};

@Injectable()
export class AuthService {
  private readonly accessTtlMs = 15 * 60 * 1000;
  private readonly refreshTtlMs = 7 * 24 * 60 * 60 * 1000;
  private readonly tokenSecret =
    process.env.AUTH_TOKEN_SECRET ?? 'coursework-dev-secret';
  private readonly refreshSessions = new Map<
    string,
    { userId: number; expiresAt: number; revoked: boolean }
  >();

  constructor(
    @Inject(REPOSITORY_TOKENS.user)
    private readonly userRepository: UserRepository,
  ) {}

  async register(input: RegisterInput): Promise<AuthTokens> {
    this.assertRegisterInput(input);
    const normalizedPhone = this.normalizePhone(input.phone);
    const normalizedEmail = this.normalizeEmail(input.email);

    if (normalizedPhone) {
      const existingByPhone =
        await this.userRepository.findByPhone(normalizedPhone);
      if (existingByPhone) {
        throw new Error('Пользователь с таким телефоном уже существует');
      }
    }

    if (normalizedEmail) {
      const existingByEmail =
        await this.userRepository.findByEmail(normalizedEmail);
      if (existingByEmail) {
        throw new Error('Пользователь с таким email уже существует');
      }
    }

    const roleId = await this.userRepository.getOrCreateRoleId(
      input.deviceType === RegisterDeviceType.WEB ? 'MANAGER' : 'DRIVER',
    );
    const createData: CreateUserInput = {
      name: input.name,
      phone: normalizedPhone ?? '',
      passwordHash: await this.hashPassword(input.password),
      isActive: true,
      isDeleted: false,
      email: normalizedEmail ?? null,
      roleId,
    };
    const user = await this.userRepository.create(createData);

    if (input.deviceType === RegisterDeviceType.WEB && normalizedEmail) {
      await this.sendEmailVerification(normalizedEmail);
    }
    if (input.deviceType === RegisterDeviceType.MOBILE && normalizedPhone) {
      await this.sendSmsVerification(normalizedPhone);
    }

    return this.issueTokens(user.id);
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    const identifier = input.identifier.trim();
    if (identifier.length === 0) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const user = await this.userRepository.findByIdentifier(
      this.normalizeIdentifier(identifier),
    );
    if (!user || !user.isActive || user.isDeleted) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const isPasswordValid = await this.verifyPassword(
      input.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    return this.issueTokens(user.id);
  }

  async verifySms(input: VerifySmsInput): Promise<{ verified: boolean }> {
    const user = await this.userRepository.findByPhone(
      this.normalizePhone(input.phone) ?? '',
    );
    return {
      verified: Boolean(user) && input.code.trim().length > 0,
    };
  }

  async verifyEmail(input: VerifyEmailInput): Promise<{ verified: boolean }> {
    const user = await this.userRepository.findByEmail(
      this.normalizeEmail(input.email) ?? '',
    );
    return {
      verified: Boolean(user) && input.code.trim().length > 0,
    };
  }

  async resendVerificationCode(
    input: ResendCodeInput,
  ): Promise<{ sent: boolean; channel: VerificationChannel }> {
    if (input.channel === VerificationChannel.EMAIL) {
      const email = this.normalizeEmail(input.identifier);
      if (!email) {
        throw new Error('Некорректный email');
      }
      await this.sendEmailVerification(email);
      return { sent: true, channel: input.channel };
    }

    const phone = this.normalizePhone(input.identifier);
    if (!phone) {
      throw new Error('Некорректный телефон');
    }
    await this.sendSmsVerification(phone);
    return { sent: true, channel: input.channel };
  }

  async refreshToken(input: RefreshTokenInput): Promise<AuthTokens> {
    const payload = this.verifyToken(input.refreshToken, 'refresh');
    const session = this.refreshSessions.get(
      this.hashToken(input.refreshToken),
    );
    if (
      !session ||
      session.revoked ||
      session.userId !== payload.sub ||
      session.expiresAt <= Date.now()
    ) {
      throw new UnauthorizedException('Refresh token недействителен');
    }

    session.revoked = true;
    return this.issueTokens(payload.sub);
  }

  async logout(input: LogoutInput): Promise<{ loggedOut: boolean }> {
    const tokenHash = this.hashToken(input.refreshToken);
    const session = this.refreshSessions.get(tokenHash);
    if (session) {
      session.revoked = true;
    }
    return { loggedOut: true };
  }

  private async issueTokens(userId: number): Promise<AuthTokens> {
    const accessToken = this.signToken(userId, 'access', this.accessTtlMs);
    const refreshToken = this.signToken(userId, 'refresh', this.refreshTtlMs);
    const refreshPayload = this.verifyToken(refreshToken, 'refresh');

    this.refreshSessions.set(this.hashToken(refreshToken), {
      userId,
      expiresAt: refreshPayload.exp,
      revoked: false,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private assertRegisterInput(input: RegisterInput): void {
    if (input.deviceType === RegisterDeviceType.WEB && !input.email?.trim()) {
      throw new Error('Для регистрации менеджера нужен email');
    }
    if (
      input.deviceType === RegisterDeviceType.MOBILE &&
      !input.phone?.trim()
    ) {
      throw new Error('Для регистрации водителя нужен телефон');
    }
  }

  private normalizeIdentifier(identifier: string): string {
    return identifier.includes('@')
      ? (this.normalizeEmail(identifier) ?? identifier.trim())
      : (this.normalizePhone(identifier) ?? identifier.trim());
  }

  private normalizeEmail(email?: string | null): string | null {
    const normalized = email?.trim().toLowerCase();
    return normalized ? normalized : null;
  }

  private normalizePhone(phone?: string | null): string | null {
    const normalized = phone?.replace(/\s+/g, '').trim();
    return normalized ? normalized : null;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(
    password: string,
    storedHash: string,
  ): Promise<boolean> {
    const [salt, expectedHex] = storedHash.split(':');
    if (!salt || !expectedHex) {
      return false;
    }

    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    const expected = Buffer.from(expectedHex, 'hex');
    if (derivedKey.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(derivedKey, expected);
  }

  private signToken(userId: number, type: TokenType, ttlMs: number): string {
    const header = this.toBase64Url(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    );
    const payload = this.toBase64Url(
      JSON.stringify({
        sub: userId,
        type,
        exp: Date.now() + ttlMs,
        jti: randomUUID(),
      } satisfies TokenPayload),
    );
    const signature = this.createSignature(`${header}.${payload}`);
    return `${header}.${payload}.${signature}`;
  }

  private verifyToken(token: string, expectedType: TokenType): TokenPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Некорректный токен');
    }

    const [header, payload, signature] = parts;
    const expectedSignature = this.createSignature(`${header}.${payload}`);
    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Некорректная подпись токена');
    }

    const decodedPayload = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as TokenPayload;

    if (
      decodedPayload.type !== expectedType ||
      decodedPayload.exp <= Date.now()
    ) {
      throw new UnauthorizedException('Токен истек или имеет неверный тип');
    }

    return decodedPayload;
  }

  private createSignature(value: string): string {
    return createHmac('sha256', this.tokenSecret)
      .update(value)
      .digest('base64url');
  }

  private hashToken(token: string): string {
    return createHmac('sha256', this.tokenSecret).update(token).digest('hex');
  }

  private toBase64Url(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url');
  }

  private async sendSmsVerification(phone: string): Promise<void> {
    void phone;
  }

  private async sendEmailVerification(email: string): Promise<void> {
    void email;
  }
}
