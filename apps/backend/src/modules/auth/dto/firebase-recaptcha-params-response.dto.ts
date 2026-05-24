import { ApiProperty } from '@nestjs/swagger';

export class FirebaseRecaptchaParamsResponseDto {
  @ApiProperty({ description: 'Site key для reCAPTCHA-виджета Firebase Phone Auth' })
  recaptchaSiteKey!: string;
}
