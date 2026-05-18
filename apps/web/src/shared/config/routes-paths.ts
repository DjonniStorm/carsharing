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

    profile: "/dashboard/profile",

    cars: "/dashboard/cars",

    geozones: "/dashboard/geozones",

    geozonesNew: "/dashboard/geozones/new",

    /** Путь редактирования: подставьте id геозоны. */

    geozonesEdit: (geozoneId: string): string =>
      `/dashboard/geozones/${encodeURIComponent(geozoneId)}/edit`,

    violations: "/dashboard/violations",

    violationsNew: "/dashboard/violations/new",

    violationsEdit: (violationId: string): string =>
      `/dashboard/violations/${encodeURIComponent(violationId)}/edit`,

    tariffs: "/dashboard/tariffs",

    tariffsNew: "/dashboard/tariffs/new",

    tariffsEdit: (tariffId: string): string =>
      `/dashboard/tariffs/${encodeURIComponent(tariffId)}/edit`,

    trips: "/dashboard/trips",

    tripView: (tripId: string): string =>
      `/dashboard/trips/${encodeURIComponent(tripId)}`,

    /** Список пользователей (статический сегмент до `/dashboard/users/:userId`). */
    users: "/dashboard/users",

    userView: (userId: string): string =>
      `/dashboard/users/${encodeURIComponent(userId)}`,
  },
} as const;
