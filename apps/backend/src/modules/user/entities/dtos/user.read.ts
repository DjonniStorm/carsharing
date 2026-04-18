import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../user.role';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class ReadUserEntity {
  @ApiProperty({ description: 'ID пользователя' })
  @IsString()
  @IsNotEmpty()
  @IsUUID(4)
  id: string;

  @ApiProperty({ description: 'Имя пользователя' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Email пользователя' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Телефон пользователя' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Роль пользователя' })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Статус активности пользователя' })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Статус удаления пользователя' })
  @IsBoolean()
  isDeleted?: boolean;
}
