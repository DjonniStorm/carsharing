import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ViolationStatus } from '../violation.status';

export class ViolationCreate {
  @IsUUID()
  tripId: string;

  @IsEnum(ViolationStatus)
  type: ViolationStatus;

  @IsString()
  @IsNotEmpty()
  description: string;
}
