import { ViolationStatus } from '../violation.status';

export class ViolationRead {
  id: string;
  tripId: string;
  type: ViolationStatus;
  description: string;
  createdAt: Date;
}
