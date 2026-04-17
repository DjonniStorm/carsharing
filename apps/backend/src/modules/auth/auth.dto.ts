import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export enum RegisterDeviceType {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
}

export enum VerificationChannel {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
}

export class RegisterDto {
  @ApiProperty({ description: 'Имя пользователя' })
  @IsString()
  name: string;

  @ApiProperty({
    enum: RegisterDeviceType,
    description: 'Тип устройства, с которого выполняется регистрация',
  })
  @IsEnum(RegisterDeviceType)
  deviceType: RegisterDeviceType;

  @ApiPropertyOptional({
    description: 'Email обязателен для регистрации менеджера с веба',
  })
  @ValidateIf((dto: RegisterDto) => dto.deviceType === RegisterDeviceType.WEB)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Телефон обязателен для регистрации водителя с телефона',
  })
  @ValidateIf(
    (dto: RegisterDto) => dto.deviceType === RegisterDeviceType.MOBILE,
  )
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Пароль пользователя' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'Email или телефон для входа',
    examples: ['manager@example.com', '+79990001122'],
  })
  @IsString()
  identifier: string;

  @ApiProperty({ description: 'Пароль пользователя' })
  @IsString()
  password: string;
}

export class VerifySmsDto {
  @ApiProperty({ description: 'Телефон пользователя' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Код подтверждения из SMS' })
  @IsString()
  code: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Email пользователя' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Код подтверждения из письма' })
  @IsString()
  code: string;
}

export class ResendCodeDto {
  @ApiProperty({ description: 'Email или телефон для отправки кода' })
  @IsString()
  identifier: string;

  @ApiProperty({
    enum: VerificationChannel,
    description: 'Канал доставки кода подтверждения',
  })
  @IsEnum(VerificationChannel)
  channel: VerificationChannel;
}

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  refreshToken: string;
}

export class LogoutDto {
  @ApiProperty({ description: 'Refresh token текущей сессии' })
  @IsString()
  refreshToken: string;
}
