import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { List } from "@/_components/kanban/List";
import { ListCreate } from "@/_components/kanban/ListCreate";
import { LoaderBlocks } from "@/_components/LoaderBlocks";

export const Route = createFileRoute("/sync/$boardId/$boardName")({
  component: BoardComponent,
  pendingComponent: BoardLoading,
  loader: async ({ params, context }) => {
    const { boardId, boardName } = params;
    const boardData = await context.queryClient.ensureQueryData(
      convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId })
    );
    return { crumb: boardData?.board.name || "Not found", boardId, boardName };
  },
});

function BoardComponent() {
  const { boardId } = Route.useLoaderData();
  const { data } = useSuspenseQuery(convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }));

  if (!data) {
    return <BoardNotFound boardId={boardId} />;
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

function BoardNotFound({ boardId }: { boardId: string }) {
  return (
    <div className="p-6 grow flex text-center">
      <div className="border-dashed border-2 p-4 rounded-md grow flex flex-col items-center justify-center">
        <h2 className="text-balance">The requested board ID "{boardId}" does not exist.</h2>
      </div>
    </div>
  );
}

function BoardLoading() {
  return (
    <div className="p-6 grow flex text-center">
      <div className="border-dashed border-2 p-4 rounded-md grow flex flex-col items-center justify-center gap-6">
        <LoaderBlocks />
        <h2 className="text-balance text-muted">Loading board...</h2>
      </div>
    </div>
  );
}
