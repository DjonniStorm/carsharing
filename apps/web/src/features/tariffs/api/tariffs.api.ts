import type {
  TariffCreateBody,
  TariffRead,
  TariffUpdateBody,
} from "@/entities/tariff";
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
