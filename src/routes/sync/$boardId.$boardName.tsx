import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { List } from "@/_components/kanban/List";

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
  const { data: board, isPending } = useQuery(convexQuery(api.boards.getBoardByShortId, { shortId: boardId }));

  if (isPending) {
    return <div>Loading board...</div>;
  }

  if (!board) {
    return <div>Board not found</div>;
  }

  return (
    <section id="kanban-board" className="min-h-0 h-full">
      <ol className="flex items-start [&>*]:shrink-0 gap-4 p-6 overflow-x-auto overflow-y-hidden h-full [scrollbar-color:var(--muted-foreground)_transparent]">
        <List />
        <List />
        <List />
        <List />
        <List />
        <List />
        <List />
        <List />
      </ol>
    </section>
  );
}
