import type {
  CarCreateBody,
  CarRead,
  CarUpdateBody,
  UpdatePositionBody,
} from "@/entities/car";
import { BaseApiClient } from "@/shared/api";
import type { AccessTokenGetter } from "@/shared/api/base-api-client";
import { optionalQuery } from "@/shared/api/optional-query";

export class CarsApi extends BaseApiClient {
  constructor(baseUrl: string, getAccessToken: AccessTokenGetter) {
    super(baseUrl, getAccessToken);
  }

  findAll(includeDeleted = false): Promise<CarRead[]> {
    return this.getJson<CarRead[]>(
      `/cars${optionalQuery({ includeDeleted: String(includeDeleted) })}`,
    );
  }

  findById(id: string): Promise<CarRead> {
    return this.getJson<CarRead>(`/cars/${encodeURIComponent(id)}`);
  }

  findByLicensePlate(licensePlate: string): Promise<CarRead> {
    return this.getJson<CarRead>(
      `/cars/license-plate/${encodeURIComponent(licensePlate)}`,
    );
  }

  create(body: CarCreateBody): Promise<CarRead> {
    return this.postJson<CarRead>("/cars", body);
  }

  update(id: string, body: CarUpdateBody): Promise<CarRead> {
    return this.patchJson<CarRead>(`/cars/${encodeURIComponent(id)}`, body);
  }

  remove(id: string): Promise<CarRead> {
    return this.deleteJson<CarRead>(`/cars/${encodeURIComponent(id)}`);
  }

  restore(id: string): Promise<CarRead> {
    return this.postJson<CarRead>(
      `/cars/restore/${encodeURIComponent(id)}`,
      {},
    );
  }

  updatePosition(id: string, body: UpdatePositionBody): Promise<CarRead> {
    return this.postJson<CarRead>(
      `/cars/update-position/${encodeURIComponent(id)}`,
      body,
    );
  }
}
