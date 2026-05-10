import type { TariffListParams } from '../entities/tariff-query.types';
import { TariffPresetEntity } from '../entities/tariff.entity';

export interface ITariffRepository {
  findMany(params?: TariffListParams): Promise<TariffPresetEntity[]>;

  /** По id без фильтра по удалению (для админки). */
  findById(id: string): Promise<TariffPresetEntity | null>;

  /** Активный (не удалённый) пресет по id — для копирования ставок в версию зоны. */
  findActiveById(id: string): Promise<TariffPresetEntity | null>;

  create(input: {
    name: string;
    pricePerMinute: number;
    pricePerKm: number;
    pausePricePerMinute: number;
    isDefault: boolean;
  }): Promise<TariffPresetEntity>;

  update(
    id: string,
    patch: Partial<{
      name: string;
      pricePerMinute: number;
      pricePerKm: number;
      pausePricePerMinute: number;
      isDefault: boolean;
      isDeleted: boolean;
    }>,
  ): Promise<TariffPresetEntity>;
}

export const ITariffRepositoryToken = Symbol('ITariffRepository');
