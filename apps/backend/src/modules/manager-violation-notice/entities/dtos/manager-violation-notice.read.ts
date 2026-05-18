import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ManagerNoticeDeliveryStatus } from '../notification-delivery.status';

export class ManagerViolationNoticeReadDto {
  @ApiProperty({ description: 'Запись в таблице `notification`' })
  notificationId: number;

  @ApiProperty({ enum: ManagerNoticeDeliveryStatus })
  deliveryStatus: ManagerNoticeDeliveryStatus;

  @ApiProperty({ type: [String] })
  violationIds: string[];

  @ApiProperty({ description: 'Email получателя (водитель поездки)' })
  sentToEmail: string;

  @ApiPropertyOptional({
    description:
      'Если deliveryStatus=FAILED — краткая причина (ошибка SMTP и т.п.)',
  })
  failureReason?: string;
}
