import type {
  TariffFindByIdOptions,
  TariffListParams,
} from '../entities/tariff-query.types';
import { TariffEntity } from '../entities/tariff.entity';

export interface ITariffRepository {
  findMany(params?: TariffListParams): Promise<TariffEntity[]>;

  findById(
    id: string,
    options?: TariffFindByIdOptions,
  ): Promise<TariffEntity | null>;

  create(input: {
    name: string;
    pricePerMinute: number;
    pricePerKm: number;
    geoZoneId: string;
  }): Promise<TariffEntity>;

  update(
    id: string,
    patch: Partial<{
      name: string;
      pricePerMinute: number;
      pricePerKm: number;
      geoZoneId: string;
    }>,
  ): Promise<TariffEntity>;

  setDeletedAt(id: string, deletedAt: Date | null): Promise<TariffEntity>;
}

export const ITariffRepositoryToken = Symbol('ITariffRepository');
