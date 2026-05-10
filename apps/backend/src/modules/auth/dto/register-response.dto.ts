import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Ответ POST /auth/register: либо сразу JWT, либо запрос подтверждения email. */
export class RegisterResponseDto {
  @ApiPropertyOptional({
    description:
      'JWT при AUTH_SKIP_VERIFICATION=true или устаревшем режиме «сразу активен»',
  })
  access_token?: string;

  @ApiPropertyOptional({
    description: 'true — нужно ввести код из письма (JWT пока не выдаём)',
  })
  requiresVerification?: boolean;

  @ApiPropertyOptional({
    description: 'Пояснение для клиента',
  })
  message?: string;
}
