import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { List } from "@/_components/kanban/List";
import { ListCreate } from "@/_components/kanban/ListCreate";
import { LoaderLines } from "@/_components/LoaderLines";
import { SquareDashed } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";
import { useEffect } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { AccessibilityProvider, useAccessibility } from "@/_components/kanban/AccessibilityContext";

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
  return (
    <AccessibilityProvider>
      <BoardContent />
    </AccessibilityProvider>
  );
}

function BoardContent() {
  const { boardId } = Route.useLoaderData();
  const { data } = useSuspenseQuery(convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }));
  const { announce } = useAccessibility();
  const queryClient = useQueryClient();

  const { mutate: reorderLists } = useMutation({
    mutationFn: useConvexMutation(api.lists.reorderLists),
    onMutate: async (variables: {
      boardId: Id<"boards">;
      listUpdates: Array<{ listId: Id<"lists">; position: number }>;
    }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }).queryKey,
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(
        convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }).queryKey
      );

      // Optimistically update to the new value
      if (previousData) {
        queryClient.setQueryData(
          convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }).queryKey,
          (old: any) => {
            if (!old) return old;

            const updatedLists = old.lists.map((list: any) => {
              const update = variables.listUpdates.find((u: any) => u.listId === list._id);
              return update ? { ...list, position: update.position } : list;
            });

            return {
              ...old,
              lists: updatedLists.sort((a: any, b: any) => a.position - b.position),
            };
          }
        );
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(
          convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }).queryKey,
          context.previousData
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }).queryKey,
      });
    },
  });

  const { mutate: reorderCards } = useMutation({
    mutationFn: useConvexMutation(api.cards.reorderCards),
    onMutate: async (variables: {
      listId: Id<"lists">;
      cardUpdates: Array<{ cardId: Id<"cards">; position: number }>;
    }) => {
      await queryClient.cancelQueries({
        queryKey: convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }).queryKey,
      });

      const previousData = queryClient.getQueryData(
        convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }).queryKey
      );

      if (previousData) {
        queryClient.setQueryData(
          convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }).queryKey,
          (old: any) => {
            if (!old) return old;

            const updatedCards = old.cards.map((card: any) => {
              const update = variables.cardUpdates.find((u: any) => u.cardId === card._id);
              return update ? { ...card, position: update.position } : card;
            });

            return {
              ...old,
              cards: updatedCards.sort((a: any, b: any) => a.position - b.position),
            };
          }
        );
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }).queryKey,
          context.previousData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }).queryKey,
      });
    },
  });

  const { mutate: moveCard } = useMutation({
    mutationFn: useConvexMutation(api.cards.moveCard),
    onMutate: async (variables: { cardId: Id<"cards">; newListId: Id<"lists">; newPosition: number }) => {
      await queryClient.cancelQueries({
        queryKey: convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }).queryKey,
      });

      const previousData = queryClient.getQueryData(
        convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }).queryKey
      );

      if (previousData) {
        queryClient.setQueryData(
          convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }).queryKey,
          (old: any) => {
            if (!old) return old;

            const updatedCards = old.cards.map((card: any) => {
              if (card._id === variables.cardId) {
                return { ...card, listId: variables.newListId, position: variables.newPosition };
              }
              return card;
            });

            return {
              ...old,
              cards: updatedCards.sort((a: any, b: any) => a.position - b.position),
            };
          }
        );
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }).queryKey,
          context.previousData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: convexQuery(api.boards.getBoardWithListsAndCards, { shortId: boardId }).queryKey,
      });
    },
  });

  const handleReorderLists = (boardId: Id<"boards">, listUpdates: Array<{ listId: Id<"lists">; position: number }>) => {
    reorderLists(
      { boardId, listUpdates },
      {
        onSuccess: () => {
          toast.success("Lists reordered successfully");
          announce("Lists reordered successfully");
        },
        onError: (error) => {
          toast.error(`Failed to reorder lists: ${error.message}`);
          announce(`Failed to reorder lists: ${error.message}`);
        },
      }
    );
  };

  const handleReorderCards = (listId: Id<"lists">, cardUpdates: Array<{ cardId: Id<"cards">; position: number }>) => {
    reorderCards(
      { listId, cardUpdates },
      {
        onSuccess: () => {
          toast.success("Cards reordered successfully");
          announce("Cards reordered successfully");
        },
        onError: (error) => {
          toast.error(`Failed to reorder cards: ${error.message}`);
          announce(`Failed to reorder cards: ${error.message}`);
        },
      }
    );
  };

  const handleMoveCard = (cardId: Id<"cards">, newListId: Id<"lists">, newPosition: number) => {
    moveCard(
      { cardId, newListId, newPosition },
      {
        onSuccess: () => {
          toast.success("Card moved successfully");
          announce("Card moved successfully");
        },
        onError: (error) => {
          toast.error(`Failed to move card: ${error.message}`);
          announce(`Failed to move card: ${error.message}`);
        },
      }
    );
  };

  // Set up global drag monitoring
  useEffect(() => {
    return monitorForElements({
      onDragStart: () => {
        // Add any global drag start logic here
        announce("Drag started");
      },
      onDrop: () => {
        // Add any global drop logic here
        announce("Drag completed");
      },
    });
  }, [announce]);

  if (!data) {
    return <BoardNotFound boardId={boardId} />;
  }

  const { board, lists, cards } = data;

  return (
    <section id="kanban-board" className="min-h-0 h-full">
      <ol className="flex items-start [&>*]:shrink-0 gap-4 p-6 overflow-x-auto overflow-y-hidden h-full [scrollbar-color:var(--muted-foreground)_transparent]">
        {lists.map((list) => {
          const listCards = cards.filter((card) => card.listId === list._id);
          return (
            <List
              key={list._id}
              list={list}
              cards={listCards}
              allLists={lists}
              allCards={cards}
              onReorderLists={handleReorderLists}
              onReorderCards={handleReorderCards}
              onMoveCard={handleMoveCard}
            />
          );
        })}
        <ListCreate board={board} />
      </ol>
    </section>
  );
}

function BoardNotFound({ boardId }: { boardId: string }) {
  return (
    <section className="p-6 grow flex text-center">
      <div className="border-dashed border-2 p-4 rounded-md grow flex flex-col gap-6 items-center justify-center">
        <SquareDashed className="size-24 text-muted" />
        <h2 className="text-balance text-muted-foreground">The requested board ID "{boardId}" does not exist.</h2>
      </div>
    </section>
  );
}

function BoardLoading() {
  return (
    <section className="p-6 grow flex text-center">
      <div className="border-dashed border-2 p-4 rounded-md grow flex flex-col items-center justify-center gap-6">
        <LoaderLines />
        <h2 className="text-balance text-muted">Loading lists...</h2>
      </div>
    </section>
  );
}
