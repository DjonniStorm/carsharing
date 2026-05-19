import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { FIELD_LIMITS } from '@carsharing/validation';

import { PHONE_REGEX } from 'src/shared/regexp/email';
import { UserRole } from 'src/modules/user/entities/user.role';

/**
 * Самостоятельная регистрация. По умолчанию роль DRIVER.
 * Поле `role: MANAGER` учитывается только при `OPEN_MANAGER_SELF_REGISTER=true` (см. auth service).
 */
export class RegisterDto {
  @ApiProperty({
    example: 'Иван Иванов',
    maxLength: FIELD_LIMITS.USER_DISPLAY_NAME_MAX,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(FIELD_LIMITS.USER_DISPLAY_NAME_MIN)
  @MaxLength(FIELD_LIMITS.USER_DISPLAY_NAME_MAX)
  name!: string;

  @ApiProperty({ maxLength: FIELD_LIMITS.EMAIL_MAX })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.EMAIL_MAX)
  email!: string;

  @ApiProperty({
    description: 'E.164, например +79991234567',
    maxLength: FIELD_LIMITS.PHONE_MAX,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.PHONE_MAX)
  @Matches(PHONE_REGEX, { message: 'Phone is not valid' })
  phone!: string;

  @ApiProperty({
    minLength: FIELD_LIMITS.USER_PASSWORD_MIN,
    maxLength: FIELD_LIMITS.USER_PASSWORD_MAX,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(FIELD_LIMITS.USER_PASSWORD_MIN)
  @MaxLength(FIELD_LIMITS.USER_PASSWORD_MAX)
  password!: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description:
      'Только при OPEN_MANAGER_SELF_REGISTER=true. Разрешены MANAGER (0) и DRIVER (1).',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
