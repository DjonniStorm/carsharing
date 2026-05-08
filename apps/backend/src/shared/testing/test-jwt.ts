import { JwtService } from '@nestjs/jwt';

import type { UserRole } from 'src/modules/user/entities/user.role';

/**
 * JWT для интеграционных HTTP-тестов (секрет из `JWT_SECRET` / `AUTH_TOKEN_SECRET` в окружении).
 */
export async function signTestAccessToken(
  secret: string,
  userId: string,
  role: UserRole,
): Promise<string> {
  const jwt = new JwtService({ secret });
  return jwt.signAsync({
    sub: userId,
    role,
  });
}
