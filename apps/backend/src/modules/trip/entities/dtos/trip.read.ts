import { TripStatus } from '../trip.status';

/**
 * Поездка в ответах API (чтение). Вложенные объекты (пользователь, авто, версия тарифа) — когда сервис/репозиторий их подгрузит; сейчас в репозитории только скаляры поездки.
 */
export class TripRead {
  id: number;
  userId: string;
  carId: string;
  /** Версия тарифа (`geo_zone_version.id`). */
  tariffVersionId: string;

  status: TripStatus;

  startedAt: Date;
  finishedAt: Date | null;

  pauseStartedAt: Date | null;
  totalPausedSec: number;

  startLat: number | null;
  startLng: number | null;
  finishLat: number | null;
  finishLng: number | null;

  /** Наследие схемы: «сырая» дистанция/длительность в единицах, заведённых при создании поездки. */
  distance: number;
  duration: number;
  distanceMeters: number | null;

  chargedMinutes: number | null;
  chargedKm: number | null;

  priceTime: number | null;
  priceDistance: number | null;
  pricePause: number | null;
  priceTotal: number | null;

  createdAt: Date;
  updatedAt: Date;

  carPlateSnapshot: string | null;
  carDisplayNameSnapshot: string | null;
}
