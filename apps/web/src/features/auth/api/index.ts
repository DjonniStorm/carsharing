import { ACCESS_TOKEN_STORAGE_KEY } from "@/shared/config/access-token-storage-key";
import { getApiBaseUrl } from "@/shared/config/env";

import { AuthApi } from "./auth.api";
import { UsersApi } from "./users.api";

export const authApi = new AuthApi(getApiBaseUrl());

export const usersApi = new UsersApi(getApiBaseUrl(), () =>
  localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY),
);

export { AuthApi } from "./auth.api";
export { UsersApi } from "./users.api";
