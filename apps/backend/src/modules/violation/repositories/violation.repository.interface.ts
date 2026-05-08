import type { ViolationCreate } from '../entities/dtos/violation.create';
import type { ViolationEntity } from '../entities/violation.entity';
import { ViolationStatus } from '../entities/violation.status';

export interface IViolationRepository {
  /** Создание нарушения */
  create(input: ViolationCreate): Promise<ViolationEntity>;
  /** Поиск нарушений по id поездки */
  findAllByTripId(tripId: string): Promise<ViolationEntity[]>;
  /** Обновление статуса нарушения */
  updateStatus(id: string, status: ViolationStatus): Promise<ViolationEntity>;
  /** Поиск нарушения по id */
  findById(id: string): Promise<ViolationEntity | null>;
  /** Поиск всех нарушений */
  findAll(): Promise<ViolationEntity[]>;
  /** Поиск нарушений по статусу */
  findAllByStatus(
    status: ViolationStatus,
    includeResolved: boolean,
  ): Promise<ViolationEntity[]>;
  /** Разрешение нарушения */
  resolve(id: string): Promise<ViolationEntity>;
}

export const IViolationRepositoryToken = Symbol('IViolationRepository');
