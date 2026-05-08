import { BaseEntity } from 'src/shared/types/entities/base-entity';
import { TripStatus } from './trip.status';

export class TripEntity extends BaseEntity<string> {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly carId: string,
    /** Версия тарифа: FK на `geo_zone_version.id` (ставки на момент старта). */
    public readonly tariffVersionId: string,

    public readonly status: TripStatus,

    public readonly startedAt: Date,
    public readonly finishedAt: Date | null,

    public readonly pauseStartedAt: Date | null,
    public readonly totalPausedSec: number,

    public readonly startLat: number | null,
    public readonly startLng: number | null,

    public readonly finishLat: number | null,
    public readonly finishLng: number | null,

    /** Наследие схемы (единицы — как в домене старта поездки). */
    public readonly distance: number,
    public readonly duration: number,
    public readonly distanceMeters: number | null,

    public readonly chargedMinutes: number | null,
    public readonly chargedKm: number | null,

    public readonly priceTime: number | null,
    public readonly priceDistance: number | null,
    public readonly pricePause: number | null,
    public readonly priceTotal: number | null,

    public readonly createdAt: Date,
    public readonly updatedAt: Date,

    public readonly carPlateSnapshot: string | null,
    public readonly carDisplayNameSnapshot: string | null,
  ) {
    super(id);
  }
}
