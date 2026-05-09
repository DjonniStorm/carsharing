/**
 * --- TanStack Router: дерево маршрутов (код, без file-based генерации) ---
 *
 * Зачем так: `@tanstack/router-plugin` ожидает каталог с файлами роутов (`routesDirectory`).
 * У нас одно место правды — этот файл и {@link ROUTES} в `shared/config/routes-paths.ts`.
 *
 * Структура URL:
 *
 * - `/login`, `/register` — публичные страницы. Query `redirect` (строка): куда вернуть после
 *   успешного входа/регистрации (собирается из `location` в `redirectPathFromLocation`).
 *
 * - Остальное под общим layout `dashboard-shell` (см. `DashboardRouteLayout`): без JWT в
 *   `localStorage` любой заход сюда редиректит на `/login?redirect=<текущий путь+query>`.
 *
 * - `/` — главная дашборда (внутри shell).
 * - `/dashboard/cars`, `/dashboard/geozones`, `/dashboard/violations` — разделы дашборда.
 *
 * Защита и навигация:
 * - Токен: `ACCESS_TOKEN_STORAGE_KEY`, см. `features/auth/config/token-storage.ts`.
 * - Константы путей для ссылок в UI: `ROUTES`, пункты меню: `app/config/routes.config.ts` → `DASHBOARD_NAV`.
 */

import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'

import { DashboardRouteLayout } from '@/app/layouts/dashboard-route-layout'
import { ACCESS_TOKEN_STORAGE_KEY } from '@/features/auth/config/token-storage'
import { CarsPage } from '@/pages/cars'
import { DashboardPage } from '@/pages/dashboard'
import { GeozonesPage } from '@/pages/geozones'
import { LoginPage } from '@/pages/login'
import { RegisterPage } from '@/pages/register'
import { ViolationsPage } from '@/pages/violations'
import { ROUTES } from '@/shared/config/routes-paths'

const readAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
}

/** В `beforeLoad` у TanStack Router `location.search` — объект, не строка query. */
const redirectPathFromLocation = (location: {
  pathname: string
  search: Record<string, unknown>
}): string => {
  const raw = location.search
  const params = new URLSearchParams()
  if (raw && typeof raw === 'object') {
    for (const key of Object.keys(raw)) {
      const val = raw[key]
      if (val === undefined || val === null) {
        continue
      }
      if (Array.isArray(val)) {
        for (const item of val) {
          params.append(key, String(item))
        }
      } else {
        params.set(key, String(val))
      }
    }
  }
  const q = params.toString()
  if (!q) {
    return location.pathname
  }
  return `${location.pathname}?${q}`
}

const RootOutlet = () => {
  return <Outlet />
}
RootOutlet.displayName = 'RootOutlet'

const rootRoute = createRootRoute({
  component: RootOutlet,
})

/* --- Публичные страницы (без shell) --- */

const loginRoute = createRoute({
  getParentRoute: () => {
    return rootRoute
  },
  path: '/login',
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    }
  },
  beforeLoad: () => {
    if (readAccessToken()) {
      throw redirect({ to: ROUTES.home })
    }
  },
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => {
    return rootRoute
  },
  path: '/register',
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    }
  },
  beforeLoad: () => {
    if (readAccessToken()) {
      throw redirect({ to: ROUTES.home })
    }
  },
  component: RegisterPage,
})

/* --- Дашборд: layout + дочерние страницы --- */

const dashboardShellRoute = createRoute({
  getParentRoute: () => {
    return rootRoute
  },
  id: 'dashboard-shell',
  beforeLoad: ({ location }) => {
    if (!readAccessToken()) {
      const redirectPath = redirectPathFromLocation(location)
      throw redirect({
        to: '/login',
        search: { redirect: redirectPath },
      })
    }
  },
  component: DashboardRouteLayout,
})

const dashboardHomeRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute
  },
  path: '/',
  component: DashboardPage,
})

const dashboardCarsRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute
  },
  path: '/dashboard/cars',
  component: CarsPage,
})

const dashboardGeozonesRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute
  },
  path: '/dashboard/geozones',
  component: GeozonesPage,
})

const dashboardViolationsRoute = createRoute({
  getParentRoute: () => {
    return dashboardShellRoute
  },
  path: '/dashboard/violations',
  component: ViolationsPage,
})

const routeTree = rootRoute.addChildren([
  dashboardShellRoute.addChildren([
    dashboardHomeRoute,
    dashboardCarsRoute,
    dashboardGeozonesRoute,
    dashboardViolationsRoute,
  ]),
  loginRoute,
  registerRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
