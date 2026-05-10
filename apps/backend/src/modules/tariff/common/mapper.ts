import type { TariffPreset } from '@prisma/client';

import { TariffRead } from '../entities/dtos/tariff.read';
import { TariffPresetEntity } from '../entities/tariff.entity';

export class TariffMapper {
  static fromEntityToRead(entity: TariffPresetEntity): TariffRead {
    const read = new TariffRead();
    read.id = entity.id;
    read.name = entity.name;
    read.pricePerMinute = entity.pricePerMinute;
    read.pricePerKm = entity.pricePerKm;
    read.pausePricePerMinute = entity.pausePricePerMinute;
    read.isDefault = entity.isDefault;
    read.isDeleted = entity.isDeleted;
    read.createdAt = entity.createdAt;
    read.updatedAt = entity.updatedAt;
    return read;
  }

  static fromDbToEntity(row: TariffPreset): TariffPresetEntity {
    return new TariffPresetEntity(
      row.id,
      row.name,
      row.pricePerMinute.toNumber(),
      row.pricePerKm.toNumber(),
      row.pausePricePerMinute.toNumber(),
      row.isDefault,
      row.isDeleted,
      row.createdAt,
      row.updatedAt,
    );
  }
}
