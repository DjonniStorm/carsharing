import { HttpApiError } from "@/shared/api/http-api-error";
import { pickMessageFromResponse } from "@/shared/api/message-from-response-body";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";

export type AccessTokenGetter = () => string | null | undefined;

export type JsonRequestOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
  bearer?: boolean;
};

export class BaseApiClient {
  constructor(
    protected readonly baseUrl: string,
    protected readonly getAccessToken?: AccessTokenGetter,
  ) {}

  protected resolveUrl(path: string): string {
    const base = this.baseUrl.replace(/\/$/, "");
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${base}${p}`;
  }

  protected async parseJsonBody(res: Response): Promise<unknown> {
    const text = await res.text();
    if (!text) {
      return undefined;
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return undefined;
    }
  }

  async requestJson<T>(
    path: string,
    init: JsonRequestOptions = {},
  ): Promise<T> {
    const { json, bearer = true, headers: initHeaders, ...rest } = init;
    const headers = new Headers(initHeaders);

    if (json !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    if (bearer && this.getAccessToken) {
      const token = this.getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const res = await fetch(this.resolveUrl(path), {
      ...rest,
      headers,
      body: json === undefined ? undefined : JSON.stringify(json),
    });

    const data = await this.parseJsonBody(res);

    if (!res.ok) {
      throw new HttpApiError(
        pickMessageFromResponse(
          data,
          translate(LANG_KEYS.api.requestFailedWithStatus, {
            status: res.status,
          }),
        ),
        res.status,
      );
    }

    return data as T;
  }

  getJson<T>(path: string, init?: JsonRequestOptions): Promise<T> {
    return this.requestJson<T>(path, { ...init, method: "GET" });
  }

  postJson<T>(
    path: string,
    json: unknown,
    init?: JsonRequestOptions,
  ): Promise<T> {
    return this.requestJson<T>(path, { ...init, method: "POST", json });
  }

  patchJson<T>(
    path: string,
    json: unknown,
    init?: JsonRequestOptions,
  ): Promise<T> {
    return this.requestJson<T>(path, { ...init, method: "PATCH", json });
  }

  deleteJson<T>(path: string, init?: JsonRequestOptions): Promise<T> {
    return this.requestJson<T>(path, { ...init, method: "DELETE" });
  }
}
