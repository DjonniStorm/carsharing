import type {
  TripFindByIdOptions,
  TripHistoryShortListOptions,
  TripListParams,
} from '../entities/trip-query.types';
import type { TripStatus } from '../entities/trip.status';
import type {
  TripHistoryFullSqlRow,
  TripHistorySqlRow,
} from '../common/trip-history.types';
import { TripEntity } from '../entities/trip.entity';

export type TripRepositoryCreateInput = {
  userId: string;
  carId: string;
  geoZoneVersionId: string;
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
  geoZoneVersionId?: string;
  carPlateSnapshot: string | null;
  carDisplayNameSnapshot: string | null;
}>;

export interface ITripRepository {
  findMany(params?: TripListParams): Promise<TripEntity[]>;

  findById(
    id: string,
    options?: TripFindByIdOptions,
  ): Promise<TripEntity | null>;

  /** Активная поездка на машине (PENDING/STARTED/ACTIVE/PAUSED), для H11. */
  findActiveByCarId(
    carId: string,
    excludeTripId?: string,
  ): Promise<TripEntity | null>;

  create(input: TripRepositoryCreateInput): Promise<TripEntity>;

  /**
   * Атомарно: lock car => проверка ongoing => create trip => car IN_USE.
   * @throws TripCarAlreadyInUseException
   */
  createStartingTripWithCarLock(
    input: TripRepositoryCreateInput,
  ): Promise<TripEntity>;

  update(id: string, patch: TripRepositoryUpdatePatch): Promise<TripEntity>;

  /**
   * Перевод в FINISHED только если поездка ещё не FINISHED.
   * @returns applied — true, если этот вызов первым завершил поездку
   */
  transitionToFinishedIfNotFinished(
    id: string,
    patch: TripRepositoryUpdatePatch,
  ): Promise<{ entity: TripEntity; applied: boolean }>;

  /** Поездка + авто + агрегированные нарушения (один SQL). */
  findHistoryShortByUserId(
    userId: string,
    options?: TripHistoryShortListOptions,
  ): Promise<TripHistorySqlRow[]>;

  findHistoryShortByTripId(tripId: string): Promise<TripHistorySqlRow | null>;

  /** Поездка + авто + нарушения + телеметрия (один SQL). */
  findHistoryFullByTripId(
    tripId: string,
  ): Promise<TripHistoryFullSqlRow | null>;
}

export const ITripRepositoryToken = Symbol('ITripRepository');
