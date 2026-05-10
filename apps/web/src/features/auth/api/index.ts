import { ACCESS_TOKEN_STORAGE_KEY } from "@/shared/config/access-token-storage-key";
import { getApiBaseUrl } from "@/shared/config/env";
import { getStoredAccessToken } from "@/shared/api/get-stored-access-token";

import { AuthApi } from "./auth.api";
import { UsersApi } from "./users.api";

export const authApi = new AuthApi(getApiBaseUrl(), getStoredAccessToken);

export const usersApi = new UsersApi(getApiBaseUrl(), () =>
  localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY),
);

export { AuthApi } from "./auth.api";
export type { AuthSessionUser } from "./auth.api";
export { UsersApi } from "./users.api";
