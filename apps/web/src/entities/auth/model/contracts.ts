import type { UserRole } from '@/entities/user/model/user-role'

/** Тело `POST /auth/login`. */
export type LoginRequestBody = {
  login: string
  password: string
}

/** Ответ `POST /auth/login`. */
export type LoginResponseBody = {
  access_token: string
}

/** Полезная нагрузка JWT (как на бэкенде `JwtPayload`). */
export type JwtPayload = {
  sub: string
  role: UserRole
  email?: string
}

/** Пользователь из JWT после входа. */
export type AuthenticatedUser = {
  id: string
  role: UserRole
  email?: string
}

/** Тело `POST /auth/register` (`RegisterDto`). */
export type PublicRegisterBody = {
  name: string
  email: string
  phone: string
  password: string
  /** Учитывается на бэкенде только при `OPEN_MANAGER_SELF_REGISTER=true`. */
  role?: UserRole
}

export type CreateUserRequestBody = {
  name: string
  email: string
  phone: string
  password: string
  role: UserRole
}
