import { action, atom } from '@reatom/core'

import type { AuthenticatedUser } from '@/entities/auth'
import { ACCESS_TOKEN_STORAGE_KEY } from '@/shared/config/access-token-storage-key'
import { decodeJwtPayload } from '@/shared/lib/jwt/decode-jwt-payload'

import { resetFleetCaches } from '@/features/fleet/model/reset-fleet-cache'

export const accessTokenAtom = atom<string | null>(null, 'accessToken')

export const authUserAtom = atom<AuthenticatedUser | null>(null, 'authUser')

export const applyAccessToken = action((token: string) => {
  accessTokenAtom.set(token)
  const payload = decodeJwtPayload(token)
  if (payload) {
    authUserAtom.set({
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    })
  }
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
}, 'applyAccessToken')

export const clearSession = action(() => {
  accessTokenAtom.set(null)
  authUserAtom.set(null)
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  resetFleetCaches()
}, 'clearSession')

/** Восстановление сессии из `localStorage` при старте приложения. */
export const hydrateSessionFromStorage = action(() => {
  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  if (!token) {
    return
  }
  accessTokenAtom.set(token)
  const payload = decodeJwtPayload(token)
  if (payload) {
    authUserAtom.set({
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    })
  }
}, 'hydrateSessionFromStorage')
