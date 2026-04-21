import { TelemetryCreate } from '../entities/dto/telemetry.create';
import { TelemetryEntity } from '../entities/telemetry.entity';

export interface ITelemetryRepository {
  create(input: TelemetryCreate): Promise<TelemetryEntity>;
  findManyByTripId(
    tripId: string,
    timeFrom?: Date,
    timeTo?: Date,
    limit?: number,
    offset?: number,
    sort?: 'asc' | 'desc',
  ): Promise<TelemetryEntity[]>;
  findById(id: string): Promise<TelemetryEntity | null>;
}

export const ITelemetryRepositoryToken = Symbol('ITelemetryRepository');
