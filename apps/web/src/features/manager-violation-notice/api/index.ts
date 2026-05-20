import { getApiBaseUrl } from "@/shared/config/env";
import { getStoredAccessToken } from "@/shared/api/get-stored-access-token";

import { ManagerViolationNoticeApi } from "./manager-violation-notice.api";

export const managerViolationNoticeApi = new ManagerViolationNoticeApi(
  getApiBaseUrl(),
  getStoredAccessToken,
);
