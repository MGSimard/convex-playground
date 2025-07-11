import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { BoardCombobox } from "@/_components/kanban/Combobox";
import { Separator } from "@/_components/ui/separator";
import type { Id } from "../../../convex/_generated/dataModel";
import { AddBoard } from "@/_components/kanban/AddBoard";

export const Route = createFileRoute("/sync")({
  component: RouteComponent,
  loader: () => ({ crumb: "Sync" }),
});

function RouteComponent() {
  const params = useParams({ strict: false });
  const currentShortId = params.boardId as string | undefined;

  return (
    <div className="flex-grow w-full h-full p-6">
      <header className="flex items-center">
        <BoardCombobox currentShortId={currentShortId} />
        <AddBoard />
      </header>
      <Separator className="my-6" />
      <Outlet />
    </div>
  );
}
