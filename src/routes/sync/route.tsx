import { createFileRoute, Outlet, redirect, useParams } from "@tanstack/react-router";
import { BoardCombobox } from "@/_components/kanban/Combobox";
import { AddBoard } from "@/_components/kanban/AddBoard";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/sync")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(convexQuery(api.auth.currentUserData, {}));
    if (!user) throw redirect({ to: "/" });
  },
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
