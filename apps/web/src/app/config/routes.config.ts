/**
 * Навигация shell-дэшборда. `labelKey` — {@link LANG_KEYS} / ключи i18n.
 */
import type { DashboardShellNavItem } from '@/widgets/dashboard-shell'

import { ROUTES } from '@/shared/config/routes-paths'
import { LANG_KEYS } from '@/shared/i18n/keys'

export { ROUTES }

export const DASHBOARD_NAV: readonly DashboardShellNavItem[] = [
  { labelKey: LANG_KEYS.nav.overview, to: ROUTES.home },
  { labelKey: LANG_KEYS.nav.cars, to: ROUTES.dashboard.cars },
  { labelKey: LANG_KEYS.nav.geozones, to: ROUTES.dashboard.geozones },
  { labelKey: LANG_KEYS.nav.violations, to: ROUTES.dashboard.violations },
] as const
