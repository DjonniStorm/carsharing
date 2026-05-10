/**

 * Публичные строковые пути для `<Link>`, `navigate`, редиректов.

 *

 * Должны совпадать с `path` в `app/router.tsx`. При добавлении страницы — обновить и дерево

 * роутера, и этот объект (и при необходимости `DASHBOARD_NAV` в `app/config/routes.config.ts`).

 */

export const ROUTES = {
  /** Публичная главная (без shell). */

  home: "/",

  login: "/login",

  register: "/register",

  /** Страница ошибки / недействительной сессии (без shell). */

  error: "/error",

  dashboard: {
    /** Обзор с картой (внутри shell). */

    overview: "/dashboard",

    cars: "/dashboard/cars",

    geozones: "/dashboard/geozones",

    geozonesNew: "/dashboard/geozones/new",

    /** Путь редактирования: подставьте id геозоны. */

    geozonesEdit: (geozoneId: string) =>
      `/dashboard/geozones/${encodeURIComponent(geozoneId)}/edit` as const,

    violations: "/dashboard/violations",

    violationsNew: "/dashboard/violations/new",

    violationsEdit: (violationId: string) =>
      `/dashboard/violations/${encodeURIComponent(violationId)}/edit` as const,

    tariffs: "/dashboard/tariffs",

    tariffsNew: "/dashboard/tariffs/new",

    tariffsEdit: (tariffId: string) =>
      `/dashboard/tariffs/${encodeURIComponent(tariffId)}/edit` as const,

    tripView: (tripId: string) =>
      `/dashboard/trips/${encodeURIComponent(tripId)}` as const,

    userView: (userId: string) =>
      `/dashboard/users/${encodeURIComponent(userId)}` as const,
  },
} as const;
