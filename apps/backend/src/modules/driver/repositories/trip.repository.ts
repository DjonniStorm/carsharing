import {
  CreateTripInput,
  TripEntity,
  UpdateTripInput,
} from '../../../shared/types/repository.types';

export interface TripRepository {
  findById(id: number): Promise<TripEntity | null>;
  findByDriverId(driverId: number): Promise<TripEntity[]>;
  create(data: CreateTripInput): Promise<TripEntity>;
  update(id: number, data: UpdateTripInput): Promise<TripEntity>;
}
