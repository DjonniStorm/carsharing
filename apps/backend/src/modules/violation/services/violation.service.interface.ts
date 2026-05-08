import type { ViolationCreate } from '../entities/dtos/violation.create';
import type { ViolationEntity } from '../entities/violation.entity';
import type { ViolationStatus } from '../entities/violation.status';

export interface IViolationService {
  create(input: ViolationCreate): Promise<ViolationEntity>;
  findAllByTripId(tripId: string): Promise<ViolationEntity[]>;
  findById(id: string): Promise<ViolationEntity | null>;
  findAll(): Promise<ViolationEntity[]>;
  findAllByStatus(
    status: ViolationStatus,
    includeResolved: boolean,
  ): Promise<ViolationEntity[]>;
  updateStatus(id: string, status: ViolationStatus): Promise<ViolationEntity>;
  resolve(id: string): Promise<ViolationEntity>;
}

export const IViolationServiceToken = Symbol('IViolationService');

