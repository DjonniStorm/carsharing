import { getApiBaseUrl } from "@/shared/config/env";
import { getStoredAccessToken } from "@/shared/api/get-stored-access-token";

import { CarsApi } from "./cars.api";

export const carsApi = new CarsApi(getApiBaseUrl(), getStoredAccessToken);

export { CarsApi } from "./cars.api";
