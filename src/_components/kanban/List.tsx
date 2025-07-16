import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Plus, X, Loader2Icon } from "lucide-react";
import { ListActions } from "@/_components/kanban/ListActions";
import { Card } from "@/_components/kanban/Card";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { DropIndicator } from "@/_components/kanban/DropIndicator";
import { useDragAndDrop } from "@/_hooks/useDragAndDrop";
import { cn } from "@/_lib/utils";
import {
  type ListDragData,
  type ListDropData,
  type CardDragData,
  type CardDropData,
  type Edge,
  dragRegistry,
  isListDragData,
  isCardDragData,
  getReorderDestinationIndex,
  calculatePositionForIndex,
  attachClosestEdge,
  extractClosestEdge,
} from "@/_lib/drag-and-drop";

interface ListProps {
  list: Doc<"lists">;
  cards: Doc<"cards">[];
  allLists: Doc<"lists">[];
  allCards: Doc<"cards">[];
  onReorderLists: (boardId: Id<"boards">, listUpdates: Array<{ listId: Id<"lists">; position: number }>) => void;
  onReorderCards: (listId: Id<"lists">, cardUpdates: Array<{ cardId: Id<"cards">; position: number }>) => void;
  onMoveCard: (cardId: Id<"cards">, newListId: Id<"lists">, newPosition: number) => void;
}

// <ul mx-1 px-1> makes the scrollbar position look better than px-2
export function List({ list, cards, allLists, allCards, onReorderLists, onReorderCards, onMoveCard }: ListProps) {
  const [isCreating, setIsCreating] = useState<"top" | "bottom" | false>(false);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const [isDraggedOverByCard, setIsDraggedOverByCard] = useState(false);
  const formRef = useRef<HTMLLIElement>(null);
  const listRef = useRef<HTMLLIElement>(null);
  const listContentRef = useRef<HTMLUListElement>(null);
  const listHeaderRef = useRef<HTMLDivElement>(null);
  const dragState = useDragAndDrop();

  const isDragging =
    dragState.isDragging && dragState.draggedItem?.type === "list" && dragState.draggedItem.listId === list._id;
  const isBeingDraggedOver = isDraggedOver && dragState.isDragging;
  const isBeingDraggedOverByCard = isDraggedOverByCard && dragState.isDragging;

  const handleStartCreatingAtTop = () => {
    setIsCreating("top");
  };

  const handleStartCreatingAtBottom = () => {
    setIsCreating("bottom");
  };

  const handleCreationComplete = () => {
    setIsCreating(false);
  };

  // Handle click outside to cancel form
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCreating && formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsCreating(false);
      }
    };

    if (isCreating) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCreating]);

  // Set up drag and drop for lists
  useEffect(() => {
    const element = listRef.current;
    if (!element) return;

    const dragData: ListDragData = {
      type: "list",
      listId: list._id,
      boardId: list.boardId,
    };

    const dropData: ListDropData = {
      type: "list",
      listId: list._id,
      boardId: list.boardId,
    };

    return combine(
      // Make list draggable
      draggable({
        element,
        dragHandle: listHeaderRef.current || undefined,
        getInitialData: () => dragData,
        onDragStart: () => {
          dragRegistry.startDrag(dragData);
        },
        onDrop: () => {
          dragRegistry.endDrag();
        },
      }),
      // Make list a drop target for other lists
      dropTargetForElements({
        element,
        getData: ({ input, element }) =>
          attachClosestEdge(dropData, {
            input,
            element: element as HTMLElement,
            allowedEdges: ["left", "right"],
          }),
        getIsSticky: () => true,
        canDrop: ({ source }) => {
          const sourceData = source.data;
          return isListDragData(sourceData) && sourceData.boardId === list.boardId && sourceData.listId !== list._id;
        },
        onDragEnter: ({ self, source }) => {
          if (isListDragData(source.data)) {
            setIsDraggedOver(true);
            setClosestEdge(extractClosestEdge(self.data));
            dragRegistry.updateDragOver(dropData);
          }
        },
        onDrag: ({ self, source }) => {
          if (isListDragData(source.data)) {
            setClosestEdge(extractClosestEdge(self.data));
          }
        },
        onDragLeave: () => {
          setIsDraggedOver(false);
          setClosestEdge(null);
          dragRegistry.updateDragOver(null);
        },
        onDrop: ({ self, source, location }) => {
          setIsDraggedOver(false);
          setClosestEdge(null);

          const sourceData = source.data;
          if (!isListDragData(sourceData)) return;

          const currentIndex = allLists.findIndex((l) => l._id === sourceData.listId);
          const targetIndex = allLists.findIndex((l) => l._id === list._id);

          if (currentIndex === -1 || targetIndex === -1) return;

          const destinationIndex = getReorderDestinationIndex({
            startIndex: currentIndex,
            indexOfTarget: targetIndex,
            closestEdgeOfTarget: closestEdge,
            axis: "horizontal",
          });

          const sortedLists = [...allLists].sort((a, b) => a.position - b.position);
          const newPosition = calculatePositionForIndex(sortedLists, destinationIndex);

          onReorderLists(list.boardId, [{ listId: sourceData.listId, position: newPosition }]);
        },
      })
    );
  }, [list, allLists, onReorderLists, closestEdge, listHeaderRef]);

  // Set up drag and drop for cards on the list content area
  useEffect(() => {
    const element = listContentRef.current;
    if (!element) return;

    const dropData: CardDropData = {
      type: "card",
      cardId: "empty-list" as Id<"cards">, // Placeholder for empty list
      listId: list._id,
      boardId: list.boardId,
    };

    return dropTargetForElements({
      element,
      getData: () => dropData,
      getIsSticky: () => true,
      canDrop: ({ source }) => {
        const sourceData = source.data;
        return isCardDragData(sourceData) && sourceData.listId !== list._id;
      },
      onDragEnter: ({ self, source }) => {
        if (isCardDragData(source.data)) {
          setIsDraggedOverByCard(true);
          dragRegistry.updateDragOver(dropData);
        }
      },
      onDragLeave: () => {
        setIsDraggedOverByCard(false);
        dragRegistry.updateDragOver(null);
      },
      onDrop: ({ self, source, location }) => {
        setIsDraggedOverByCard(false);

        const sourceData = source.data;
        if (!isCardDragData(sourceData)) return;

        // Calculate position for adding to the end of the list
        const listCards = cards.filter((c) => c.listId === list._id);
        const newPosition = listCards.length > 0 ? Math.max(...listCards.map((c) => c.position)) + 1 : 0;

        onMoveCard(sourceData.cardId, list._id, newPosition);
      },
    });
  }, [list, cards, onMoveCard]);

  return (
    <li
      ref={listRef}
      className={cn(
        "relative flex flex-col gap-2 bg-card rounded-lg w-64 max-h-full border py-2",
        isDragging && "opacity-50 scale-95"
      )}>
      {/* Drop indicators */}
      {isBeingDraggedOver && closestEdge && <DropIndicator edge={closestEdge} isVisible={true} gap="16px" />}

      <div
        ref={listHeaderRef}
        className={cn("flex justify-between items-center gap-2 px-2", isDragging ? "cursor-grabbing" : "cursor-grab")}>
        <h2 className="truncate font-medium text-muted-foreground">{list.name}</h2>
        <ListActions listId={list._id} onAddCard={handleStartCreatingAtTop} />
      </div>

      <ul
        ref={listContentRef}
        className={cn(
          "flex flex-col [&>*]:shrink-0 px-1 mx-1 py-2 gap-2 list-none overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent]",
          isBeingDraggedOverByCard && cards.length === 0 && "bg-primary/10 border-2 border-dashed border-primary/30"
        )}>
        {/* Show card creation form at top if triggered from dropdown */}
        {isCreating === "top" && (
          <li ref={formRef}>
            <CardCreateForm listId={list._id} cards={cards} placement="top" onComplete={handleCreationComplete} />
          </li>
        )}
        {cards.length === 0 ? (
          <li
            className={cn(
              "text-sm font-medium border pointer-events-none select-none text-muted-foreground flex items-center justify-center p-4",
              isBeingDraggedOverByCard
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-[repeating-linear-gradient(45deg,var(--border),var(--border)_4px,transparent_4px,transparent_8px)]"
            )}>
            {isBeingDraggedOverByCard ? "Drop card here" : "Empty"}
          </li>
        ) : (
          cards.map((card) => (
            <Card
              key={card._id}
              card={card}
              boardId={list.boardId}
              allCards={allCards}
              onReorderCards={onReorderCards}
              onMoveCard={onMoveCard}
            />
          ))
        )}
        {/* Show card creation form at bottom if triggered from bottom button */}
        {isCreating === "bottom" && (
          <li ref={formRef}>
            <CardCreateForm listId={list._id} cards={cards} placement="bottom" onComplete={handleCreationComplete} />
          </li>
        )}
      </ul>

      <div className="px-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground w-full justify-start"
          onClick={handleStartCreatingAtBottom}>
          <Plus /> Add card
        </Button>
      </div>
    </li>
  );
}

interface CardCreateFormProps {
  listId: Id<"lists">;
  cards: Doc<"cards">[];
  placement: "top" | "bottom";
  onComplete: () => void;
}

function CardCreateForm({ listId, cards, placement, onComplete }: CardCreateFormProps) {
  const [cardContent, setCardContent] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { mutate: addCard, isPending: addingCard } = useMutation({
    mutationFn: useConvexMutation(api.cards.addCard),
  });

  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = cardContent.trim();
    if (trimmedContent) {
      // Calculate position based on placement preference
      let position: number;
      if (placement === "top") {
        // Add to top: use smaller position than the smallest existing card
        position = cards.length > 0 ? Math.min(...cards.map((card) => card.position)) - 1 : 0;
      } else {
        // Add to bottom: use larger position than the largest existing card
        position = cards.length > 0 ? Math.max(...cards.map((card) => card.position)) + 1 : 0;
      }

      addCard(
        { listId, content: trimmedContent, position },
        {
          onSuccess: () => {
            toast.success("SUCCESS: Card created successfully.");
            setCardContent("");
            onComplete();
          },
          onError: (error) => {
            toast.error(`ERROR: Failed to create card: ${error.message}`);
          },
        }
      );
    } else {
      toast.error("ERROR: Card content cannot be empty.");
    }
  };

  const handleCancel = () => {
    setCardContent("");
    onComplete();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave(e);
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <li className="bg-muted rounded-md p-2">
      <form onSubmit={handleSave} className="space-y-2">
        <Input
          id="card-create-input"
          name="card-create-input"
          ref={inputRef}
          value={cardContent}
          onChange={(e) => setCardContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter card content..."
          className="text-sm"
          disabled={addingCard}
          autoFocus
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={addingCard} className="grid place-items-center">
            <Loader2Icon className={cn("col-start-1 row-start-1 animate-spin", addingCard ? "visible" : "invisible")} />
            <span className={cn("col-start-1 row-start-1", addingCard ? "invisible" : "visible")}>Add</span>
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={handleCancel} disabled={addingCard}>
            <X />
          </Button>
        </div>
      </form>
    </li>
  );
}
