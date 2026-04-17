import { CreateViolationInput, ViolationEntity } from '../../../shared/types/repository.types';

export interface ViolationRepository {
  findAll(): Promise<ViolationEntity[]>;
  findById(id: number): Promise<ViolationEntity | null>;
  create(data: CreateViolationInput): Promise<ViolationEntity>;
}
