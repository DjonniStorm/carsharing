import { redirect } from "@tanstack/react-router";

import { UserRole } from "@/entities/user";
import { ACCESS_TOKEN_STORAGE_KEY } from "@/features/auth/config/token-storage";
import { authApi } from "@/features/auth/api";
import { forceLogoutClient } from "@/features/auth/lib/force-logout-client";
import { setSessionProfile } from "@/features/auth/model/session";
import { rootFrame } from "@/app/store";
import { HttpApiError } from "@/shared/api/http-api-error";
import { ROUTES } from "@/shared/config/routes-paths";

export const readAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
};

/** В `beforeLoad` у TanStack Router `location.search` — объект, не строка query. */
export const redirectPathFromLocation = (location: {
  pathname: string;
  search: Record<string, unknown>;
}): string => {
  const raw = location.search;
  const params = new URLSearchParams();
  if (raw && typeof raw === "object") {
    for (const key of Object.keys(raw)) {
      const val = raw[key];
      if (val === undefined || val === null) {
        continue;
      }
      if (Array.isArray(val)) {
        for (const item of val) {
          params.append(key, String(item));
        }
      } else {
        params.set(key, String(val));
      }
    }
  }
  const q = params.toString();
  if (!q) {
    return location.pathname;
  }
  return `${location.pathname}?${q}`;
};

export const ensureDashboardAuth = async (location: {
  pathname: string;
  search: Record<string, unknown>;
}) => {
  if (!readAccessToken()) {
    const redirectPath = redirectPathFromLocation(location);
    throw redirect({
      to: ROUTES.login,
      search: { redirect: redirectPath, reason: undefined },
    });
  }
  try {
    const me = await authApi.getMe();
    rootFrame.run(() => setSessionProfile(me));
    if (me.role === UserRole.DRIVER) {
      forceLogoutClient();
      throw redirect({
        to: ROUTES.login,
        search: { reason: "manager_only", redirect: undefined },
      });
    }
  } catch (e) {
    if (e instanceof HttpApiError && e.status === 401) {
      forceLogoutClient();
      throw redirect({
        to: ROUTES.error,
        search: { reason: "session" },
      });
    }
    if (e instanceof HttpApiError && e.status === 403) {
      forceLogoutClient();
      throw redirect({
        to: ROUTES.login,
        search: { reason: "manager_only", redirect: undefined },
      });
    }
    throw e;
  }
};
