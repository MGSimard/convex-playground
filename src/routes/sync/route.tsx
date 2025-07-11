import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ExampleCombobox } from "@/_components/kanban/Combobox";

export const Route = createFileRoute("/sync")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex-grow w-full h-full p-6">
      <ExampleCombobox />
      <Outlet />
    </div>
  );
}
