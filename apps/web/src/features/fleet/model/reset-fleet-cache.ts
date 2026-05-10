import { action } from "@reatom/core";

import { resetCarsListState } from "@/features/cars/model/cars-list";
import { resetLiveCarPositions } from "@/features/trip-realtime/model/live-car-positions";
import {
  resetDashboardGeozonesState,
  resetGeozonesCatalogState,
} from "@/features/geozones/model/geozones-state";
import { resetViolationsAdminListState } from "@/features/violations/model/violations-state";

export const resetFleetCaches = action(() => {
  resetLiveCarPositions();
  resetCarsListState();
  resetDashboardGeozonesState();
  resetGeozonesCatalogState();
  resetViolationsAdminListState();
}, "resetFleetCaches");
