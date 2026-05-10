import type { TripStatus } from './trip.status';

/**
 * Опции чтения одной поездки из хранилища (жадные связи).
 * Поездка ссылается на версию геозоны (`GeoZoneVersion`).
 */
export type TripFindByIdOptions = {
  withUser?: boolean;
  withCar?: boolean;
  /** Версия геозоны (`GeoZoneVersion`), FK `trip.geo_zone_version_id`. */
  withGeoZoneVersion?: boolean;
};

/**
 * Фильтры списка поездок (пагинацию добавляй отдельно в сервисе/контроллере).
 */
export type TripListParams = {
  userId?: string;
  carId?: string;
  geoZoneVersionId?: string;
  status?: TripStatus;
  startedAfter?: Date;
  startedBefore?: Date;
};
