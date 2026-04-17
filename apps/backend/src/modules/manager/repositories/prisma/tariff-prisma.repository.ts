import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CreateTariffInput,
  TariffEntity,
  UpdateTariffInput,
} from '../../../../shared/types/repository.types';
import { PrismaService } from '../../../../prisma/prisma.service';
import { TariffRepository } from '../tariff.repository';

@Injectable()
export class TariffPrismaRepository implements TariffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TariffEntity[]> {
    const tariffs = await this.prisma.tariff.findMany({
      where: { isDeleted: false },
      orderBy: { id: 'asc' },
    });
    return tariffs.map((item) => this.toTariffEntity(item));
  }

  async findById(id: number): Promise<TariffEntity | null> {
    const tariff = await this.prisma.tariff.findUnique({ where: { id } });
    if (!tariff || tariff.isDeleted) {
      return null;
    }
    return this.toTariffEntity(tariff);
  }

  async create(data: CreateTariffInput): Promise<TariffEntity> {
    const zoneId = await this.ensureZoneId();
    const created = await this.prisma.tariff.create({
      data: {
        name: data.name,
        pricePerMinute: data.pricePerMinute,
        pricePerKm: 1,
        geoZoneId: zoneId,
        isDeleted: false,
      },
    });
    return this.toTariffEntity(created);
  }

  async update(id: number, data: UpdateTariffInput): Promise<TariffEntity> {
    const updated = await this.prisma.tariff.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        pricePerMinute:
          data.pricePerMinute !== undefined
            ? new Prisma.Decimal(data.pricePerMinute)
            : undefined,
      },
    });
    return this.toTariffEntity(updated);
  }

  async softDelete(id: number): Promise<TariffEntity> {
    const updated = await this.prisma.tariff.update({
      where: { id },
      data: { isDeleted: true },
    });
    return this.toTariffEntity(updated, new Date());
  }

  async restore(id: number): Promise<TariffEntity> {
    const updated = await this.prisma.tariff.update({
      where: { id },
      data: { isDeleted: false },
    });
    return this.toTariffEntity(updated, null);
  }

  private toTariffEntity(
    tariff: {
      id: number;
      name: string;
      pricePerMinute: Prisma.Decimal;
      isDeleted: boolean;
    },
    deletedAtOverride?: Date | null,
  ): TariffEntity {
    return {
      id: tariff.id,
      name: tariff.name,
      pricePerMinute: Number(tariff.pricePerMinute),
      deletedAt:
        deletedAtOverride !== undefined
          ? deletedAtOverride
          : tariff.isDeleted
            ? new Date('1970-01-01T00:00:00.000Z')
            : null,
    };
  }

  private async ensureZoneId(): Promise<number> {
    const zone = await this.prisma.geoZone.findFirst();
    if (zone) {
      return zone.id;
    }
    const [zoneRow] = await this.prisma.$queryRaw<Array<{ id: number }>>`
      INSERT INTO geo_zone (name, type, polygon)
      VALUES ('Tariff zone', 'ALLOWED', ST_GeomFromText('POLYGON((0 0, 1 0, 1 1, 0 0))', 4326))
      RETURNING id
    `;
    return zoneRow.id;
  }
}
