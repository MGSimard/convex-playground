import { convexQuery } from "@convex-dev/react-query";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/organization-settings")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(convexQuery(api.auth.currentUserData, {}));
    if (!user) throw redirect({ to: "/" });
  },
  loader: () => ({ crumb: "Organization Settings" }),
});

function RouteComponent() {
  return <Outlet />;
}
