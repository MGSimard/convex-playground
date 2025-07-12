import { createFileRoute, redirect } from "@tanstack/react-router";
import { TldrawCanvas } from "@/_components/tldraw/TldrawCanvas";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/trace/")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(convexQuery(api.auth.currentUserData, {}));
    if (!user) throw redirect({ to: "/" });
  },
  loader: () => ({ crumb: "Trace" }),
});

function RouteComponent() {
  return (
    <div className="flex-grow w-full isolate">
      <TldrawCanvas />
    </div>
  );
}
