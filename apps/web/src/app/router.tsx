/**
 * --- TanStack Router: дерево маршрутов (код, без file-based генерации) ---
 *
 * Зачем так: `@tanstack/router-plugin` ожидает каталог с файлами роутов (`routesDirectory`).
 * У нас одно место правды — этот файл, `app/routes/*` и {@link ROUTES} в `shared/config/routes-paths.ts`.
 */

import { createRouter } from "@tanstack/react-router";

import {
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

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
