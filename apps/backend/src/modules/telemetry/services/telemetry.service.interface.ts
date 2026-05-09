import { TelemetryCreate } from '../entities/dto/telemetry.create';
import { TelemetryRead } from '../entities/dto/telemetry.read';

export interface ITelemetryService {
  create(input: TelemetryCreate): Promise<TelemetryRead>;
  findById(id: string): Promise<TelemetryRead>;
  findManyByTripId(
    tripId: string,
    timeFrom?: Date,
    timeTo?: Date,
    limit?: number,
    offset?: number,
    sort?: 'asc' | 'desc',
  ): Promise<TelemetryRead[]>;
}

export const ITelemetryServiceToken = Symbol('ITelemetryService');
