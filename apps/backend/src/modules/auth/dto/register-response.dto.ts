import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Ответ POST /auth/register: либо сразу JWT, либо запрос подтверждения. */
export class RegisterResponseDto {
  @ApiPropertyOptional({
    description:
      'JWT при AUTH_SKIP_VERIFICATION=true или устаревшем режиме «сразу активен»',
  })
  access_token?: string;

  @ApiPropertyOptional({
    description: 'true — нужно подтвердить регистрацию (JWT пока не выдаём)',
  })
  requiresVerification?: boolean;

  @ApiPropertyOptional({ description: 'Email зарегистрированного пользователя' })
  email?: string;

  @ApiPropertyOptional({ description: 'Телефон зарегистрированного пользователя' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Пояснение для клиента',
  })
  message?: string;
}
