import { TariffCreate } from '../entities/dtos/tariff.create';
import { TariffRead } from '../entities/dtos/tariff.read';
import { TariffUpdate } from '../entities/dtos/tariff.update';

export interface ITariffController {
  findAll(includeDeleted: boolean, geoZoneId?: string): Promise<TariffRead[]>;
  findById(id: string): Promise<TariffRead>;
  create(tariff: TariffCreate): Promise<TariffRead>;
  update(id: string, tariff: TariffUpdate): Promise<TariffRead>;
  delete(id: string): Promise<TariffRead>;
}
