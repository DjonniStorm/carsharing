import { action, atom } from "@reatom/core";

import type { AuthenticatedUser } from "@/entities/auth";
import type { AuthSessionUser } from "@/features/auth/api/auth.api";
import { ACCESS_TOKEN_STORAGE_KEY } from "@/shared/config/access-token-storage-key";
import { decodeJwtPayload } from "@/shared/lib/jwt/decode-jwt-payload";

import { resetFleetCaches } from "@/features/fleet/model/reset-fleet-cache";

export const accessTokenAtom = atom<string | null>(null, "accessToken");

export const authUserAtom = atom<AuthenticatedUser | null>(null, "authUser");

/** Профиль из `GET /auth/me` (имя для шапки и страницы профиля). */
export const sessionProfileAtom = atom<AuthSessionUser | null>(
  null,
  "sessionProfile",
);

export const setSessionProfile = action((user: AuthSessionUser | null) => {
  sessionProfileAtom.set(user);
}, "setSessionProfile");

export const applyAccessToken = action((token: string) => {
  accessTokenAtom.set(token);
  const payload = decodeJwtPayload(token);
  if (payload) {
    authUserAtom.set({
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    });
  }
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}, "applyAccessToken");

export const clearSession = action(() => {
  accessTokenAtom.set(null);
  authUserAtom.set(null);
  sessionProfileAtom.set(null);
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  resetFleetCaches();
}, "clearSession");

/** Восстановление сессии из `localStorage` при старте приложения. */
export const hydrateSessionFromStorage = action(() => {
  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (!token) {
    return;
  }
  accessTokenAtom.set(token);
  const payload = decodeJwtPayload(token);
  if (payload) {
    authUserAtom.set({
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    });
  }
}, "hydrateSessionFromStorage");
