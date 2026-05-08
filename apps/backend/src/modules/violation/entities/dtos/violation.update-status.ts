import { IsEnum } from 'class-validator';

import { ViolationStatus } from '../violation.status';

export class ViolationUpdateStatus {
  @IsEnum(ViolationStatus)
  status: ViolationStatus;
}
