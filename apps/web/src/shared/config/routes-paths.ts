export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  error: "/error",
  dashboard: {
    overview: "/dashboard",
    profile: "/dashboard/profile",
    cars: "/dashboard/cars",
    carReturnToService: (carId: string): string =>
      `/dashboard/cars/${encodeURIComponent(carId)}/return-to-service`,
    geozones: "/dashboard/geozones",
    geozonesNew: "/dashboard/geozones/new",
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
    users: "/dashboard/users",
    userView: (userId: string): string =>
      `/dashboard/users/${encodeURIComponent(userId)}`,
  },
} as const;
