import { GeozoneVersionCreate } from '../entities/dtos/geozone-version.create';
import { GeozoneVersionRead } from '../entities/dtos/geozone-version.read';
import { GeozoneCreate } from '../entities/dtos/geozone.create';
import { GeozoneRead } from '../entities/dtos/geozone.read';
import { GeozoneUpdate } from '../entities/dtos/geozone.update';
import type {
  GeozoneBoundingBoxParams,
  GeozoneContainingPointParams,
  GeozoneFindByIdOptions,
  GeozoneListParams,
  GeozoneVersionListFilters,
} from '../entities/geozone-query.types';

export type {
  GeozoneBoundingBoxParams,
  GeozoneContainingPointParams,
  GeozoneFindByIdOptions,
  GeozoneListFilters,
  GeozoneListParams,
  GeozoneVersionListFilters,
} from '../entities/geozone-query.types';

/** Прикладной сервис геозон (стабильная сущность + версии геометрии). */
export interface IGeozoneService {
  /** Создаёт зону и первую версию; требуется `createdByUserId` в DTO или из контекста. */
  create(geozone: GeozoneCreate): Promise<GeozoneRead>;

  /** Обновляет имя / тип / цвет без смены геометрии. */
  update(id: string, geozone: GeozoneUpdate): Promise<GeozoneRead>;

  /** Софт-удаление (`deleted_at`). */
  softDelete(id: string): Promise<GeozoneRead>;

  /** Сброс софт-удаления. */
  restore(id: string): Promise<GeozoneRead>;

  /** Чтение зоны по id; записи нет — исключение. */
  findById(
    id: string,
    options?: GeozoneFindByIdOptions,
  ): Promise<GeozoneRead>;

  /** Список зон с фильтрами и пагинацией. */
  findAll(params?: GeozoneListParams): Promise<GeozoneRead[]>;

  /** Новая версия геометрии и правил; предыдущая текущая закрывается. */
  publishVersion(
    geozoneId: string,
    version: GeozoneVersionCreate,
  ): Promise<GeozoneRead>;

  /** История версий одной зоны; зоны нет — исключение. */
  findVersions(
    geozoneId: string,
    filters?: GeozoneVersionListFilters,
  ): Promise<GeozoneVersionRead[]>;

  /** Одна версия по id; записи нет — исключение. */
  findVersionById(versionId: string): Promise<GeozoneVersionRead>;

  /** Зоны, текущая геометрия которых пересекает прямоугольник карты. */
  findInBoundingBox(params: GeozoneBoundingBoxParams): Promise<GeozoneRead[]>;

  /** Зоны, внутри текущей геометрии которых лежит точка. */
  findContainingPoint(
    params: GeozoneContainingPointParams,
  ): Promise<GeozoneRead[]>;
}
