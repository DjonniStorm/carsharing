import { Inject, Injectable } from '@nestjs/common';
import { AuthTokens } from '../types/auth.types';
import type { UserRepository } from '../repositories/user.repository';
import { REPOSITORY_TOKENS } from '../../../shared/tokens/repository.tokens';
import { CreateUserInput } from '../../../shared/types/repository.types';

type RegisterInput = {
  name: string;
  phone: string;
  passwordHash: string;
  roleId: number;
  email?: string | null;
};

type LoginInput = {
  phone: string;
  passwordHash: string;
};

type VerifySmsInput = {
  phone: string;
  code: string;
};

type RefreshTokenInput = {
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(REPOSITORY_TOKENS.user)
    private readonly userRepository: UserRepository,
  ) {}

  async register(input: RegisterInput): Promise<AuthTokens> {
    const createData: CreateUserInput = {
      name: input.name,
      phone: input.phone,
      passwordHash: input.passwordHash,
      isActive: true,
      isDeleted: false,
      email: input.email ?? null,
      roleId: input.roleId,
    };
    await this.userRepository.create(createData);
    return {
      accessToken: 'stub-access-token',
      refreshToken: 'stub-refresh-token',
    };
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    await this.userRepository.findByPhone(input.phone);
    return {
      accessToken: `stub-access-token-${input.passwordHash.length}`,
      refreshToken: 'stub-refresh-token',
    };
  }

  async verifySms(input: VerifySmsInput): Promise<{ verified: boolean }> {
    const user = await this.userRepository.findByPhone(input.phone);
    return { verified: Boolean(user) && input.code.length > 0 };
  }

  async refreshToken(input: RefreshTokenInput): Promise<AuthTokens> {
    return {
      accessToken: `stub-access-token-refreshed-${input.refreshToken.length}`,
      refreshToken: 'stub-refresh-token-next',
    };
  }
}
