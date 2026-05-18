import type {
  TariffCreateBody,
  TariffRead,
  TariffUpdateBody,
} from "@/entities/tariff";
import { BaseApiClient } from "@/shared/api";
import type { AccessTokenGetter } from "@/shared/api/base-api-client";
import { optionalQuery } from "@/shared/api/optional-query";

export type TariffListQuery = {
  includeDeleted?: boolean;
};

export class TariffsApi extends BaseApiClient {
  constructor(baseUrl: string, getAccessToken: AccessTokenGetter) {
    super(baseUrl, getAccessToken);
  }

  findAll(query: TariffListQuery = {}): Promise<TariffRead[]> {
    return this.getJson<TariffRead[]>(
      `/tariffs${optionalQuery({
        includeDeleted:
          query.includeDeleted === undefined
            ? undefined
            : String(query.includeDeleted),
      })}`,
    );
  }

  findById(id: string): Promise<TariffRead> {
    return this.getJson<TariffRead>(`/tariffs/${encodeURIComponent(id)}`);
  }

  create(body: TariffCreateBody): Promise<TariffRead> {
    return this.postJson<TariffRead>("/tariffs", body);
  }

  update(id: string, body: TariffUpdateBody): Promise<TariffRead> {
    return this.patchJson<TariffRead>(
      `/tariffs/${encodeURIComponent(id)}`,
      body,
    );
  }

  delete(id: string): Promise<TariffRead> {
    return this.deleteJson<TariffRead>(`/tariffs/${encodeURIComponent(id)}`);
  }
}
