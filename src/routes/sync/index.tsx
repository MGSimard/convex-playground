import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sync/")({
  component: RouteComponent,
  loader: () => ({ crumb: "Sync" }),
});

function RouteComponent() {
  return <div>Hello "/sync/"!</div>;
}
