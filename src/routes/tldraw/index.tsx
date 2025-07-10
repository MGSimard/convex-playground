import { createFileRoute } from "@tanstack/react-router";
import { TldrawCanvas } from "@/_components/Tldraw/TldrawCanvas";

export const Route = createFileRoute("/tldraw/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex-grow w-full h-full isolate">
      <TldrawCanvas />
    </div>
  );
}
