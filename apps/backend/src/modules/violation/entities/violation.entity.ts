import { BaseEntity } from 'src/shared/types/entities/base-entity';
import { ViolationStatus } from './violation.status';

export class ViolationEntity extends BaseEntity<string> {
  constructor(
    public readonly id: string,
    public readonly type: ViolationStatus,
    public readonly description: string,
    public readonly createdAt: Date,
    public readonly tripId: string,
  ) {
    super(id);
  }
}
