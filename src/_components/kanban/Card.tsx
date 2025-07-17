import { SquarePen } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "@/_components/ui/button";
import { useEffect, useRef, useState } from "react";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { DropIndicator } from "@/_components/kanban/DropIndicator";
import { useDragAndDrop } from "@/_hooks/useDragAndDrop";

import { cn } from "@/_lib/utils";
import {
  type CardDragData,
  type CardDropData,
  type Edge,
  dragRegistry,
  isCardDragData,
  getReorderDestinationIndex,
  calculatePositionForIndex,
  attachClosestEdge,
  extractClosestEdge,
} from "@/_lib/drag-and-drop";
import { EditCard } from "./EditCard";

interface CardProps {
  card: Doc<"cards">;
  boardId: Doc<"boards">["_id"];
  allCards: Doc<"cards">[];
  onReorderCards: (
    listId: Doc<"lists">["_id"],
    cardUpdates: Array<{ cardId: Doc<"cards">["_id"]; position: number }>
  ) => void;
  onMoveCard: (cardId: Doc<"cards">["_id"], newListId: Doc<"lists">["_id"], newPosition: number) => void;
}

export function Card({ card, boardId, allCards, onReorderCards, onMoveCard }: CardProps) {
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const cardRef = useRef<HTMLLIElement>(null);
  const dragState = useDragAndDrop();

  const isDragging =
    dragState.isDragging && dragState.draggedItem?.type === "card" && dragState.draggedItem.cardId === card._id;
  const isBeingDraggedOver = isDraggedOver && dragState.isDragging;

  // Set up drag and drop
  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    const dragData: CardDragData = {
      type: "card",
      cardId: card._id,
      listId: card.listId,
      boardId: boardId,
    };

    const dropData: CardDropData = {
      type: "card",
      cardId: card._id,
      listId: card.listId,
      boardId: boardId,
    };

    return combine(
      // Make card draggable
      draggable({
        element,
        getInitialData: () => dragData,
        onDragStart: () => {
          dragRegistry.startDrag(dragData);
        },
        onDrop: () => {
          dragRegistry.endDrag();
        },
      }),
      // Make card a drop target
      dropTargetForElements({
        element,
        getData: ({ input, element }) =>
          attachClosestEdge(dropData, {
            input,
            element: element as HTMLElement,
            allowedEdges: ["top", "bottom"],
          }),
        getIsSticky: () => true,
        canDrop: ({ source }) => {
          const sourceData = source.data;
          return isCardDragData(sourceData) && sourceData.cardId !== card._id;
        },
        onDragEnter: ({ self, source }) => {
          if (isCardDragData(source.data)) {
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
          if (!isCardDragData(sourceData)) return;

          const sourceListId = sourceData.listId;
          const targetListId = card.listId;

          if (sourceListId === targetListId) {
            // Reordering within the same list
            const listCards = allCards.filter((c) => c.listId === card.listId);
            const currentIndex = listCards.findIndex((c) => c._id === sourceData.cardId);
            const targetIndex = listCards.findIndex((c) => c._id === card._id);

            if (currentIndex === -1 || targetIndex === -1) return;

            const destinationIndex = getReorderDestinationIndex({
              startIndex: currentIndex,
              indexOfTarget: targetIndex,
              closestEdgeOfTarget: closestEdge,
              axis: "vertical",
            });

            const sortedCards = [...listCards].sort((a, b) => a.position - b.position);
            const newPosition = calculatePositionForIndex(sortedCards, destinationIndex);

            onReorderCards(card.listId, [{ cardId: sourceData.cardId, position: newPosition }]);
          } else {
            // Moving to a different list
            const targetListCards = allCards.filter((c) => c.listId === targetListId);
            const targetIndex = targetListCards.findIndex((c) => c._id === card._id);

            const destinationIndex = getReorderDestinationIndex({
              startIndex: -1, // Coming from different list
              indexOfTarget: targetIndex,
              closestEdgeOfTarget: closestEdge,
              axis: "vertical",
            });

            const sortedCards = [...targetListCards].sort((a, b) => a.position - b.position);
            const newPosition = calculatePositionForIndex(sortedCards, destinationIndex);

            onMoveCard(sourceData.cardId, targetListId, newPosition);
          }
        },
      })
    );
  }, [card, boardId, allCards, onReorderCards, onMoveCard, closestEdge]);

  return (
    <li
      ref={cardRef}
      data-dragging={isDragging}
      className={cn(
        "relative text-sm text-muted-foreground bg-muted rounded-md px-3 py-1.5 break-all group hover:outline-1 hover:outline-primary",
        isDragging ? "opacity-50 scale-98" : "cursor-grab"
      )}>
      {isBeingDraggedOver && closestEdge && <DropIndicator edge={closestEdge} isVisible={true} gap="8px" />}
      {card.content}
      <EditCard card={card} />
    </li>
  );
}
