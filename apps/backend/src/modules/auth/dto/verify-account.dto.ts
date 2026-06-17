import { ApiProperty } from '@nestjs/swagger';
import { FIELD_LIMITS } from '@carsharing/validation';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class VerifyAccountDto {
  @ApiProperty({
    example: 'user@example.com',
    maxLength: FIELD_LIMITS.EMAIL_MAX,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.EMAIL_MAX)
  email!: string;

  @ApiProperty({ description: 'Код подтверждения (6 цифр)', example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}
