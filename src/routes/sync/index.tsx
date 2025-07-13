import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { OverviewActions } from "@/_components/kanban/OverviewActions";
import { LoaderBlocks } from "@/_components/LoaderBlocks";

export const Route = createFileRoute("/sync/")({
  component: RouteComponent,
  pendingComponent: BoardListLoading,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(convexQuery(api.boards.getBoards, {}));
  },
});

// SYNC PLAN (Kanban boards)
// Boards: 1 Row, infinite columns, horizontal scroll on overflow
// Lists (Columns): Draggable, Header title (click to rename), table options button, Cards, + Add Card (footer)
// Add card, copy list, move list, move all cards
// Cards (Rows): Draggable, Edit, Embed preview, text, links (Title -> Desc -> Full link)
// Adding a card from bottom shows the input at bottom of the list
// Adding a card from top right control shows input at top of the list
// Card attribution, labels, move, start date & due date, reminders

function RouteComponent() {
  const { data: boards } = useSuspenseQuery(convexQuery(api.boards.getBoards, {}));

  // Later with perms
  // Alert confirm (shadcn) on delete attempt (owner & admin only)
  // Alert confirm (shadcn) on leave attempt (Not possible for owner)
  // Alert confirm (shadcn) on leave attempt (Not possible for owner)
  // Favorite boards (fill + stroke icon foreground if favorited, border the card if favorited)

  if (boards.length === 0) {
    return <EmptyBoardList />;
  }

  return (
    <section className="grid grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))] gap-4 p-6">
      {boards.map((board) => (
        <div key={board._id} className="p-4 flex flex-col gap-2 bg-card rounded-lg overflow-hidden">
          <div className="flex justify-between gap-2">
            <div className="grid">
              <h2 className="truncate">{board.name}</h2>
              <span className="text-xs text-muted-foreground truncate">Creator: TODO</span>
              <span className="text-xs text-muted-foreground truncate">
                {new Date(board._creationTime).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at{" "}
                {new Date(board._creationTime).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>
            <OverviewActions boardId={board._id} />
          </div>
          <div>
            <ul>
              <li>Lists: #</li>
              <li>Cards: #</li>
              <li>Members: #</li>
            </ul>
          </div>
          <div className="mt-auto grid">
            <span className="text-xs text-muted-foreground truncate">Last modified by TODO</span>
            <span className="text-xs text-muted-foreground truncate">
              {new Date(board.updatedTime).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              at{" "}
              {new Date(board.updatedTime).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}

function EmptyBoardList() {
  return (
    <div className="p-6 grow flex text-center">
      <div className="border-dashed border-2 p-4 rounded-md grow flex flex-col items-center justify-center">
        <h2 className="text-balance">No active boards. Create one to get started.</h2>
      </div>
    </div>
  );
}

function BoardListLoading() {
  return (
    <section className="p-6 grow flex text-center">
      <div className="border-dashed border-2 p-4 rounded-md grow flex flex-col items-center justify-center gap-6">
        <LoaderBlocks />
        <h2 className="text-balance text-muted">Loading boards...</h2>
      </div>
    </section>
  );
}
