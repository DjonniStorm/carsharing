import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * Тело запроса: менеджер выбирает нарушения поездки и текст письма водителю.
 * Список `violationIds` — сущность выбора в запросе; в БД дублируется связями `violation_notification`.
 */
export class ManagerViolationNoticeSendDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  tripId: string;

  @ApiProperty({
    type: [String],
    description: 'UUID нарушений этой поездки (минимум одно)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  violationIds: string[];

  @ApiProperty({ example: 'Важно: нарушения по поездке', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  subject: string;

  @ApiProperty({
    description: 'Текст письма водителю',
    maxLength: 20_000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20_000)
  message: string;
}
