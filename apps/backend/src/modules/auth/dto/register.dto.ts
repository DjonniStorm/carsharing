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

import { PHONE_REGEX } from 'src/shared/regexp/email';
import { UserRole } from 'src/modules/user/entities/user.role';

/**
 * Самостоятельная регистрация. По умолчанию роль DRIVER.
 * Поле `role: MANAGER` учитывается только при `OPEN_MANAGER_SELF_REGISTER=true` (см. auth service).
 */
export class RegisterDto {
  @ApiProperty({ example: 'Иван Иванов' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  name!: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'E.164, например +79991234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_REGEX, { message: 'Phone is not valid' })
  phone!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(255)
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
