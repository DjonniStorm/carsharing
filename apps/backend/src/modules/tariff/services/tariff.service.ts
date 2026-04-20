import { Inject, Injectable, Logger } from '@nestjs/common';

import { TariffDbErrors } from '../common/db-errors';
import {
  TariffAlreadyDeletedException,
  TariffNotDeletedException,
  TariffNotFoundException,
} from '../common/errors';
import { TariffMapper } from '../common/mapper';
import { TariffCreate } from '../entities/dtos/tariff.create';
import { TariffRead } from '../entities/dtos/tariff.read';
import { TariffUpdate } from '../entities/dtos/tariff.update';
import {
  TariffFindByIdOptions,
  TariffListParams,
} from '../entities/tariff-query.types';
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
    this.logger.log('Finding tariffs');
    try {
      const list = await this.repository.findMany(params);
      return list.map(TariffMapper.fromEntityToRead);
    } catch (error) {
      this.logger.error('Failed to find tariffs', error);
      throw TariffDbErrors.mapError(error);
    }
  }

  async findById(
    id: string,
    options?: TariffFindByIdOptions,
  ): Promise<TariffRead> {
    this.logger.log(`Finding tariff by id: ${id}`);
    try {
      const tariff = await this.repository.findById(id, options);
      if (!tariff) {
        throw new TariffNotFoundException(`Tariff with id ${id} was not found`);
      }
      return TariffMapper.fromEntityToRead(tariff);
    } catch (error) {
      this.logger.error(`Failed to find tariff by id: ${id}`, error);
      throw TariffDbErrors.mapError(error);
    }
  }

  async create(input: TariffCreate): Promise<TariffRead> {
    this.logger.log(`Creating tariff: ${input.name}`);
    try {
      const created = await this.repository.create({
        name: input.name,
        pricePerMinute: input.pricePerMinute,
        pricePerKm: input.pricePerKm,
        geoZoneId: input.geoZoneId,
      });
      return TariffMapper.fromEntityToRead(created);
    } catch (error) {
      this.logger.error(`Failed to create tariff: ${input.name}`, error);
      throw TariffDbErrors.mapError(error);
    }
  }

  async update(id: string, input: TariffUpdate): Promise<TariffRead> {
    this.logger.log(`Updating tariff: ${id}`);
    try {
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new TariffNotFoundException(`Tariff with id ${id} was not found`);
      }

      const updated = await this.repository.update(id, {
        name: input.name,
        pricePerMinute: input.pricePerMinute,
        pricePerKm: input.pricePerKm,
        geoZoneId: input.geoZoneId,
      });
      return TariffMapper.fromEntityToRead(updated);
    } catch (error) {
      this.logger.error(`Failed to update tariff: ${id}`, error);
      throw TariffDbErrors.mapError(error);
    }
  }

  async delete(id: string): Promise<TariffRead> {
    this.logger.log(`Deleting tariff: ${id}`);
    try {
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new TariffNotFoundException(`Tariff with id ${id} was not found`);
      }
      if (existing.deletedAt !== null) {
        throw new TariffAlreadyDeletedException(
          `Tariff with id ${id} is already deleted`,
        );
      }
      const deleted = await this.repository.setDeletedAt(id, new Date());
      return TariffMapper.fromEntityToRead(deleted);
    } catch (error) {
      this.logger.error(`Failed to delete tariff: ${id}`, error);
      throw TariffDbErrors.mapError(error);
    }
  }
}
