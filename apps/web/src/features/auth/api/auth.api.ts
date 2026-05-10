import type {
  LoginRequestBody,
  LoginResponseBody,
  PublicRegisterBody,
} from "@/entities/auth";
import {
  BaseApiClient,
  HttpApiError,
  type AccessTokenGetter,
} from "@/shared/api";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";

export type AuthSessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: number;
  isActive?: boolean;
  isDeleted?: boolean;
};

export class AuthApi extends BaseApiClient {
  constructor(baseUrl: string, getAccessToken?: AccessTokenGetter) {
    super(baseUrl, getAccessToken);
  }

  /** Проверка сессии: пользователь есть в БД и активен (`GET /auth/me`). */
  getMe(): Promise<AuthSessionUser> {
    return this.getJson<AuthSessionUser>("/auth/me");
  }

  /** Смена отображаемого имени (`PATCH /auth/me`). */
  patchMe(body: { name: string }): Promise<AuthSessionUser> {
    return this.patchJson<AuthSessionUser>("/auth/me", body);
  }

  login(body: LoginRequestBody): Promise<LoginResponseBody> {
    return this.postJson<LoginResponseBody>("/auth/login", body, {
      bearer: false,
    }).catch((err: unknown) => {
      if (err instanceof HttpApiError && err.status === 401) {
        throw new HttpApiError(translate(LANG_KEYS.api.loginUnauthorized), 401);
      }
      throw err;
    });
  }

  /** Публичная регистрация (`POST /auth/register`). Ответ как у логина — JWT. */
  register(body: PublicRegisterBody): Promise<LoginResponseBody> {
    const payload: PublicRegisterBody = { ...body };
    if (payload.role === undefined) {
      delete payload.role;
    }
    return this.postJson<LoginResponseBody>("/auth/register", payload, {
      bearer: false,
    }).catch((err: unknown) => {
      if (err instanceof HttpApiError && err.status === 409) {
        throw new HttpApiError(
          err.message || translate(LANG_KEYS.api.registerConflictFallback),
          409,
        );
      }
      if (err instanceof HttpApiError && err.status === 400) {
        throw new HttpApiError(
          err.message || translate(LANG_KEYS.api.registerBadRequestFallback),
          400,
        );
      }
      throw err;
    });
  }
}
