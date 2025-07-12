import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { List } from "@/_components/kanban/List";
import { ListCreate } from "@/_components/kanban/ListCreate";

export const Route = createFileRoute("/sync/$boardId/$boardName")({
  component: BoardComponent,
  loader: ({ params }) => ({
    crumb: params.boardName,
    boardId: params.boardId,
    boardName: params.boardName,
  }),
});

// Need to consolidate board query to get:
// - Board data
// - Lists data (From Board)
// - Cards data (From Lists)

function BoardComponent() {
  const { boardId } = Route.useParams();
  const { data: board, isPending: boardPending } = useQuery(
    convexQuery(api.boards.getBoardByShortId, { shortId: boardId })
  );

  const { data: lists = [], isPending: listsPending } = useQuery({
    ...convexQuery(api.lists.getLists, { boardId: board?._id! }),
    enabled: !!board?._id,
    initialData: [],
  });

  if (boardPending) {
    return <div className="p-6">Loading board...</div>;
  }

  if (!board) {
    return <div className="p-6">Board not found</div>;
  }

  return (
    <section id="kanban-board" className="min-h-0 h-full">
      <ol className="flex items-start [&>*]:shrink-0 gap-4 p-6 overflow-x-auto overflow-y-hidden h-full [scrollbar-color:var(--muted-foreground)_transparent]">
        {listsPending ? (
          <li>Loading lists...</li>
        ) : (
          lists.map((list) => <List key={list._id} listId={list._id} listName={list.name} />)
        )}
        <ListCreate board={board} />
      </ol>
    </section>
  );
}
