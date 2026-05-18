import { createRoute, redirect } from "@tanstack/react-router";

import { rootRoute } from "@/app/routes/root-route";
import { readAccessToken } from "@/app/routes/route-guards";
import { ErrorPage } from "@/pages/error";
import { PublicHomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { ROUTES } from "@/shared/config/routes-paths";

export const publicHomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    if (readAccessToken()) {
      throw redirect({ to: ROUTES.dashboard.overview });
    }
  },
  component: PublicHomePage,
});

export const errorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/error",
  validateSearch: (search: Record<string, unknown>) => {
    return {
      reason: typeof search.reason === "string" ? search.reason : undefined,
    };
  },
  component: ErrorPage,
});

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
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

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
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
