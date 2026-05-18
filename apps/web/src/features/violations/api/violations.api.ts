import type {
  ViolationCreateBody,
  ViolationRead,
  ViolationUpdateStatusBody,
  ViolationStatus,
} from "@/entities/violation";
import { BaseApiClient } from "@/shared/api";
import type { AccessTokenGetter } from "@/shared/api/base-api-client";
import { optionalQuery } from "@/shared/api/optional-query";

export type ViolationListQuery = {
  status?: ViolationStatus;
  includeResolved?: boolean;
};

export class ViolationsApi extends BaseApiClient {
  constructor(baseUrl: string, getAccessToken: AccessTokenGetter) {
    super(baseUrl, getAccessToken);
  }

  findAll(query: ViolationListQuery = {}): Promise<ViolationRead[]> {
    return this.getJson<ViolationRead[]>(
      `/violations${optionalQuery({
        status: query.status !== undefined ? String(query.status) : undefined,
        includeResolved:
          query.includeResolved === undefined
            ? undefined
            : String(query.includeResolved),
      })}`,
    );
  }

  findByTripId(tripId: string): Promise<ViolationRead[]> {
    return this.getJson<ViolationRead[]>(
      `/violations/trip/${encodeURIComponent(tripId)}`,
    );
  }

  findById(id: string): Promise<ViolationRead> {
    return this.getJson<ViolationRead>(`/violations/${encodeURIComponent(id)}`);
  }

  create(body: ViolationCreateBody): Promise<ViolationRead> {
    return this.postJson<ViolationRead>("/violations", body);
  }

  updateStatus(
    id: string,
    body: ViolationUpdateStatusBody,
  ): Promise<ViolationRead> {
    return this.patchJson<ViolationRead>(
      `/violations/${encodeURIComponent(id)}/status`,
      body,
    );
  }

  resolve(id: string): Promise<ViolationRead> {
    return this.postJson<ViolationRead>(
      `/violations/${encodeURIComponent(id)}/resolve`,
      {},
    );
  }
}
