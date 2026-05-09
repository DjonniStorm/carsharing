import type { Violation } from '@prisma/client';

import { ViolationEntity } from '../entities/violation.entity';
import { ViolationRead } from '../entities/dtos/violation.read';
import { ViolationStatus } from '../entities/violation.status';

export class ViolationMapper {
  static fromDbToEntity(row: Violation): ViolationEntity {
    return new ViolationEntity(
      row.id,
      row.type as unknown as ViolationStatus,
      row.description,
      row.createdAt,
      row.tripId,
    );
  }

  static fromEntityToRead(entity: ViolationEntity): ViolationRead {
    const read = new ViolationRead();
    read.id = entity.id;
    read.tripId = entity.tripId;
    read.type = entity.type;
    read.description = entity.description;
    read.createdAt = entity.createdAt;
    return read;
  }
}
