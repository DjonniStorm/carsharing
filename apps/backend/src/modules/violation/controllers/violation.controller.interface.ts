import type { AuthenticatedUser } from 'src/modules/auth/types/authenticated-user';
import type { ViolationCreate } from '../entities/dtos/violation.create';
import type { ViolationRead } from '../entities/dtos/violation.read';
import type { ViolationUpdateStatus } from '../entities/dtos/violation.update-status';

export interface IViolationController {
  create(input: ViolationCreate): Promise<ViolationRead>;

  /** Алиас полного списка (маршрут `GET /` реализован через `findAllByStatus`). */
  findAll(): Promise<ViolationRead[]>;

  findAllByStatus(
    status?: string,
    includeResolved?: string,
  ): Promise<ViolationRead[]>;

  findAllByTripId(
    user: AuthenticatedUser,
    tripId: string,
  ): Promise<ViolationRead[]>;

  findById(user: AuthenticatedUser, id: string): Promise<ViolationRead>;

  updateStatus(
    id: string,
    input: ViolationUpdateStatus,
  ): Promise<ViolationRead>;

  resolve(id: string): Promise<ViolationRead>;
}
