/**
 * Навигация shell-дэшборда. `labelKey` — {@link LANG_KEYS} / ключи i18n.
 */
import type { DashboardShellNavItem } from "@/widgets/dashboard-shell";

import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

export { ROUTES };

export const DASHBOARD_NAV: readonly DashboardShellNavItem[] = [
  { labelKey: LANG_KEYS.nav.overview, to: ROUTES.dashboard.overview },
  { labelKey: LANG_KEYS.nav.cars, to: ROUTES.dashboard.cars },
  { labelKey: LANG_KEYS.nav.users, to: ROUTES.dashboard.users },
  { labelKey: LANG_KEYS.nav.geozones, to: ROUTES.dashboard.geozones },
  { labelKey: LANG_KEYS.nav.violations, to: ROUTES.dashboard.violations },
  { labelKey: LANG_KEYS.nav.tariffs, to: ROUTES.dashboard.tariffs },
] as const;
