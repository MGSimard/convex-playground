import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { List } from "@/_components/kanban/List";
import { ListCreate } from "@/_components/kanban/ListCreate";

export const Route = createFileRoute("/sync/$boardId/$boardName")({
  component: BoardComponent,
  pendingComponent: () => <div className="p-6">Loading board...</div>,
  loader: async ({ params, context }) => {
    const { boardId, boardName } = params;
    const boardData = await context.queryClient.ensureQueryData(
      convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId })
    );

    return {
      crumb: boardData?.board.name || "Not found",
      boardId,
      boardName,
    };
  },
});

function BoardComponent() {
  const { boardId } = Route.useLoaderData();
  const { data } = useSuspenseQuery(convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }));

  if (!data) {
    return <div className="p-6">Board not found.</div>;
  }

  const { board, lists, cards } = data;

  return (
    <section id="kanban-board" className="min-h-0 h-full">
      <ol className="flex items-start [&>*]:shrink-0 gap-4 p-6 overflow-x-auto overflow-y-hidden h-full [scrollbar-color:var(--muted-foreground)_transparent]">
        {lists.map((list) => {
          const listCards = cards.filter((card) => card.listId === list._id);
          return <List key={list._id} list={list} cards={listCards} />;
        })}
        <ListCreate board={board} />
      </ol>
    </section>
  );
}
