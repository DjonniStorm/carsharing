import { Injectable } from '@nestjs/common';

import { TariffMapper } from '../common/mapper';
import type { TariffListParams } from '../entities/tariff-query.types';
import { TariffPresetEntity } from '../entities/tariff.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import { ITariffRepository } from './tariff.repository.interface';

@Injectable()
export class TariffRepository implements ITariffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params?: TariffListParams): Promise<TariffPresetEntity[]> {
    const listParams = params ?? {};
    const rows = await this.prisma.tariffPreset.findMany({
      where: {
        ...(listParams.includeDeleted ? {} : { isDeleted: false }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(TariffMapper.fromDbToEntity);
  }

  async findById(id: string): Promise<TariffPresetEntity | null> {
    const row = await this.prisma.tariffPreset.findUnique({ where: { id } });
    if (!row) {
      return null;
    }
    return TariffMapper.fromDbToEntity(row);
  }

  async findActiveById(id: string): Promise<TariffPresetEntity | null> {
    const row = await this.prisma.tariffPreset.findFirst({
      where: { id, isDeleted: false },
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
    pausePricePerMinute: number;
    isDefault: boolean;
  }): Promise<TariffPresetEntity> {
    const row = await this.prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.tariffPreset.updateMany({
          data: { isDefault: false },
          where: { isDefault: true },
        });
      }
      return tx.tariffPreset.create({
        data: {
          name: input.name,
          pricePerMinute: input.pricePerMinute,
          pricePerKm: input.pricePerKm,
          pausePricePerMinute: input.pausePricePerMinute,
          isDefault: input.isDefault,
          isDeleted: false,
        },
      });
    });
    return TariffMapper.fromDbToEntity(row);
  }

  async update(
    id: string,
    patch: Partial<{
      name: string;
      pricePerMinute: number;
      pricePerKm: number;
      pausePricePerMinute: number;
      isDefault: boolean;
      isDeleted: boolean;
    }>,
  ): Promise<TariffPresetEntity> {
    const row = await this.prisma.$transaction(async (tx) => {
      if (patch.isDefault === true) {
        await tx.tariffPreset.updateMany({
          data: { isDefault: false },
          where: { isDefault: true, id: { not: id } },
        });
      }
      return tx.tariffPreset.update({
        where: { id },
        data: patch,
      });
    });
    return TariffMapper.fromDbToEntity(row);
  }
}
