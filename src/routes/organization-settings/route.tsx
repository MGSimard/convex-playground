import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/organization-settings")({
  component: RouteComponent,
  loader: () => ({ crumb: "Organization Settings" }),
});

function RouteComponent() {
  return <Outlet />;
}
