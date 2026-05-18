import { createRoute, redirect } from "@tanstack/react-router";

import { DashboardRouteLayout } from "@/app/layouts/dashboard-route-layout";
import { rootRoute } from "@/app/routes/root-route";
import { ensureDashboardAuth } from "@/app/routes/route-guards";
import { CarsPage } from "@/pages/cars";
import { DashboardPage } from "@/pages/dashboard";
import {
  GeozoneCreatePage,
  GeozoneEditPage,
  GeozonesPage,
} from "@/pages/geozones";
import { ProfilePage } from "@/pages/profile";
import { TariffCreatePage, TariffEditPage, TariffsPage } from "@/pages/tariffs";
import { TripViewPage, TripsListPage } from "@/pages/trip";
import {
  ViolationCreatePage,
  ViolationEditPage,
  ViolationsPage,
} from "@/pages/violations";
import { UserViewPage, UsersListPage } from "@/pages/users";
import { ROUTES } from "@/shared/config/routes-paths";
import { isUuidString } from "@/shared/lib/is-uuid-string";

export const dashboardShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "dashboard-shell",
  beforeLoad: async ({ location }) => {
    await ensureDashboardAuth(location);
  },
  component: DashboardRouteLayout,
});

export const dashboardHomeRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard",
  component: DashboardPage,
});

export const dashboardProfileRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard/profile",
  component: ProfilePage,
});

export const dashboardCarsRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard/cars",
  component: CarsPage,
});

export const dashboardTripsRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard/trips",
  component: TripsListPage,
});

export const dashboardTripViewRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard/trips/$tripId",
  beforeLoad: ({ params }) => {
    if (!isUuidString(params.tripId)) {
      throw redirect({
        to: ROUTES.error,
        search: { reason: "trip_invalid_id" },
      });
    }
  },
  component: TripViewPage,
});

export const dashboardUsersListRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard/users",
  component: UsersListPage,
});

export const dashboardUserViewRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard/users/$userId",
  component: UserViewPage,
});

export const dashboardGeozonesRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard/geozones",
  component: GeozonesPage,
});

export const dashboardGeozonesNewRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard/geozones/new",
  component: GeozoneCreatePage,
});

export const dashboardGeozonesEditRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard/geozones/$geozoneId/edit",
  component: GeozoneEditPage,
});

export const dashboardTariffsNewRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard/tariffs/new",
  component: TariffCreatePage,
});

export const dashboardTariffsEditRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard/tariffs/$tariffId/edit",
  component: TariffEditPage,
});

export const dashboardTariffsRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard/tariffs",
  component: TariffsPage,
});

export const dashboardViolationsNewRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard/violations/new",
  component: ViolationCreatePage,
});

export const dashboardViolationsEditRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard/violations/$violationId/edit",
  component: ViolationEditPage,
});

export const dashboardViolationsRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/dashboard/violations",
  component: ViolationsPage,
});
