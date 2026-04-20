import type { GeozoneRead } from '../../../geozone/entities/dtos/geozone.read';

/**
 * Тариф в ответах API (чтение).
 * `geoZone` заполняется, если репозиторий/сервис запросили с `withGeoZone` (см. `TariffFindByIdOptions`).
 */
export class TariffRead {
  id: string;
  name: string;
  pricePerMinute: number;
  pricePerKm: number;
  geoZoneId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  /** Подгруженная стабильная часть зоны (без геометрии версии), опционально. */
  geoZone?: GeozoneRead;
}
