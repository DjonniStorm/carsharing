import type {
  TripFindByIdOptions,
  TripListParams,
} from '../entities/trip-query.types';
import type { TripStatus } from '../entities/trip.status';
import { TripEntity } from '../entities/trip.entity';

export type TripRepositoryCreateInput = {
  userId: string;
  carId: string;
  tariffVersionId: string;
  status?: TripStatus;
  startedAt?: Date;
  distance?: number;
  duration?: number;
  startLat?: number | null;
  startLng?: number | null;
  carPlateSnapshot?: string | null;
  carDisplayNameSnapshot?: string | null;
};

export type TripRepositoryUpdatePatch = Partial<{
  status: TripStatus;
  finishedAt: Date | null;
  pauseStartedAt: Date | null;
  totalPausedSec: number;
  startLat: number | null;
  startLng: number | null;
  finishLat: number | null;
  finishLng: number | null;
  distance: number;
  duration: number;
  distanceMeters: number | null;
  chargedMinutes: number | null;
  chargedKm: number | null;
  priceTime: number | null;
  priceDistance: number | null;
  pricePause: number | null;
  priceTotal: number | null;
  /** Смена версии тарифа (редко); `null` в домене не допускается — поле в БД NOT NULL. */
  tariffVersionId?: string;
  carPlateSnapshot: string | null;
  carDisplayNameSnapshot: string | null;
}>;

export interface ITripRepository {
  findMany(params?: TripListParams): Promise<TripEntity[]>;

  findById(
    id: number,
    options?: TripFindByIdOptions,
  ): Promise<TripEntity | null>;

  create(input: TripRepositoryCreateInput): Promise<TripEntity>;

  update(id: number, patch: TripRepositoryUpdatePatch): Promise<TripEntity>;
}

export const ITripRepositoryToken = Symbol('ITripRepository');
