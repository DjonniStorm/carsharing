import { FIELD_LIMITS } from '@carsharing/validation';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../user.role';
import { PHONE_REGEX } from 'src/shared/regexp/email';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserEntity {
  // Имя пользователя
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Имя пользователя',
    maxLength: FIELD_LIMITS.USER_DISPLAY_NAME_MAX,
  })
  @IsString()
  @MinLength(FIELD_LIMITS.USER_DISPLAY_NAME_MIN)
  @MaxLength(FIELD_LIMITS.USER_DISPLAY_NAME_MAX)
  name?: string;

  // Email пользователя
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Email пользователя',
    maxLength: FIELD_LIMITS.EMAIL_MAX,
  })
  @IsEmail(undefined, { message: 'Email is not valid' })
  @MaxLength(FIELD_LIMITS.EMAIL_MAX)
  email?: string;

  // Телефон пользователя
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Телефон пользователя',
    maxLength: FIELD_LIMITS.PHONE_MAX,
  })
  @IsString()
  @MaxLength(FIELD_LIMITS.PHONE_MAX)
  @Matches(PHONE_REGEX, { message: 'Phone is not valid' })
  phone?: string;

  // Роль пользователя
  @IsOptional()
  @ApiPropertyOptional({ description: 'Роль пользователя' })
  @IsEnum(UserRole, { message: 'Role is not valid' })
  role?: UserRole;

  // Пароль пользователя
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @ApiPropertyOptional({
    description: 'Пароль пользователя',
    maxLength: FIELD_LIMITS.USER_PASSWORD_MAX,
  })
  @MinLength(FIELD_LIMITS.USER_PASSWORD_MIN)
  @MaxLength(FIELD_LIMITS.USER_PASSWORD_MAX)
  password?: string;

  // Статус активности пользователя
  @IsOptional()
  @ApiPropertyOptional({ description: 'Статус активности пользователя' })
  @IsBoolean({ message: 'Is active is required and must be a boolean' })
  isActive?: boolean;
  // Статус удаления пользователя

  @IsOptional()
  @ApiPropertyOptional({ description: 'Статус удаления пользователя' })
  @IsBoolean({ message: 'Is deleted is required and must be a boolean' })
  isDeleted?: boolean;
}
