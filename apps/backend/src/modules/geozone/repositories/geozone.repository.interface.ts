import type { GeoJSONMultiPolygon } from '../entities/geozone.geometry';
import type {
  GeozoneBoundingBoxParams,
  GeozoneContainingPointParams,
  GeozoneFindByIdOptions,
  GeozoneListParams,
  GeozoneVersionListFilters,
} from '../entities/geozone-query.types';
import type { GeozoneVersionRead } from '../entities/dtos/geozone-version.read';
import type { GeozoneRead } from '../entities/dtos/geozone.read';

/** Доступ к `GeoZone` / `GeoZoneVersion` и пространственным запросам PostGIS. */
export interface IGeozoneRepository {
  /** Список зон с фильтрами и пагинацией. */
  findMany(params?: GeozoneListParams): Promise<GeozoneRead[]>;

  /** Пакетная загрузка зон по id (например после spatial-запроса). */
  findByIds(
    zoneIds: string[],
    withCurrentVersion: boolean,
  ): Promise<GeozoneRead[]>;

  /** Одна зона по id или `null`. */
  findById(
    id: string,
    options?: GeozoneFindByIdOptions,
  ): Promise<GeozoneRead | null>;

  /** Транзакция: строка `geo_zone`, первая версия с геометрией, выставление `current_version_id`. */
  createWithInitialVersion(input: {
    name: string;
    type: string;
    color: string;
    createdByUserId: string;
    geometry: GeoJSONMultiPolygon;
    rules: Record<string, unknown> | null | undefined;
    pricePerMinute: number;
    pricePerKm: number;
    pausePricePerMinute: number;
  }): Promise<GeozoneRead>;

  /** Патч полей зоны; если зоны нет — `GeozoneNotFoundException`. */
  updateZone(
    id: string,
    patch: Partial<{ name: string; type: string; color: string }>,
  ): Promise<GeozoneRead>;

  /** Софт-удаление / восстановление через `deleted_at`. */
  setDeletedAt(id: string, deletedAt: Date | null): Promise<GeozoneRead>;

  /** Закрыть текущую версию (`disabled_at`), вставить новую, обновить `current_version_id`. */
  publishNewVersion(
    geozoneId: string,
    input: {
      geometry: GeoJSONMultiPolygon;
      rules: Record<string, unknown> | null | undefined;
      pricePerMinute: number;
      pricePerKm: number;
      pausePricePerMinute: number;
    },
  ): Promise<GeozoneRead>;

  /** Версии одной зоны с учётом фильтра по `disabled_at`. */
  findVersions(
    geozoneId: string,
    filters?: GeozoneVersionListFilters,
  ): Promise<GeozoneVersionRead[]>;

  /** Одна версия по id или `null`. */
  findVersionById(versionId: string): Promise<GeozoneVersionRead | null>;

  /** Id зон, у которых текущая геометрия пересекает прямоугольник (WGS 84). */
  findIdsInBoundingBox(params: GeozoneBoundingBoxParams): Promise<string[]>;

  /** Id зон, внутри текущей геометрии которых лежит точка. */
  findIdsContainingPoint(
    params: GeozoneContainingPointParams,
  ): Promise<string[]>;
}

export const IGeozoneRepositoryToken = Symbol('IGeozoneRepository');
