import { getApiBaseUrl } from "@/shared/config/env";
import { getStoredAccessToken } from "@/shared/api/get-stored-access-token";

import { TariffsApi } from "./tariffs.api";

export const tariffsApi = new TariffsApi(getApiBaseUrl(), getStoredAccessToken);

export type { TariffListQuery } from "./tariffs.api";
