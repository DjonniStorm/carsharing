import {
  CreateZoneInput,
  UpdateZoneInput,
  ZoneEntity,
} from '../../../shared/types/repository.types';

export interface ZoneRepository {
  findAll(): Promise<ZoneEntity[]>;
  findActive(): Promise<ZoneEntity[]>;
  findById(id: number): Promise<ZoneEntity | null>;
  create(data: CreateZoneInput): Promise<ZoneEntity>;
  update(id: number, data: UpdateZoneInput): Promise<ZoneEntity>;
  softDelete(id: number): Promise<ZoneEntity>;
  restore(id: number): Promise<ZoneEntity>;
}
