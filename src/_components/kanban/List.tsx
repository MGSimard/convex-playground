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
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { DropIndicator } from "@/_components/kanban/DropIndicator";
import { useDragAndDrop } from "@/_hooks/useDragAndDrop";

import { cn } from "@/_lib/utils";
import {
  type ListDragData,
  type ListDropData,
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
}

// <ul mx-1 px-1> makes the scrollbar position look better than px-2
export function List({ list, cards, allLists, allCards, onReorderLists, onReorderCards }: ListProps) {
  const [isCreating, setIsCreating] = useState<"top" | "bottom" | false>(false);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const [isDraggedOverByCard, setIsDraggedOverByCard] = useState(false);
  const [isDropdownHovered, setIsDropdownHovered] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(list.name);
  const formRef = useRef<HTMLLIElement>(null);
  const listRef = useRef<HTMLLIElement>(null);
  const listContentRef = useRef<HTMLOListElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const dragState = useDragAndDrop();

  const isDragging =
    dragState.isDragging && dragState.draggedItem?.type === "list" && dragState.draggedItem.listId === list._id;
  const isBeingDraggedOver = isDraggedOver && dragState.isDragging;
  const isBeingDraggedOverByCard = isDraggedOverByCard && dragState.isDragging;

  const { mutate: renameList, isPending: isRenamingList } = useMutation({
    mutationFn: useConvexMutation(api.lists.renameList),
  });

  const handleTitleClick = () => {
    if (!isDragging && !isRenamingList) {
      setIsEditingTitle(true);
    }
  };

  const handleTitleSave = () => {
    const trimmedTitle = titleValue.trim();
    if (trimmedTitle && trimmedTitle !== list.name) {
      renameList(
        { listId: list._id, newName: trimmedTitle },
        {
          onSuccess: () => {
            toast.success("SUCCESS: List renamed.");
            setIsEditingTitle(false);
          },
          onError: (error) => {
            toast.error(`ERROR: Failed to rename list: ${error.message}`);
            setTitleValue(list.name); // Reset to original name on error
            setIsEditingTitle(false);
          },
        }
      );
    } else if (trimmedTitle === "") {
      toast.error("ERROR: List name cannot be empty.");
      setTitleValue(list.name); // Reset to original name
      setIsEditingTitle(false);
    } else {
      setIsEditingTitle(false);
    }
  };

  const handleTitleCancel = () => {
    setTitleValue(list.name); // Reset to original name
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleTitleCancel();
    }
  };

  const handleTitleBlur = () => {
    handleTitleSave();
  };

  // Sync title value when list name changes
  useEffect(() => {
    setTitleValue(list.name);
  }, [list.name]);

  // Handle focusing the title input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Handle click outside to cancel form
  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (isCreating && formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsCreating(false);
      }
    };

    if (isCreating) {
      document.addEventListener("pointerdown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
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
        dragHandle: dragHandleRef.current || undefined,
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
        onDrag: ({ self }) => {
          setClosestEdge(extractClosestEdge(self.data));
        },
        onDragLeave: () => {
          setIsDraggedOver(false);
          setClosestEdge(null);
          dragRegistry.updateDragOver(null);
        },
        onDrop: ({ source }) => {
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
  }, [list, allLists, onReorderLists, closestEdge]);

  // Set up drag and drop for cards on the list content area and auto-scrolling
  useEffect(() => {
    const element = listContentRef.current;
    if (!element) return;

    const dropData: CardDropData = {
      type: "card",
      cardId: "empty-list" as Id<"cards">, // Placeholder for empty list
      listId: list._id,
      boardId: list.boardId,
    };

    const cleanupDropTarget = dropTargetForElements({
      element,
      getData: () => dropData,
      getIsSticky: () => true,
      canDrop: ({ source }) => {
        const sourceData = source.data;
        // Only allow drop from different lists AND only when this list is empty
        // This prevents interference with card-to-card drops in non-empty lists
        return isCardDragData(sourceData) && sourceData.listId !== list._id && cards.length === 0;
      },
      onDragEnter: ({ source }) => {
        if (isCardDragData(source.data)) {
          setIsDraggedOverByCard(true);
          dragRegistry.updateDragOver(dropData);
        }
      },
      onDragLeave: () => {
        setIsDraggedOverByCard(false);
        dragRegistry.updateDragOver(null);
      },
      onDrop: ({ source }) => {
        setIsDraggedOverByCard(false);

        const sourceData = source.data;
        if (!isCardDragData(sourceData)) return;

        // Calculate position for adding to the end of the list
        const listCards = cards.filter((c) => c.listId === list._id);
        const newPosition = listCards.length > 0 ? Math.max(...listCards.map((c) => c.position)) + 1 : 0;

        onReorderCards(list._id, [{ cardId: sourceData.cardId, position: newPosition }]);
      },
    });

    // Set up auto-scrolling for vertical list scrolling
    const cleanupAutoScroll = autoScrollForElements({
      element,
      getAllowedAxis: () => "vertical",
      getConfiguration: () => ({
        maxScrollSpeed: "standard",
        startScrollingThreshold: "percentage-based",
        maxPixelScrollDelta: 6,
      }),
    });

    return () => {
      cleanupDropTarget();
      cleanupAutoScroll();
    };
  }, [list, cards, onReorderCards]);

  return (
    <li
      ref={listRef}
      data-dragging={isDragging}
      className={cn(
        "relative flex flex-col gap-2 bg-card rounded-lg w-64 max-h-full border py-2",
        isDragging && "opacity-50 scale-98"
      )}>
      {/* Drop indicators */}
      {isBeingDraggedOver && closestEdge && <DropIndicator edge={closestEdge} isVisible={true} gap="17.5px" />}

      <div
        ref={dragHandleRef}
        className={cn(
          "group flex justify-between items-center gap-2 px-2 py-1 rounded-md transition-colors",
          isDragging ? "cursor-grabbing bg-muted/50" : "cursor-grab",
          // Only show header hover when dropdown is not hovered - match dropdown trigger hover style
          !isDragging && !isDropdownHovered && "hover:bg-accent hover:text-accent-foreground"
        )}>
        {isEditingTitle ? (
          <Input
            ref={titleInputRef}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            onBlur={handleTitleBlur}
            className="flex-1 h-7 text-sm font-medium bg-background border-input"
            disabled={isRenamingList}
            autoFocus
          />
        ) : (
          <h2
            className={cn(
              "truncate font-medium text-muted-foreground cursor-text rounded px-1 py-0.5 transition-colors",
              !isDragging && !isRenamingList && "hover:bg-accent/50"
            )}
            id={`list-title-${list._id}`}
            onClick={handleTitleClick}
            title="Click to edit list name">
            {isRenamingList ? (
              <span className="flex items-center gap-1">
                <Loader2Icon className="h-3 w-3 animate-spin" />
                {list.name}
              </span>
            ) : (
              list.name
            )}
          </h2>
        )}
        <ListActions
          listId={list._id}
          onAddCard={() => setIsCreating("top")}
          onDropdownHoverChange={setIsDropdownHovered}
          currentPosition={
            [...allLists].sort((a, b) => a.position - b.position).findIndex((l) => l._id === list._id) + 1
          }
          totalLists={allLists.length}
          boardId={list.boardId}
          allLists={allLists}
          onReorderLists={onReorderLists}
        />
      </div>

      <ol
        ref={listContentRef}
        className={cn(
          "flex flex-col [&>*]:shrink-0 px-1 mx-1 py-2 gap-2 list-none overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent]",
          isBeingDraggedOverByCard && cards.length === 0 && "bg-primary/10 border-2 border-dashed border-primary/30"
        )}>
        {/* Show card creation form at top if triggered from dropdown */}
        {isCreating === "top" && (
          <li ref={formRef}>
            <CardCreateForm listId={list._id} cards={cards} placement="top" onComplete={() => setIsCreating(false)} />
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
            />
          ))
        )}
        {/* Show card creation form at bottom if triggered from bottom button */}
        {isCreating === "bottom" && (
          <li ref={formRef}>
            <CardCreateForm
              listId={list._id}
              cards={cards}
              placement="bottom"
              onComplete={() => setIsCreating(false)}
            />
          </li>
        )}
      </ol>

      <div className="px-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground w-full justify-start"
          onClick={() => setIsCreating("bottom")}>
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
            toast.success("SUCCESS: Card created.");
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
