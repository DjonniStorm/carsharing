import type { GeoZone, Tariff } from '@prisma/client';

import { GeozoneRead } from '../../geozone/entities/dtos/geozone.read';
import { GeozoneType } from '../../geozone/entities/geozone.type';
import { TariffRead } from '../entities/dtos/tariff.read';
import { TariffEntity } from '../entities/tariff.entity';

export class TariffMapper {
  static fromEntityToRead(entity: TariffEntity): TariffRead {
    const read = new TariffRead();
    read.id = entity.id;
    read.name = entity.name;
    read.pricePerMinute = entity.pricePerMinute;
    read.pricePerKm = entity.pricePerKm;
    read.geoZoneId = entity.geoZoneId;
    read.createdAt = entity.createdAt;
    read.updatedAt = entity.updatedAt;
    read.deletedAt = entity.deletedAt;
    return read;
  }

  /**
   * Строка Prisma `Tariff` → DTO чтения.
   * Если в запросе был `include: { geoZone: true }`, в `row` будет `geoZone`.
   */
  static toTariffRead(row: Tariff & { geoZone?: GeoZone | null }): TariffRead {
    const read = new TariffRead();
    read.id = row.id;
    read.name = row.name;
    read.pricePerMinute = Number(row.pricePerMinute);
    read.pricePerKm = Number(row.pricePerKm);
    read.geoZoneId = row.geoZoneId;
    read.createdAt = row.createdAt;
    read.updatedAt = row.updatedAt;
    read.deletedAt = row.deletedAt;
    if (row.geoZone) {
      read.geoZone = TariffMapper.geoZoneRowToRead(row.geoZone);
    }
    return read;
  }

  /** Стабильные поля зоны (как в списке геозон без текущей версии геометрии). */
  static geoZoneRowToRead(zoneRow: GeoZone): GeozoneRead {
    return {
      id: zoneRow.id,
      name: zoneRow.name,
      type: zoneRow.type as GeozoneType,
      color: zoneRow.color,
      currentVersionId: zoneRow.currentVersionId,
      createdAt: zoneRow.createdAt,
      deletedAt: zoneRow.deletedAt,
      createdByUserId: zoneRow.createdByUserId,
    };
  }

  static fromDbToEntity(tariffRow: Tariff): TariffEntity {
    return new TariffEntity(
      tariffRow.id,
      tariffRow.name,
      tariffRow.pricePerMinute.toNumber(),
      tariffRow.pricePerKm.toNumber(),
      tariffRow.geoZoneId,
      tariffRow.createdAt,
      tariffRow.updatedAt,
      tariffRow.deletedAt,
    );
  }
}
