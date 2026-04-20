import { Injectable } from '@nestjs/common';

import { TariffMapper } from '../common/mapper';
import type {
  TariffFindByIdOptions,
  TariffListParams,
} from '../entities/tariff-query.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { ITariffRepository } from './tariff.repository.interface';
import { TariffEntity } from '../entities/tariff.entity';

@Injectable()
export class TariffRepository implements ITariffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params?: TariffListParams): Promise<TariffEntity[]> {
    const listParams = params ?? {};
    const rows = await this.prisma.tariff.findMany({
      where: {
        ...(listParams.geoZoneId ? { geoZoneId: listParams.geoZoneId } : {}),
        ...(listParams.includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(TariffMapper.fromDbToEntity);
  }

  async findById(
    id: string,
    options?: TariffFindByIdOptions,
  ): Promise<TariffEntity | null> {
    const row = await this.prisma.tariff.findUnique({
      where: { id },
      include: options?.withGeoZone ? { geoZone: true } : undefined,
    });
    if (!row) {
      return null;
    }
    return TariffMapper.fromDbToEntity(row);
  }

  async create(input: {
    name: string;
    pricePerMinute: number;
    pricePerKm: number;
    geoZoneId: string;
  }): Promise<TariffEntity> {
    const row = await this.prisma.tariff.create({
      data: {
        name: input.name,
        pricePerMinute: input.pricePerMinute,
        pricePerKm: input.pricePerKm,
        geoZoneId: input.geoZoneId,
      },
    });
    return TariffMapper.fromDbToEntity(row);
  }

  async update(
    id: string,
    patch: Partial<{
      name: string;
      pricePerMinute: number;
      pricePerKm: number;
      geoZoneId: string;
    }>,
  ): Promise<TariffEntity> {
    const row = await this.prisma.tariff.update({
      where: { id },
      data: patch,
    });
    return TariffMapper.fromDbToEntity(row);
  }

  async setDeletedAt(
    id: string,
    deletedAt: Date | null,
  ): Promise<TariffEntity> {
    const row = await this.prisma.tariff.update({
      where: { id },
      data: { deletedAt },
    });
    return TariffMapper.fromDbToEntity(row);
  }
}
