import { ApiProperty } from '@nestjs/swagger';

import { VerificationChannel } from '../verification-channel.enum';

export class SendVerificationCodeResponseDto {
  @ApiProperty({ description: 'Пояснение для клиента' })
  message!: string;

  @ApiProperty({ enum: VerificationChannel })
  channel!: VerificationChannel;
}
