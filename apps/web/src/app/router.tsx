/**
 * --- TanStack Router: дерево маршрутов (код, без file-based генерации) ---
 *
 * Зачем так: `@tanstack/router-plugin` ожидает каталог с файлами роутов (`routesDirectory`).
 * У нас одно место правды — этот файл и {@link ROUTES} в `shared/config/routes-paths.ts`.
 *
 * Структура URL:
 *
 * - `/` — публичная главная (без shell).
 * - `/error` — страница ошибки / недействительной сессии (без shell).
 * - `/login`, `/register` — вход и регистрация; query `redirect` — куда вернуть после успеха.
 *
 * - Дашборд под layout `dashboard-shell`: без JWT редирект на `/login?redirect=…`.
 *   Перед входом в shell выполняется `GET /auth/me` — удалённый из БД пользователь получает
 *   очистку сессии и редирект на `/error?reason=session`. Роль водитель — очистка сессии и
 *   редирект на `/login?reason=manager_only` (веб-панель только для менеджеров).
 *
 * - `/dashboard/users` — список пользователей; карточка: `/dashboard/users/:userId`.
 *
 * Защита и навигация:
 * - Токен: `ACCESS_TOKEN_STORAGE_KEY`, см. `features/auth/config/token-storage.ts`.
 * - Константы путей: `ROUTES`, меню: `app/config/routes.config.ts` → `DASHBOARD_NAV`.
 */

import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";

import { DashboardRouteLayout } from "@/app/layouts/dashboard-route-layout";
import { UserRole } from "@/entities/user";
import { ACCESS_TOKEN_STORAGE_KEY } from "@/features/auth/config/token-storage";
import { authApi } from "@/features/auth/api";
import { forceLogoutClient } from "@/features/auth/lib/force-logout-client";
import { setSessionProfile } from "@/features/auth/model/session";
import { CarsPage } from "@/pages/cars";
import { DashboardPage } from "@/pages/dashboard";
import { ErrorPage } from "@/pages/error";
import {
  GeozoneCreatePage,
  GeozoneEditPage,
  GeozonesPage,
} from "@/pages/geozones";
import { PublicHomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { TariffCreatePage, TariffEditPage, TariffsPage } from "@/pages/tariffs";
import { ProfilePage } from "@/pages/profile";
import { TripViewPage } from "@/pages/trip";
import {
  ViolationCreatePage,
  ViolationEditPage,
  ViolationsPage,
} from "@/pages/violations";
import { UserViewPage, UsersListPage } from "@/pages/users";
import { rootFrame } from "@/app/store";
import { HttpApiError } from "@/shared/api/http-api-error";
import { ROUTES } from "@/shared/config/routes-paths";
import { isUuidString } from "@/shared/lib/is-uuid-string";

const readAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
};

/** В `beforeLoad` у TanStack Router `location.search` — объект, не строка query. */
const redirectPathFromLocation = (location: {
  pathname: string;
  search: Record<string, unknown>;
}): string => {
  const raw = location.search;
  const params = new URLSearchParams();
  if (raw && typeof raw === "object") {
    for (const key of Object.keys(raw)) {
      const val = raw[key];
      if (val === undefined || val === null) {
        continue;
      }
      if (Array.isArray(val)) {
        for (const item of val) {
          params.append(key, String(item));
        }
      } else {
        params.set(key, String(val));
      }
    }
  }
  const q = params.toString();
  if (!q) {
    return location.pathname;
  }
  return `${location.pathname}?${q}`;
};

const RootOutlet = () => {
  return <Outlet />;
};
RootOutlet.displayName = "RootOutlet";

const rootRoute = createRootRoute({
  component: RootOutlet,
});

const publicHomeRoute = createRoute({
  getParentRoute: () => {
    return rootRoute;
  },
  path: "/",
  beforeLoad: () => {
    if (readAccessToken()) {
      throw redirect({ to: ROUTES.dashboard.overview });
    }
  },
  component: PublicHomePage,
});

const errorRoute = createRoute({
  getParentRoute: () => {
    return rootRoute;
  },
  path: "/error",
  validateSearch: (search: Record<string, unknown>) => {
    return {
      reason: typeof search.reason === "string" ? search.reason : undefined,
    };
  },
  component: ErrorPage,
});

/* --- Публичные страницы (без shell) --- */

const loginRoute = createRoute({
  getParentRoute: () => {
    return rootRoute;
  },
  path: "/login",
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect:
        typeof search.redirect === "string" ? search.redirect : undefined,
      reason: typeof search.reason === "string" ? search.reason : undefined,
    };
  },
  beforeLoad: () => {
    if (readAccessToken()) {
      throw redirect({ to: ROUTES.dashboard.overview });
    }
  },
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => {
    return rootRoute;
  },
  path: "/register",
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect:
        typeof search.redirect === "string" ? search.redirect : undefined,
    };
  },
  beforeLoad: () => {
    if (readAccessToken()) {
      throw redirect({ to: ROUTES.dashboard.overview });
    }
  },
  component: RegisterPage,
});

/* --- Дашборд: layout + дочерние страницы --- */

const dashboardShellRoute = createRoute({
  getParentRoute: () => {
    return rootRoute;
  },
  /** Pathless layout: дочерние `path` остаются абсолютными URL, но `route.id` получает префикс `/dashboard-shell/`
   * (см. TanStack Router `route.ts`). Для `useParams({ from })` указывайте полный id, например
   * `/dashboard-shell/dashboard/trips/$tripId`. */
  id: "dashboard-shell",
  beforeLoad: async ({ location }) => {
    if (!readAccessToken()) {
      const redirectPath = redirectPathFromLocation(location);
      throw redirect({
        to: ROUTES.login,
        search: { redirect: redirectPath, reason: undefined },
      });
    }
    try {
      const me = await authApi.getMe();
      rootFrame.run(() => setSessionProfile(me));
      if (me.role === UserRole.DRIVER) {
        forceLogoutClient();
        throw redirect({
          to: ROUTES.login,
          search: { reason: "manager_only", redirect: undefined },
        });
      }
    } catch (e) {
      if (e instanceof HttpApiError && e.status === 401) {
        forceLogoutClient();
        throw redirect({
          to: ROUTES.error,
          search: { reason: "session" },
        });
      }
      if (e instanceof HttpApiError && e.status === 403) {
        forceLogoutClient();
        throw redirect({
          to: ROUTES.login,
          search: { reason: "manager_only", redirect: undefined },
        });
      }
      throw e;
    }
  },
  component: DashboardRouteLayout,
});

const dashboardHomeRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute;
  },
  path: "/dashboard",
  component: DashboardPage,
});

const dashboardProfileRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute;
  },
  path: "/dashboard/profile",
  component: ProfilePage,
});

const dashboardCarsRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute;
  },
  path: "/dashboard/cars",
  component: CarsPage,
});

const dashboardTripViewRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute;
  },
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

const dashboardUsersListRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute;
  },
  path: "/dashboard/users",
  component: UsersListPage,
});

const dashboardUserViewRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute;
  },
  path: "/dashboard/users/$userId",
  component: UserViewPage,
});

const dashboardGeozonesRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute;
  },
  path: "/dashboard/geozones",
  component: GeozonesPage,
});

const dashboardGeozonesNewRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute;
  },
  path: "/dashboard/geozones/new",
  component: GeozoneCreatePage,
});

const dashboardGeozonesEditRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute;
  },
  path: "/dashboard/geozones/$geozoneId/edit",
  component: GeozoneEditPage,
});

const dashboardTariffsNewRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute;
  },
  path: "/dashboard/tariffs/new",
  component: TariffCreatePage,
});

const dashboardTariffsEditRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute;
  },
  path: "/dashboard/tariffs/$tariffId/edit",
  component: TariffEditPage,
});

const dashboardTariffsRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute;
  },
  path: "/dashboard/tariffs",
  component: TariffsPage,
});

const dashboardViolationsNewRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute;
  },
  path: "/dashboard/violations/new",
  component: ViolationCreatePage,
});

const dashboardViolationsEditRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute;
  },
  path: "/dashboard/violations/$violationId/edit",
  component: ViolationEditPage,
});

const dashboardViolationsRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute;
  },
  path: "/dashboard/violations",
  component: ViolationsPage,
});

const routeTree = rootRoute.addChildren([
  dashboardShellRoute.addChildren([
    dashboardHomeRoute,
    dashboardProfileRoute,
    dashboardCarsRoute,
    dashboardTripViewRoute,
    dashboardUsersListRoute,
    dashboardUserViewRoute,
    /** Статические пути глубже `/dashboard/geozones` — до индекса списка. */
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
