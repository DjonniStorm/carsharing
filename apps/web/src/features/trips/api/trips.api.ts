import type {
  TripCreateBody,
  TripRead,
  TripUpdateBody,
  TripStatus,
} from "@/entities/trip";
import { BaseApiClient } from "@/shared/api";
import type { AccessTokenGetter } from "@/shared/api/base-api-client";

function optionalQuery(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") {
      sp.set(k, v);
    }
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export type TripListQuery = {
  userId?: string;
  carId?: string;
  tariffVersionId?: string;
  status?: TripStatus;
  startedAfter?: string;
  startedBefore?: string;
};

export type TripByIdQuery = {
  withUser?: boolean;
  withCar?: boolean;
  withTariffVersion?: boolean;
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

  findById(id: string, query: TripByIdQuery = {}): Promise<TripRead> {
    return this.getJson<TripRead>(
      `/trips/${encodeURIComponent(id)}${optionalQuery({
        withUser: query.withUser === true ? "true" : undefined,
        withCar: query.withCar === true ? "true" : undefined,
        withTariffVersion:
          query.withTariffVersion === true ? "true" : undefined,
      })}`,
    );
  }

  create(body: TripCreateBody): Promise<TripRead> {
    return this.postJson<TripRead>("/trips", body);
  }

  update(id: string, body: TripUpdateBody): Promise<TripRead> {
    return this.patchJson<TripRead>(`/trips/${encodeURIComponent(id)}`, body);
  }
}
