import {
  CreateTariffInput,
  TariffEntity,
  UpdateTariffInput,
} from '../../../shared/types/repository.types';

export interface TariffRepository {
  findAll(): Promise<TariffEntity[]>;
  findById(id: number): Promise<TariffEntity | null>;
  create(data: CreateTariffInput): Promise<TariffEntity>;
  update(id: number, data: UpdateTariffInput): Promise<TariffEntity>;
  softDelete(id: number): Promise<TariffEntity>;
  restore(id: number): Promise<TariffEntity>;
}
