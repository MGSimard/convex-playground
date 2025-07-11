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
    <>
      <header className="shrink-0 flex items-center h-[var(--subHeader-height)] px-6 border-b">
        <BoardCombobox currentShortId={currentShortId} />
        <AddBoard />
      </header>
      <Outlet />
    </>
  );
}
