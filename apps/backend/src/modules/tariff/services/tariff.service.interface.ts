import { TariffCreate } from '../entities/dtos/tariff.create';
import { TariffRead } from '../entities/dtos/tariff.read';
import { TariffUpdate } from '../entities/dtos/tariff.update';
import {
  TariffFindByIdOptions,
  TariffListParams,
} from '../entities/tariff-query.types';

export interface ITariffService {
  findMany(params?: TariffListParams): Promise<TariffRead[]>;

  findById(id: string, options?: TariffFindByIdOptions): Promise<TariffRead>;

  create(input: TariffCreate): Promise<TariffRead>;

  update(id: string, input: TariffUpdate): Promise<TariffRead>;

  delete(id: string): Promise<TariffRead>;
}
