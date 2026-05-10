import type { UserRole } from 'src/modules/user/entities/user.role';
import type {
  TripHistoryRead,
  TripHistoryShortInfoRead,
} from '../entities/dtos/trip.history.read';
import { TripCreate } from '../entities/dtos/trip.create';
import { TripRead } from '../entities/dtos/trip.read';
import { TripUpdate } from '../entities/dtos/trip.update';
import {
  TripFindByIdOptions,
  TripListParams,
} from '../entities/trip-query.types';

export interface ITripService {
  findMany(params?: TripListParams): Promise<TripRead[]>;

  findById(id: string, options?: TripFindByIdOptions): Promise<TripRead>;

  create(input: TripCreate): Promise<TripRead>;

  update(id: string, input: TripUpdate): Promise<TripRead>;

  /** Для роли DRIVER проверяет, что поездка принадлежит пользователю. */
  ensureTripAccessForUser(
    role: UserRole,
    userId: string,
    tripId: string,
  ): Promise<void>;

  /** История поездок (сырой SQL в репозитории). */
  getTripHistoryShortInfoList(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<TripHistoryShortInfoRead[]>;

  getTripHistoryShortInfo(tripId: string): Promise<TripHistoryShortInfoRead>;

  getTripHistoryFullInfo(tripId: string): Promise<TripHistoryRead>;
}
