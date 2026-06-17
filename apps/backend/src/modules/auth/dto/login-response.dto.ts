import { ApiPropertyOptional } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiPropertyOptional({ description: 'JWT access token (Bearer)' })
  access_token?: string;

  @ApiPropertyOptional({
    description: 'true — учётная запись не активирована, нужно подтверждение',
  })
  requiresVerification?: boolean;

  @ApiPropertyOptional({ description: 'Email для экрана подтверждения' })
  email?: string;

  @ApiPropertyOptional({ description: 'Телефон для экрана подтверждения' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Пояснение для клиента' })
  message?: string;
}
