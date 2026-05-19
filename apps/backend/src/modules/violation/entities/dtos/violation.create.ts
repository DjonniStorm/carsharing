import { FIELD_LIMITS } from '@carsharing/validation';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ViolationStatus } from '../violation.status';

export class ViolationCreate {
  @IsUUID()
  tripId: string;

  @IsEnum(ViolationStatus)
  type: ViolationStatus;

  @IsString()
  @IsNotEmpty()
  @MinLength(FIELD_LIMITS.VIOLATION_DESCRIPTION_MIN)
  @MaxLength(FIELD_LIMITS.VIOLATION_DESCRIPTION_MAX)
  description: string;
}
