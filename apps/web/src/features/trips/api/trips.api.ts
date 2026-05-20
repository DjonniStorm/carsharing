import type { TripRead, TripStatus } from "@/entities/trip";
import { BaseApiClient } from "@/shared/api";
import type { AccessTokenGetter } from "@/shared/api/base-api-client";
import { optionalQuery } from "@/shared/api/optional-query";

export type TripListQuery = {
  userId?: string;
  carId?: string;
  tariffVersionId?: string;
  status?: TripStatus;
  startedAfter?: string;
  startedBefore?: string;
};

export class TripsApi extends BaseApiClient {
  constructor(baseUrl: string, getAccessToken: AccessTokenGetter) {
    super(baseUrl, getAccessToken);
  }

  findAll(query: TripListQuery = {}): Promise<TripRead[]> {
    return this.getJson<TripRead[]>(
      `/trips${optionalQuery({
        userId: query.userId,
        carId: query.carId,
        tariffVersionId: query.tariffVersionId,
        status: query.status !== undefined ? String(query.status) : undefined,
        startedAfter: query.startedAfter,
        startedBefore: query.startedBefore,
      })}`,
    );
  }
}
