import type { AuthenticatedUser } from 'src/modules/auth/types/authenticated-user';

import { TripCreate } from '../entities/dtos/trip.create';
import { TripRead } from '../entities/dtos/trip.read';
import { TripUpdate } from '../entities/dtos/trip.update';

export interface ITripController {
  findAll(
    user: AuthenticatedUser,
    userId?: string,
    carId?: string,
    tariffVersionId?: string,
    status?: string,
    startedAfter?: string,
    startedBefore?: string,
  ): Promise<TripRead[]>;

  findById(
    user: AuthenticatedUser,
    id: string,
    withUser?: string,
    withCar?: string,
    withTariffVersion?: string,
  ): Promise<TripRead>;

  create(user: AuthenticatedUser, input: TripCreate): Promise<TripRead>;

  update(
    user: AuthenticatedUser,
    id: string,
    input: TripUpdate,
  ): Promise<TripRead>;
}
