import { createFileRoute } from "@tanstack/react-router";
import { TldrawCanvas } from "@/_components/tldraw/TldrawCanvas";

export const Route = createFileRoute("/trace/")({
  component: RouteComponent,
  loader: () => ({ crumb: "Trace" }),
});

function RouteComponent() {
  return (
    <div className="flex-grow w-full h-full isolate">
      <TldrawCanvas />
    </div>
  );
}
