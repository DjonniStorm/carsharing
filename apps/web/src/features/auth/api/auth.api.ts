import type {
  LoginRequestBody,
  LoginResponseBody,
  PublicRegisterBody,
} from '@/entities/auth'
import { BaseApiClient, HttpApiError } from '@/shared/api'
import { LANG_KEYS } from '@/shared/i18n/keys'
import { translate } from '@/shared/i18n/translate'

export class AuthApi extends BaseApiClient {
  constructor(baseUrl: string) {
    super(baseUrl)
  }

  login(body: LoginRequestBody): Promise<LoginResponseBody> {
    return this.postJson<LoginResponseBody>('/auth/login', body, { bearer: false }).catch(
      (err: unknown) => {
        if (err instanceof HttpApiError && err.status === 401) {
          throw new HttpApiError(translate(LANG_KEYS.api.loginUnauthorized), 401)
        }
        throw err
      },
    )
  }

  /** Публичная регистрация (`POST /auth/register`). Ответ как у логина — JWT. */
  register(body: PublicRegisterBody): Promise<LoginResponseBody> {
    const payload: PublicRegisterBody = { ...body }
    if (payload.role === undefined) {
      delete payload.role
    }
    return this.postJson<LoginResponseBody>('/auth/register', payload, {
      bearer: false,
    }).catch((err: unknown) => {
      if (err instanceof HttpApiError && err.status === 409) {
        throw new HttpApiError(
          err.message || translate(LANG_KEYS.api.registerConflictFallback),
          409,
        )
      }
      if (err instanceof HttpApiError && err.status === 400) {
        throw new HttpApiError(
          err.message || translate(LANG_KEYS.api.registerBadRequestFallback),
          400,
        )
      }
      throw err
    })
  }
}
