/**
 * Публичные строковые пути для `<Link>`, `navigate`, редиректов.
 *
 * Должны совпадать с `path` в `app/router.tsx`. При добавлении страницы — обновить и дерево
 * роутера, и этот объект (и при необходимости `DASHBOARD_NAV` в `app/config/routes.config.ts`).
 */
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: {
    cars: "/dashboard/cars",
    geozones: "/dashboard/geozones",
    violations: "/dashboard/violations",
  },
} as const;
