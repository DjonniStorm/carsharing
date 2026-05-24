import { createRouter } from "@tanstack/react-router";

import {
  dashboardCarReturnToServiceRoute,
  dashboardCarsRoute,
  dashboardGeozonesEditRoute,
  dashboardGeozonesNewRoute,
  dashboardGeozonesRoute,
  dashboardHomeRoute,
  dashboardProfileRoute,
  dashboardShellRoute,
  dashboardTariffsEditRoute,
  dashboardTariffsNewRoute,
  dashboardTariffsRoute,
  dashboardTripViewRoute,
  dashboardTripsRoute,
  dashboardUserViewRoute,
  dashboardUsersListRoute,
  dashboardViolationsEditRoute,
  dashboardViolationsNewRoute,
  dashboardViolationsRoute,
} from "@/app/routes/dashboard-routes";
import {
  errorRoute,
  loginRoute,
  publicHomeRoute,
  registerRoute,
} from "@/app/routes/public-routes";
import { rootRoute } from "@/app/routes/root-route";

const routeTree = rootRoute.addChildren([
  dashboardShellRoute.addChildren([
    dashboardHomeRoute,
    dashboardProfileRoute,
    dashboardCarsRoute,
    dashboardCarReturnToServiceRoute,
    dashboardTripsRoute,
    dashboardTripViewRoute,
    dashboardUsersListRoute,
    dashboardUserViewRoute,
    dashboardGeozonesNewRoute,
    dashboardGeozonesEditRoute,
    dashboardGeozonesRoute,
    dashboardTariffsNewRoute,
    dashboardTariffsEditRoute,
    dashboardTariffsRoute,
    dashboardViolationsNewRoute,
    dashboardViolationsEditRoute,
    dashboardViolationsRoute,
  ]),
  publicHomeRoute,
  errorRoute,
  loginRoute,
  registerRoute,
]);

/** Совпадает с `base` в Vite (GitHub Pages: /имя-репозитория/). */
const basepath =
  import.meta.env.BASE_URL === "/"
    ? "/"
    : import.meta.env.BASE_URL.replace(/\/$/, "");

export const router = createRouter({ routeTree, basepath });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
