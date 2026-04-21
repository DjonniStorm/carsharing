import { TripCreate } from '../entities/dtos/trip.create';
import { TripRead } from '../entities/dtos/trip.read';
import { TripUpdate } from '../entities/dtos/trip.update';

export interface ITripController {
  findAll(
    userId?: string,
    carId?: string,
    tariffVersionId?: string,
    status?: string,
    startedAfter?: string,
    startedBefore?: string,
  ): Promise<TripRead[]>;

  findById(id: number): Promise<TripRead>;

  create(input: TripCreate): Promise<TripRead>;

  update(id: number, input: TripUpdate): Promise<TripRead>;
}
