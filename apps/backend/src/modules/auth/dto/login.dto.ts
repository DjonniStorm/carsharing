import { ApiProperty } from '@nestjs/swagger';
import { FIELD_LIMITS } from '@carsharing/validation';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email или телефон в формате E.164',
    example: 'driver@example.com',
    maxLength: FIELD_LIMITS.LOGIN_MAX,
  })
  @IsString()
  @MinLength(FIELD_LIMITS.LOGIN_MIN)
  @MaxLength(FIELD_LIMITS.LOGIN_MAX)
  login!: string;

  @ApiProperty({ maxLength: FIELD_LIMITS.USER_PASSWORD_MAX })
  @IsString()
  @MinLength(FIELD_LIMITS.LOGIN_PASSWORD_MIN)
  @MaxLength(FIELD_LIMITS.USER_PASSWORD_MAX)
  password!: string;
}
