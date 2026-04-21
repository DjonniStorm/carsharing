import { TripCreate } from '../entities/dtos/trip.create';
import { TripRead } from '../entities/dtos/trip.read';
import { TripUpdate } from '../entities/dtos/trip.update';
import {
  TripFindByIdOptions,
  TripListParams,
} from '../entities/trip-query.types';

export interface ITripService {
  findMany(params?: TripListParams): Promise<TripRead[]>;

  findById(id: number, options?: TripFindByIdOptions): Promise<TripRead>;

  create(input: TripCreate): Promise<TripRead>;

  update(id: number, input: TripUpdate): Promise<TripRead>;
}
