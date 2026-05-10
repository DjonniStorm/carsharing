import { Inject, Injectable, Logger } from '@nestjs/common';

import { TariffDbErrors } from '../common/db-errors';
import {
  TariffAlreadyDeletedException,
  TariffNotFoundException,
} from '../common/errors';
import { TariffMapper } from '../common/mapper';
import { TariffCreate } from '../entities/dtos/tariff.create';
import { TariffRead } from '../entities/dtos/tariff.read';
import { TariffUpdate } from '../entities/dtos/tariff.update';
import type { TariffListParams } from '../entities/tariff-query.types';
import {
  ITariffRepositoryToken,
  type ITariffRepository,
} from '../repositories/tariff.repository.interface';
import { ITariffService } from './tariff.service.interface';

@Injectable()
export class TariffService implements ITariffService {
  private readonly logger = new Logger(TariffService.name);

  constructor(
    @Inject(ITariffRepositoryToken)
    private readonly repository: ITariffRepository,
  ) {}

  async findMany(params?: TariffListParams): Promise<TariffRead[]> {
    try {
      const list = await this.repository.findMany(params);
      return list.map(TariffMapper.fromEntityToRead);
    } catch (error) {
      throw TariffDbErrors.mapError(error);
    }
  }

  async findById(id: string): Promise<TariffRead> {
    try {
      const tariff = await this.repository.findById(id);
      if (!tariff) {
        throw new TariffNotFoundException(`Шаблон тарифа не найден: ${id}`);
      }
      return TariffMapper.fromEntityToRead(tariff);
    } catch (error) {
      throw TariffDbErrors.mapError(error);
    }
  }

  async create(input: TariffCreate): Promise<TariffRead> {
    try {
      const pause =
        input.pausePricePerMinute !== undefined ? input.pausePricePerMinute : 0;
      const isDefault = input.isDefault === true;
      const created = await this.repository.create({
        name: input.name,
        pricePerMinute: input.pricePerMinute,
        pricePerKm: input.pricePerKm,
        pausePricePerMinute: pause,
        isDefault,
      });
      return TariffMapper.fromEntityToRead(created);
    } catch (error) {
      throw TariffDbErrors.mapError(error);
    }
  }

  async update(id: string, input: TariffUpdate): Promise<TariffRead> {
    try {
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new TariffNotFoundException(`Шаблон тарифа не найден: ${id}`);
      }
      const patch: Parameters<ITariffRepository['update']>[1] = {};
      if (input.name !== undefined) {
        patch.name = input.name;
      }
      if (input.pricePerMinute !== undefined) {
        patch.pricePerMinute = input.pricePerMinute;
      }
      if (input.pricePerKm !== undefined) {
        patch.pricePerKm = input.pricePerKm;
      }
      if (input.pausePricePerMinute !== undefined) {
        patch.pausePricePerMinute = input.pausePricePerMinute;
      }
      if (input.isDefault !== undefined) {
        patch.isDefault = input.isDefault;
      }
      const updated = await this.repository.update(id, patch);
      return TariffMapper.fromEntityToRead(updated);
    } catch (error) {
      throw TariffDbErrors.mapError(error);
    }
  }

  async delete(id: string): Promise<TariffRead> {
    try {
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new TariffNotFoundException(`Шаблон тарифа не найден: ${id}`);
      }
      if (existing.isDeleted) {
        throw new TariffAlreadyDeletedException(
          `Шаблон тарифа уже удалён: ${id}`,
        );
      }
      const deleted = await this.repository.update(id, { isDeleted: true });
      return TariffMapper.fromEntityToRead(deleted);
    } catch (error) {
      throw TariffDbErrors.mapError(error);
    }
  }
}
