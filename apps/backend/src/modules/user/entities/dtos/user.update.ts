import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { UserRole } from '../user.role';
import { PHONE_REGEX } from 'src/shared/regexp/email';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserEntity {
  // Имя пользователя
  @IsOptional()
  @ApiPropertyOptional({ description: 'Имя пользователя' })
  name?: string;

  // Email пользователя
  @IsOptional()
  @ApiPropertyOptional({ description: 'Email пользователя' })
  @IsEmail(undefined, { message: 'Email is not valid' })
  email?: string;

  // Телефон пользователя
  @IsOptional()
  @ApiPropertyOptional({ description: 'Телефон пользователя' })
  @Matches(PHONE_REGEX, { message: 'Phone is not valid' })
  phone?: string;

  // Роль пользователя
  @IsOptional()
  @ApiPropertyOptional({ description: 'Роль пользователя' })
  @IsEnum(UserRole, { message: 'Role is not valid' })
  role?: UserRole;

  // Пароль пользователя
  @IsString({ message: 'Password is required and must be a string' })
  @ApiPropertyOptional({ description: 'Пароль пользователя' })
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
