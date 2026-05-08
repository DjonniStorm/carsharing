import type { AuthenticatedUser } from 'src/modules/auth/types/authenticated-user';

import { TelemetryCreate } from '../entities/dto/telemetry.create';
import { TelemetryRead } from '../entities/dto/telemetry.read';

export interface ITelemetryController {
  create(user: AuthenticatedUser, input: TelemetryCreate): Promise<TelemetryRead>;

  findById(user: AuthenticatedUser, id: string): Promise<TelemetryRead>;

  findManyByTripId(
    user: AuthenticatedUser,
    tripId: string,
    timeFrom?: string,
    timeTo?: string,
    limit?: string,
    offset?: string,
    sort?: 'asc' | 'desc',
  ): Promise<TelemetryRead[]>;
}
