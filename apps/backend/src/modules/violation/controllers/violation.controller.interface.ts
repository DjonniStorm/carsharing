import type { ViolationCreate } from '../entities/dtos/violation.create';
import type { ViolationRead } from '../entities/dtos/violation.read';
import type { ViolationUpdateStatus } from '../entities/dtos/violation.update-status';

export interface IViolationController {
  create(input: ViolationCreate): Promise<ViolationRead>;
  findAll(): Promise<ViolationRead[]>;
  findById(id: string): Promise<ViolationRead>;
  findAllByTripId(tripId: string): Promise<ViolationRead[]>;
  findAllByStatus(
    status?: string,
    includeResolved?: string,
  ): Promise<ViolationRead[]>;
  updateStatus(
    id: string,
    input: ViolationUpdateStatus,
  ): Promise<ViolationRead>;
  resolve(id: string): Promise<ViolationRead>;
}
