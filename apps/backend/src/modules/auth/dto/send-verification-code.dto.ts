import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { FIELD_LIMITS } from '@carsharing/validation';

import {

  IsEmail,

  IsEnum,

  IsNotEmpty,

  IsString,

  MaxLength,

  ValidateIf,

} from 'class-validator';



import { VerificationChannel } from '../verification-channel.enum';



export class SendVerificationCodeDto {

  @ApiProperty({

    example: 'user@example.com',

    maxLength: FIELD_LIMITS.EMAIL_MAX,

  })

  @IsEmail()

  @IsNotEmpty()

  @MaxLength(FIELD_LIMITS.EMAIL_MAX)

  email!: string;



  @ApiProperty({ enum: VerificationChannel, example: VerificationChannel.Email })

  @IsEnum(VerificationChannel)

  channel!: VerificationChannel;



  @ApiPropertyOptional({

    description:

      'Токен reCAPTCHA от клиента. Обязателен для channel=sms (Firebase Phone Auth).',

  })

  @ValidateIf((dto) => dto.channel === VerificationChannel.Sms)

  @IsString()

  @IsNotEmpty()

  @MaxLength(10000)

  recaptchaToken?: string;

}


