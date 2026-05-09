import type { CreateUserRequestBody } from "@/entities/auth";
import type { ReadUser } from "@/entities/user";
import type { AccessTokenGetter } from "@/shared/api";
import { BaseApiClient, HttpApiError } from "@/shared/api";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";

export class UsersApi extends BaseApiClient {
  constructor(baseUrl: string, getAccessToken: AccessTokenGetter) {
    super(baseUrl, getAccessToken);
  }

  createUser(body: CreateUserRequestBody): Promise<ReadUser> {
    const token = this.getAccessToken?.();
    if (!token) {
      return Promise.reject(
        new HttpApiError(translate(LANG_KEYS.api.createUserRequiresAuth), 401),
      );
    }

    return this.postJson<ReadUser>("/users", body).catch((err: unknown) => {
      if (
        err instanceof HttpApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        throw new HttpApiError(
          translate(LANG_KEYS.api.createUserManagerOnly),
          err.status,
        );
      }
      throw err;
    });
  }
}
