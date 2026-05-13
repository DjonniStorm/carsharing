import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Уведомление по поездке (ответ списка). */
export class TripNotificationReadDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tripId: string | null;

  @ApiProperty({ description: 'JSON или текст тела уведомления' })
  message: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ type: [String], description: 'Связанные нарушения' })
  violationIds: string[];
}
