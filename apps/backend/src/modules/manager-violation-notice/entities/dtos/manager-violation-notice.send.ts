import { ApiProperty } from '@nestjs/swagger';
import { FIELD_LIMITS } from '@carsharing/validation';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
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

  @ApiProperty({
    example: 'Важно: нарушения по поездке',
    maxLength: FIELD_LIMITS.NOTICE_SUBJECT_MAX,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(FIELD_LIMITS.NOTICE_SUBJECT_MIN)
  @MaxLength(FIELD_LIMITS.NOTICE_SUBJECT_MAX)
  subject: string;

  @ApiProperty({
    description: 'Текст письма водителю',
    maxLength: FIELD_LIMITS.NOTICE_MESSAGE_MAX,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(FIELD_LIMITS.NOTICE_MESSAGE_MIN)
  @MaxLength(FIELD_LIMITS.NOTICE_MESSAGE_MAX)
  message: string;
}
