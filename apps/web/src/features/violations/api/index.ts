import { getApiBaseUrl } from "@/shared/config/env";
import { getStoredAccessToken } from "@/shared/api/get-stored-access-token";

import { ViolationsApi } from "./violations.api";

export const violationsApi = new ViolationsApi(
  getApiBaseUrl(),
  getStoredAccessToken,
);

export type { ViolationListQuery } from "./violations.api";
