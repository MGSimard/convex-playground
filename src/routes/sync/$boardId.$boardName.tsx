import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/sync/$boardId/$boardName")({
  component: BoardComponent,
  loader: ({ params }) => ({
    crumb: params.boardName,
    boardId: params.boardId,
    boardName: params.boardName,
  }),
});

function BoardComponent() {
  const { boardId } = Route.useParams();
  const { data: board, isPending } = useQuery(convexQuery(api.boards.getBoard, { boardId: boardId as Id<"boards"> }));

  if (isPending) {
    return <div>Loading board...</div>;
  }

  if (!board) {
    return <div>Board not found</div>;
  }

  return (
    <section className="p-4 border border-muted-foreground border-dashed rounded-lg">
      <p className="text-center text-muted-foreground">Kanban board for "{board.name}" will go here</p>
    </section>
  );
}
