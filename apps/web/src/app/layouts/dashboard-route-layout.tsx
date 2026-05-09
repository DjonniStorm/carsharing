import { DASHBOARD_NAV } from "@/app/config/routes.config";

import { DashboardShell } from "@/widgets/dashboard-shell";

const DashboardRouteLayout = () => {
  return <DashboardShell navItems={DASHBOARD_NAV} />;
};

DashboardRouteLayout.displayName = "DashboardRouteLayout";

export { DashboardRouteLayout };
