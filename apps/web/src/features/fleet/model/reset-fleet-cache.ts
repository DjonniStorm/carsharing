import { action } from "@reatom/core";

import { resetCarsListState } from "@/features/cars/model/cars-list";
import {
  resetDashboardGeozonesState,
  resetGeozonesCatalogState,
} from "@/features/geozones/model/geozones-state";
import { resetViolationsAdminListState } from "@/features/violations/model/violations-state";

export const resetFleetCaches = action(() => {
  resetCarsListState();
  resetDashboardGeozonesState();
  resetGeozonesCatalogState();
  resetViolationsAdminListState();
}, "resetFleetCaches");
