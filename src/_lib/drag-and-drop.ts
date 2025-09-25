import type { Id } from "../../convex/_generated/dataModel";

// Edge type definition (based on Atlassian example)
export type Edge = "top" | "bottom" | "left" | "right";

// Drag data types
export interface ListDragData extends Record<string | symbol, unknown> {
  type: "list";
  listId: Id<"lists">;
  boardId: Id<"boards">;
}

export interface CardDragData extends Record<string | symbol, unknown> {
  type: "card";
  cardId: Id<"cards">;
  listId: Id<"lists">;
  boardId: Id<"boards">;
}

export interface LinkDragData extends Record<string | symbol, unknown> {
  type: "link";
  linkId: string;
  cardId: Id<"cards">;
}

export type DragData = ListDragData | CardDragData | LinkDragData;

// Drop target data types
export interface ListDropData extends Record<string | symbol, unknown> {
  type: "list";
  listId: Id<"lists">;
  boardId: Id<"boards">;
  closestEdge?: Edge | null;
}

export interface CardDropData extends Record<string | symbol, unknown> {
  type: "card";
  cardId: Id<"cards">;
  listId: Id<"lists">;
  boardId: Id<"boards">;
  closestEdge?: Edge | null;
}

export interface LinkDropData extends Record<string | symbol, unknown> {
  type: "link";
  linkId: string;
  cardId: Id<"cards">;
  closestEdge?: Edge | null;
}

export type DropData = ListDropData | CardDropData | LinkDropData;

// Edge detection utilities (based on Atlassian example)
export function attachClosestEdge(
  data: Record<string | symbol, unknown>,
  options: {
    input: { clientX: number; clientY: number };
    element: HTMLElement;
    allowedEdges: Edge[];
  }
): Record<string | symbol, unknown> {
  const { input, element, allowedEdges } = options;
  const rect = element.getBoundingClientRect();

  // const center = {
  //   x: rect.left + rect.width / 2,
  //   y: rect.top + rect.height / 2,
  // };

  const distances = {
    top: Math.abs(input.clientY - rect.top),
    bottom: Math.abs(input.clientY - rect.bottom),
    left: Math.abs(input.clientX - rect.left),
    right: Math.abs(input.clientX - rect.right),
  };

  // Find the closest edge among allowed edges
  let closestEdge: Edge | null = null;
  let minDistance = Infinity;

  for (const edge of allowedEdges) {
    if (distances[edge] < minDistance) {
      minDistance = distances[edge];
      closestEdge = edge;
    }
  }

  return {
    ...data,
    closestEdge,
  };
}

export function extractClosestEdge(data: Record<string | symbol, unknown>): Edge | null {
  const closestEdge = data.closestEdge;
  if (typeof closestEdge === "string" && ["top", "bottom", "left", "right"].includes(closestEdge)) {
    return closestEdge as Edge;
  }
  return null;
}

// Position calculation utilities
export function calculateNewPosition(
  items: { _id: string; position: number }[],
  fromIndex: number,
  toIndex: number
): number {
  if (fromIndex === toIndex && items[fromIndex]) {
    return items[fromIndex].position;
  }

  const sortedItems = [...items].sort((a, b) => a.position - b.position);

  if (toIndex === 0) {
    const firstItem = sortedItems[0];
    return firstItem ? firstItem.position - 1 : 0;
  }

  if (toIndex >= sortedItems.length) {
    const lastItem = sortedItems[sortedItems.length - 1];
    return lastItem ? lastItem.position + 1 : 0;
  }

  const prevItem = sortedItems[toIndex - 1];
  const nextItem = sortedItems[toIndex];

  if (prevItem && nextItem) {
    return (prevItem.position + nextItem.position) / 2;
  }

  // Fallback - should not happen with valid indices
  return 0;
}

// Reorder destination index calculation (based on Atlassian example)
export function getReorderDestinationIndex({
  startIndex: _startIndex,
  indexOfTarget,
  closestEdgeOfTarget,
  axis = "vertical",
}: {
  startIndex: number;
  indexOfTarget: number;
  closestEdgeOfTarget: Edge | null;
  axis?: "vertical" | "horizontal";
}): number {
  const isGoingBeforeTarget = () => {
    if (axis === "vertical") {
      return closestEdgeOfTarget === "top";
    }
    return closestEdgeOfTarget === "left";
  };

  const isGoingAfterTarget = () => {
    if (axis === "vertical") {
      return closestEdgeOfTarget === "bottom";
    }
    return closestEdgeOfTarget === "right";
  };

  if (isGoingBeforeTarget()) {
    return indexOfTarget;
  }

  if (isGoingAfterTarget()) {
    return indexOfTarget + 1;
  }

  // If no edge detected, go to the target index
  return indexOfTarget;
}

// Position calculation based on index (for final position assignment)
export function calculatePositionForIndex<T extends { position: number }>(sortedItems: T[], index: number): number {
  // If inserting at the beginning
  if (index === 0) {
    const firstItem = sortedItems[0];
    return firstItem ? firstItem.position - 1 : 0;
  }

  // If inserting at the end
  if (index >= sortedItems.length) {
    const lastItem = sortedItems[sortedItems.length - 1];
    return lastItem ? lastItem.position + 1 : 0;
  }

  // If inserting in the middle
  const prevItem = sortedItems[index - 1];
  const nextItem = sortedItems[index];

  if (prevItem && nextItem) {
    return (prevItem.position + nextItem.position) / 2;
  }

  // Fallback - should not happen with valid indices
  return 0;
}

// Type guards
export function isListDragData(data: Record<string | symbol, unknown>): data is ListDragData {
  return data.type === "list";
}

export function isCardDragData(data: Record<string | symbol, unknown>): data is CardDragData {
  return data.type === "card";
}

export function isListDropData(data: Record<string | symbol, unknown>): data is ListDropData {
  return data.type === "list";
}

export function isCardDropData(data: Record<string | symbol, unknown>): data is CardDropData {
  return data.type === "card";
}

export function isLinkDragData(data: Record<string | symbol, unknown>): data is LinkDragData {
  return data.type === "link";
}

export function isLinkDropData(data: Record<string | symbol, unknown>): data is LinkDropData {
  return data.type === "link";
}

// Drag state management
export interface DragState {
  isDragging: boolean;
  draggedItem: DragData | null;
  draggedOverItem: DropData | null;
}

class DragRegistry {
  private state: DragState = {
    isDragging: false,
    draggedItem: null,
    draggedOverItem: null,
  };

  private subscribers: ((state: DragState) => void)[] = [];

  getState(): DragState {
    return this.state;
  }

  subscribe(callback: (state: DragState) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => callback(this.state));
  }

  startDrag(item: DragData): void {
    this.state = {
      isDragging: true,
      draggedItem: item,
      draggedOverItem: null,
    };
    this.notifySubscribers();
  }

  updateDragOver(item: DropData | null): void {
    this.state = {
      ...this.state,
      draggedOverItem: item,
    };
    this.notifySubscribers();
  }

  endDrag(): void {
    this.state = {
      isDragging: false,
      draggedItem: null,
      draggedOverItem: null,
    };
    this.notifySubscribers();
  }
}

export const dragRegistry = new DragRegistry();
