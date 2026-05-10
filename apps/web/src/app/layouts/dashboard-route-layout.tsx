import { DASHBOARD_NAV } from "@/app/config/routes.config";
import { DashboardTripRealtimeSync } from "@/features/trip-realtime/ui/dashboard-trip-realtime-sync";

import { DashboardShell } from "@/widgets/dashboard-shell";

const DashboardRouteLayout = () => {
  return (
    <>
      <DashboardTripRealtimeSync />
      <DashboardShell navItems={DASHBOARD_NAV} />
    </>
  );
};

DashboardRouteLayout.displayName = "DashboardRouteLayout";

export { DashboardRouteLayout };
