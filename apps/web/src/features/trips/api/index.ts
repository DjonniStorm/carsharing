import { getApiBaseUrl } from "@/shared/config/env";
import { getStoredAccessToken } from "@/shared/api/get-stored-access-token";

import { TripHistoryApi } from "./trip-history.api";
import { TripsApi } from "./trips.api";

export const tripsApi = new TripsApi(getApiBaseUrl(), getStoredAccessToken);

export const tripHistoryApi = new TripHistoryApi(
  getApiBaseUrl(),
  getStoredAccessToken,
);

export type { TripListQuery } from "./trips.api";
export type { TripHistoryListQuery } from "./trip-history.api";
