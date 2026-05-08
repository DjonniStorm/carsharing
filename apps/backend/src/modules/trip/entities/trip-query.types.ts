import type { TripStatus } from './trip.status';

/**
 * Опции чтения одной поездки из хранилища (жадные связи).
 * Поездка не ссылается на строку `tariff` — только на `tariffVersion` (геоверсия).
 */
export type TripFindByIdOptions = {
  withUser?: boolean;
  withCar?: boolean;
  /** Версия тарифа (`GeoZoneVersion`), FK `trip.tariff_version_id`. */
  withTariffVersion?: boolean;
};

/**
 * Фильтры списка поездок (пагинацию добавляй отдельно в сервисе/контроллере).
 */
export type TripListParams = {
  userId?: string;
  carId?: string;
  tariffVersionId?: string;
  status?: TripStatus;
  startedAfter?: Date;
  startedBefore?: Date;
};
