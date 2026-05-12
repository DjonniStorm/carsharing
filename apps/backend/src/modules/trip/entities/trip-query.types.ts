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

/** Фильтры списка короткой истории (`GET /trip-history`). */
export type TripHistoryShortListOptions = {
  limit?: number;
  offset?: number;
  startedAfter?: Date;
  startedBefore?: Date;
  /** Только поездки с `end_time`; сравнение `end_time >= …`. */
  finishedAfter?: Date;
  /** Только поездки с `end_time`; сравнение `end_time <= …`. */
  finishedBefore?: Date;
};
