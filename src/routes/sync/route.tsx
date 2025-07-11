import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ExampleCombobox } from "@/_components/kanban/Combobox";
import { Separator } from "@/_components/ui/separator";

export const Route = createFileRoute("/sync")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex-grow w-full h-full p-6">
      <header>
        <ExampleCombobox />
      </header>
      <Separator className="my-6" />
      <Outlet />
    </div>
  );
}
