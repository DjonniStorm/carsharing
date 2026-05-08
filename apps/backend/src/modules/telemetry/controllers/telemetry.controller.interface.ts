import { TelemetryCreate } from '../entities/dto/telemetry.create';
import { TelemetryRead } from '../entities/dto/telemetry.read';

export interface ITelemetryController {
  create(input: TelemetryCreate): Promise<TelemetryRead>;
  findById(id: string): Promise<TelemetryRead>;
  findManyByTripId(
    tripId: string,
    timeFrom?: string,
    timeTo?: string,
    limit?: string,
    offset?: string,
    sort?: 'asc' | 'desc',
  ): Promise<TelemetryRead[]>;
}

