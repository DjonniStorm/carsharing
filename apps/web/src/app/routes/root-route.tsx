import { createRootRoute, Outlet } from "@tanstack/react-router";

import { ErrorPage } from "@/pages/error";

const RootOutlet = () => {
  return <Outlet />;
};
RootOutlet.displayName = "RootOutlet";

export const rootRoute = createRootRoute({
  component: RootOutlet,
  notFoundComponent: () => <ErrorPage reasonOverride="not_found" />,
});
