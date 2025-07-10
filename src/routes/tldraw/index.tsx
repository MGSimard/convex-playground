import { createFileRoute } from "@tanstack/react-router";
import { TldrawCanvas } from "@/_components/Tldraw/TldrawCanvas";
import { Suspense } from "react";

export const Route = createFileRoute("/tldraw/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex-grow w-full h-full isolate">
      <Suspense fallback={<div>Loading...</div>}>
        <TldrawCanvas />
      </Suspense>
    </div>
  );
}
