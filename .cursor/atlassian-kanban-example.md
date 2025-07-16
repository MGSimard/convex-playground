# Official Atlassian Kanban Example Reference

This file contains the complete official kanban board implementation from Atlassian's Pragmatic Drag and Drop documentation. This serves as the reference implementation for building our own kanban board.

## Key Patterns and Learnings

### 1. **Global Drop Monitoring**

- Uses `monitorForElements` for centralized drop handling
- Handles complex drop scenarios (column reordering, card reordering, cross-column moves)
- Uses `location.current.dropTargets` to determine drop context

### 2. **Position Calculation**

- Uses `getReorderDestinationIndex` utility for calculating new positions
- Uses `reorder` utility function for array reordering
- Handles edge cases with `closestEdge` detection

### 3. **State Management**

- Uses React Context for board-wide state
- Registry pattern for element management
- Optimistic UI updates with rollback capability

### 4. **Visual Feedback**

- Uses `DropIndicator` component for drop zones
- Custom drag previews with `setCustomNativeDragPreview`
- Safari-specific workarounds for drag preview issues

### 5. **Accessibility**

- Live region announcements for screen readers
- Keyboard navigation support
- Focus management for cross-column moves

---

## Implementation Files

### Example.tsx (Main Board Component)

```tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import invariant from "tiny-invariant";

import { triggerPostMoveFlash } from "@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";
import { getReorderDestinationIndex } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index";
import * as liveRegion from "@atlaskit/pragmatic-drag-and-drop-live-region";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";

import {
  type ColumnMap,
  type ColumnType,
  getBasicData,
  type Person,
} from "./pragmatic-drag-and-drop/documentation/examples/data/people";
import Board from "./pragmatic-drag-and-drop/documentation/examples/pieces/board/board";
import {
  BoardContext,
  type BoardContextValue,
} from "./pragmatic-drag-and-drop/documentation/examples/pieces/board/board-context";
import { Column } from "./pragmatic-drag-and-drop/documentation/examples/pieces/board/column";
import { createRegistry } from "./pragmatic-drag-and-drop/documentation/examples/pieces/board/registry";

type Outcome =
  | {
      type: "column-reorder";
      columnId: string;
      startIndex: number;
      finishIndex: number;
    }
  | {
      type: "card-reorder";
      columnId: string;
      startIndex: number;
      finishIndex: number;
    }
  | {
      type: "card-move";
      finishColumnId: string;
      itemIndexInStartColumn: number;
      itemIndexInFinishColumn: number;
    };

type Trigger = "pointer" | "keyboard";

type Operation = {
  trigger: Trigger;
  outcome: Outcome;
};

type BoardState = {
  columnMap: ColumnMap;
  orderedColumnIds: string[];
  lastOperation: Operation | null;
};

export default function BoardExample() {
  const [data, setData] = useState<BoardState>(() => {
    const base = getBasicData();
    return {
      ...base,
      lastOperation: null,
    };
  });

  const stableData = useRef(data);
  useEffect(() => {
    stableData.current = data;
  }, [data]);

  const [registry] = useState(createRegistry);

  const { lastOperation } = data;

  useEffect(() => {
    if (lastOperation === null) {
      return;
    }
    const { outcome, trigger } = lastOperation;

    if (outcome.type === "column-reorder") {
      const { startIndex, finishIndex } = outcome;

      const { columnMap, orderedColumnIds } = stableData.current;
      const sourceColumn = columnMap[orderedColumnIds[finishIndex]];

      const entry = registry.getColumn(sourceColumn.columnId);
      triggerPostMoveFlash(entry.element);

      liveRegion.announce(
        `You've moved ${sourceColumn.title} from position ${
          startIndex + 1
        } to position ${finishIndex + 1} of ${orderedColumnIds.length}.`
      );

      return;
    }

    if (outcome.type === "card-reorder") {
      const { columnId, startIndex, finishIndex } = outcome;

      const { columnMap } = stableData.current;
      const column = columnMap[columnId];
      const item = column.items[finishIndex];

      const entry = registry.getCard(item.userId);
      triggerPostMoveFlash(entry.element);

      if (trigger !== "keyboard") {
        return;
      }

      liveRegion.announce(
        `You've moved ${item.name} from position ${
          startIndex + 1
        } to position ${finishIndex + 1} of ${column.items.length} in the ${column.title} column.`
      );

      return;
    }

    if (outcome.type === "card-move") {
      const { finishColumnId, itemIndexInStartColumn, itemIndexInFinishColumn } = outcome;

      const data = stableData.current;
      const destinationColumn = data.columnMap[finishColumnId];
      const item = destinationColumn.items[itemIndexInFinishColumn];

      const finishPosition =
        typeof itemIndexInFinishColumn === "number" ? itemIndexInFinishColumn + 1 : destinationColumn.items.length;

      const entry = registry.getCard(item.userId);
      triggerPostMoveFlash(entry.element);

      if (trigger !== "keyboard") {
        return;
      }

      liveRegion.announce(
        `You've moved ${item.name} from position ${
          itemIndexInStartColumn + 1
        } to position ${finishPosition} in the ${destinationColumn.title} column.`
      );

      /**
       * Because the card has moved column, it will have remounted.
       * This means we need to manually restore focus to it.
       */
      entry.actionMenuTrigger.focus();

      return;
    }
  }, [lastOperation, registry]);

  useEffect(() => {
    return liveRegion.cleanup();
  }, []);

  const getColumns = useCallback(() => {
    const { columnMap, orderedColumnIds } = stableData.current;
    return orderedColumnIds.map((columnId) => columnMap[columnId]);
  }, []);

  const reorderColumn = useCallback(
    ({
      startIndex,
      finishIndex,
      trigger = "keyboard",
    }: {
      startIndex: number;
      finishIndex: number;
      trigger?: Trigger;
    }) => {
      setData((data) => {
        const outcome: Outcome = {
          type: "column-reorder",
          columnId: data.orderedColumnIds[startIndex],
          startIndex,
          finishIndex,
        };

        return {
          ...data,
          orderedColumnIds: reorder({
            list: data.orderedColumnIds,
            startIndex,
            finishIndex,
          }),
          lastOperation: {
            outcome,
            trigger: trigger,
          },
        };
      });
    },
    []
  );

  const reorderCard = useCallback(
    ({
      columnId,
      startIndex,
      finishIndex,
      trigger = "keyboard",
    }: {
      columnId: string;
      startIndex: number;
      finishIndex: number;
      trigger?: Trigger;
    }) => {
      setData((data) => {
        const sourceColumn = data.columnMap[columnId];
        const updatedItems = reorder({
          list: sourceColumn.items,
          startIndex,
          finishIndex,
        });

        const updatedSourceColumn: ColumnType = {
          ...sourceColumn,
          items: updatedItems,
        };

        const updatedMap: ColumnMap = {
          ...data.columnMap,
          [columnId]: updatedSourceColumn,
        };

        const outcome: Outcome | null = {
          type: "card-reorder",
          columnId,
          startIndex,
          finishIndex,
        };

        return {
          ...data,
          columnMap: updatedMap,
          lastOperation: {
            trigger: trigger,
            outcome,
          },
        };
      });
    },
    []
  );

  const moveCard = useCallback(
    ({
      startColumnId,
      finishColumnId,
      itemIndexInStartColumn,
      itemIndexInFinishColumn,
      trigger = "keyboard",
    }: {
      startColumnId: string;
      finishColumnId: string;
      itemIndexInStartColumn: number;
      itemIndexInFinishColumn?: number;
      trigger?: "pointer" | "keyboard";
    }) => {
      // invalid cross column movement
      if (startColumnId === finishColumnId) {
        return;
      }
      setData((data) => {
        const sourceColumn = data.columnMap[startColumnId];
        const destinationColumn = data.columnMap[finishColumnId];
        const item: Person = sourceColumn.items[itemIndexInStartColumn];

        const destinationItems = Array.from(destinationColumn.items);
        // Going into the first position if no index is provided
        const newIndexInDestination = itemIndexInFinishColumn ?? 0;
        destinationItems.splice(newIndexInDestination, 0, item);

        const updatedMap = {
          ...data.columnMap,
          [startColumnId]: {
            ...sourceColumn,
            items: sourceColumn.items.filter((i) => i.userId !== item.userId),
          },
          [finishColumnId]: {
            ...destinationColumn,
            items: destinationItems,
          },
        };

        const outcome: Outcome | null = {
          type: "card-move",
          finishColumnId,
          itemIndexInStartColumn,
          itemIndexInFinishColumn: newIndexInDestination,
        };

        return {
          ...data,
          columnMap: updatedMap,
          lastOperation: {
            outcome,
            trigger: trigger,
          },
        };
      });
    },
    []
  );

  const [instanceId] = useState(() => Symbol("instance-id"));

  useEffect(() => {
    return combine(
      monitorForElements({
        canMonitor({ source }) {
          return source.data.instanceId === instanceId;
        },
        onDrop(args) {
          const { location, source } = args;
          // didn't drop on anything
          if (!location.current.dropTargets.length) {
            return;
          }
          // need to handle drop

          // 1. remove element from original position
          // 2. move to new position

          if (source.data.type === "column") {
            const startIndex: number = data.orderedColumnIds.findIndex((columnId) => columnId === source.data.columnId);

            const target = location.current.dropTargets[0];
            const indexOfTarget: number = data.orderedColumnIds.findIndex((id) => id === target.data.columnId);
            const closestEdgeOfTarget: Edge | null = extractClosestEdge(target.data);

            const finishIndex = getReorderDestinationIndex({
              startIndex,
              indexOfTarget,
              closestEdgeOfTarget,
              axis: "horizontal",
            });

            reorderColumn({ startIndex, finishIndex, trigger: "pointer" });
          }
          // Dragging a card
          if (source.data.type === "card") {
            const itemId = source.data.itemId;
            invariant(typeof itemId === "string");
            // TODO: these lines not needed if item has columnId on it
            const [, startColumnRecord] = location.initial.dropTargets;
            const sourceId = startColumnRecord.data.columnId;
            invariant(typeof sourceId === "string");
            const sourceColumn = data.columnMap[sourceId];
            const itemIndex = sourceColumn.items.findIndex((item) => item.userId === itemId);

            if (location.current.dropTargets.length === 1) {
              const [destinationColumnRecord] = location.current.dropTargets;
              const destinationId = destinationColumnRecord.data.columnId;
              invariant(typeof destinationId === "string");
              const destinationColumn = data.columnMap[destinationId];
              invariant(destinationColumn);

              // reordering in same column
              if (sourceColumn === destinationColumn) {
                const destinationIndex = getReorderDestinationIndex({
                  startIndex: itemIndex,
                  indexOfTarget: sourceColumn.items.length - 1,
                  closestEdgeOfTarget: null,
                  axis: "vertical",
                });
                reorderCard({
                  columnId: sourceColumn.columnId,
                  startIndex: itemIndex,
                  finishIndex: destinationIndex,
                  trigger: "pointer",
                });
                return;
              }

              // moving to a new column
              moveCard({
                itemIndexInStartColumn: itemIndex,
                startColumnId: sourceColumn.columnId,
                finishColumnId: destinationColumn.columnId,
                trigger: "pointer",
              });
              return;
            }

            // dropping in a column (relative to a card)
            if (location.current.dropTargets.length === 2) {
              const [destinationCardRecord, destinationColumnRecord] = location.current.dropTargets;
              const destinationColumnId = destinationColumnRecord.data.columnId;
              invariant(typeof destinationColumnId === "string");
              const destinationColumn = data.columnMap[destinationColumnId];

              const indexOfTarget = destinationColumn.items.findIndex(
                (item) => item.userId === destinationCardRecord.data.itemId
              );
              const closestEdgeOfTarget: Edge | null = extractClosestEdge(destinationCardRecord.data);

              // case 1: ordering in the same column
              if (sourceColumn === destinationColumn) {
                const destinationIndex = getReorderDestinationIndex({
                  startIndex: itemIndex,
                  indexOfTarget,
                  closestEdgeOfTarget,
                  axis: "vertical",
                });
                reorderCard({
                  columnId: sourceColumn.columnId,
                  startIndex: itemIndex,
                  finishIndex: destinationIndex,
                  trigger: "pointer",
                });
                return;
              }

              // case 2: moving into a new column relative to a card

              const destinationIndex = closestEdgeOfTarget === "bottom" ? indexOfTarget + 1 : indexOfTarget;

              moveCard({
                itemIndexInStartColumn: itemIndex,
                startColumnId: sourceColumn.columnId,
                finishColumnId: destinationColumn.columnId,
                itemIndexInFinishColumn: destinationIndex,
                trigger: "pointer",
              });
            }
          }
        },
      })
    );
  }, [data, instanceId, moveCard, reorderCard, reorderColumn]);

  const contextValue: BoardContextValue = useMemo(() => {
    return {
      getColumns,
      reorderColumn,
      reorderCard,
      moveCard,
      registerCard: registry.registerCard,
      registerColumn: registry.registerColumn,
      instanceId,
    };
  }, [getColumns, reorderColumn, reorderCard, registry, moveCard, instanceId]);

  return (
    <BoardContext.Provider value={contextValue}>
      <Board>
        {data.orderedColumnIds.map((columnId) => {
          return <Column column={data.columnMap[columnId]} key={columnId} />;
        })}
      </Board>
    </BoardContext.Provider>
  );
}
```

### registry.ts (Element Registry)

```ts
import invariant from "tiny-invariant";

import type { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/types";

export type CardEntry = {
  element: HTMLElement;
  actionMenuTrigger: HTMLElement;
};

export type ColumnEntry = {
  element: HTMLElement;
};

/**
 * Registering cards and their action menu trigger element,
 * so that we can restore focus to the trigger when a card moves between columns.
 */
export function createRegistry() {
  const cards = new Map<string, CardEntry>();
  const columns = new Map<string, ColumnEntry>();

  function registerCard({ cardId, entry }: { cardId: string; entry: CardEntry }): CleanupFn {
    cards.set(cardId, entry);
    return function cleanup() {
      cards.delete(cardId);
    };
  }

  function registerColumn({ columnId, entry }: { columnId: string; entry: ColumnEntry }): CleanupFn {
    columns.set(columnId, entry);
    return function cleanup() {
      cards.delete(columnId);
    };
  }

  function getCard(cardId: string): CardEntry {
    const entry = cards.get(cardId);
    invariant(entry);
    return entry;
  }

  function getColumn(columnId: string): ColumnEntry {
    const entry = columns.get(columnId);
    invariant(entry);
    return entry;
  }

  return { registerCard, registerColumn, getCard, getColumn };
}
```

### column.tsx (Column Component)

```tsx
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createPortal } from "react-dom";
import invariant from "tiny-invariant";

import { IconButton } from "@atlaskit/button/new";
import DropdownMenu, { type CustomTriggerProps, DropdownItem, DropdownItemGroup } from "@atlaskit/dropdown-menu";
// eslint-disable-next-line @atlaskit/design-system/no-banned-imports
import mergeRefs from "@atlaskit/ds-lib/merge-refs";
import Heading from "@atlaskit/heading";
// This is the smaller MoreIcon soon to be more easily accessible with the
// ongoing icon project
import MoreIcon from "@atlaskit/icon/core/migration/show-more-horizontal--editor-more";
import { easeInOut } from "@atlaskit/motion/curves";
import { durations } from "@atlaskit/motion/durations";
import { fg } from "@atlaskit/platform-feature-flags";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { centerUnderPointer } from "@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { Box, Flex, Inline, Stack, xcss } from "@atlaskit/primitives";
import { token } from "@atlaskit/tokens";

import { type ColumnType } from "../../data/people";

import { useBoardContext } from "./board-context";
import { Card } from "./card";
import { ColumnContext, type ColumnContextProps, useColumnContext } from "./column-context";

const columnStyles = xcss({
  width: "250px",
  backgroundColor: "elevation.surface.sunken",
  borderRadius: "border.radius.300",
  // eslint-disable-next-line @atlaskit/ui-styling-standard/no-unsafe-values, @atlaskit/ui-styling-standard/no-imported-style-values
  transition: `background ${durations.medium}ms ${easeInOut}`,
  position: "relative",
  /**
   * TODO: figure out hover color.
   * There is no `elevation.surface.sunken.hovered` token,
   * so leaving this for now.
   */
});

const stackStyles = xcss({
  // allow the container to be shrunk by a parent height
  // https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/#the-minimum-size-gotcha-11
  minHeight: "0",

  // ensure our card list grows to be all the available space
  // so that users can easily drop on en empty list
  flexGrow: 1,
});

const scrollContainerStyles = xcss({
  height: "100%",
  overflowY: "auto",
});

const cardListStyles = xcss({
  boxSizing: "border-box",
  minHeight: "100%",
  padding: "space.100",
  gap: "space.100",
});

const columnHeaderStyles = xcss({
  paddingInlineStart: "space.200",
  paddingInlineEnd: "space.200",
  paddingBlockStart: "space.100",
  color: "color.text.subtlest",
  userSelect: "none",
});

/**
 * Note: not making `'is-dragging'` a `State` as it is
 * a _parallel_ state to `'is-column-over'`.
 *
 * Our board allows you to be over the column that is currently dragging
 */
type State =
  | { type: "idle" }
  | { type: "is-card-over" }
  | { type: "is-column-over"; closestEdge: Edge | null }
  | { type: "generate-safari-column-preview"; container: HTMLElement }
  | { type: "generate-column-preview" };

// preventing re-renders with stable state objects
const idle: State = { type: "idle" };
const isCardOver: State = { type: "is-card-over" };

const stateStyles: {
  [key in State["type"]]: ReturnType<typeof xcss> | undefined;
} = {
  idle: xcss({
    cursor: "grab",
  }),
  "is-card-over": xcss({
    backgroundColor: "color.background.selected.hovered",
  }),
  "is-column-over": undefined,
  /**
   * **Browser bug workaround**
   *
   * _Problem_
   * When generating a drag preview for an element
   * that has an inner scroll container, the preview can include content
   * vertically before or after the element
   *
   * _Fix_
   * We make the column a new stacking context when the preview is being generated.
   * We are not making a new stacking context at all times, as this _can_ mess up
   * other layering components inside of your card
   *
   * _Fix: Safari_
   * We have not found a great workaround yet. So for now we are just rendering
   * a custom drag preview
   */
  "generate-column-preview": xcss({
    isolation: "isolate",
  }),
  "generate-safari-column-preview": undefined,
};

const isDraggingStyles = xcss({
  opacity: 0.4,
});

export const Column = memo(function Column({ column }: { column: ColumnType }) {
  const columnId = column.columnId;
  const columnRef = useRef<HTMLDivElement | null>(null);
  const columnInnerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<State>(idle);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const { instanceId, registerColumn } = useBoardContext();

  useEffect(() => {
    invariant(columnRef.current);
    invariant(columnInnerRef.current);
    invariant(headerRef.current);
    invariant(scrollableRef.current);
    return combine(
      registerColumn({
        columnId,
        entry: {
          element: columnRef.current,
        },
      }),
      draggable({
        element: columnRef.current,
        dragHandle: headerRef.current,
        getInitialData: () => ({ columnId, type: "column", instanceId }),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          const isSafari: boolean =
            navigator.userAgent.includes("AppleWebKit") && !navigator.userAgent.includes("Chrome");

          if (!isSafari) {
            setState({ type: "generate-column-preview" });
            return;
          }
          setCustomNativeDragPreview({
            getOffset: centerUnderPointer,
            render: ({ container }) => {
              setState({
                type: "generate-safari-column-preview",
                container,
              });
              return () => setState(idle);
            },
            nativeSetDragImage,
          });
        },
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop() {
          setState(idle);
          setIsDragging(false);
        },
      }),
      dropTargetForElements({
        element: columnInnerRef.current,
        getData: () => ({ columnId }),
        canDrop: ({ source }) => {
          return source.data.instanceId === instanceId && source.data.type === "card";
        },
        getIsSticky: () => true,
        onDragEnter: () => setState(isCardOver),
        onDragLeave: () => setState(idle),
        onDragStart: () => setState(isCardOver),
        onDrop: () => setState(idle),
      }),
      dropTargetForElements({
        element: columnRef.current,
        canDrop: ({ source }) => {
          return source.data.instanceId === instanceId && source.data.type === "column";
        },
        getIsSticky: () => true,
        getData: ({ input, element }) => {
          const data = {
            columnId,
          };
          return attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ["left", "right"],
          });
        },
        onDragEnter: (args) => {
          setState({
            type: "is-column-over",
            closestEdge: extractClosestEdge(args.self.data),
          });
        },
        onDrag: (args) => {
          // skip react re-render if edge is not changing
          setState((current) => {
            const closestEdge: Edge | null = extractClosestEdge(args.self.data);
            if (current.type === "is-column-over" && current.closestEdge === closestEdge) {
              return current;
            }
            return {
              type: "is-column-over",
              closestEdge,
            };
          });
        },
        onDragLeave: () => {
          setState(idle);
        },
        onDrop: () => {
          setState(idle);
        },
      }),
      autoScrollForElements({
        element: scrollableRef.current,
        canScroll: ({ source }) => source.data.instanceId === instanceId && source.data.type === "card",
      })
    );
  }, [columnId, registerColumn, instanceId]);

  const stableItems = useRef(column.items);
  useEffect(() => {
    stableItems.current = column.items;
  }, [column.items]);

  const getCardIndex = useCallback((userId: string) => {
    return stableItems.current.findIndex((item) => item.userId === userId);
  }, []);

  const getNumCards = useCallback(() => {
    return stableItems.current.length;
  }, []);

  const contextValue: ColumnContextProps = useMemo(() => {
    return { columnId, getCardIndex, getNumCards };
  }, [columnId, getCardIndex, getNumCards]);

  return (
    <ColumnContext.Provider value={contextValue}>
      <Flex
        testId={`column-${columnId}`}
        ref={columnRef}
        direction="column"
        xcss={[columnStyles, stateStyles[state.type]]}>
        {/* This element takes up the same visual space as the column.
          We are using a separate element so we can have two drop targets
          that take up the same visual space (one for cards, one for columns)
        */}
        <Stack xcss={stackStyles} ref={columnInnerRef}>
          <Stack xcss={[stackStyles, isDragging ? isDraggingStyles : undefined]}>
            <Inline
              xcss={columnHeaderStyles}
              ref={headerRef}
              testId={`column-header-${columnId}`}
              spread="space-between"
              alignBlock="center">
              <Heading size="xxsmall" as="span" testId={`column-header-title-${columnId}`}>
                {column.title}
              </Heading>
              <ActionMenu />
            </Inline>
            <Box xcss={scrollContainerStyles} ref={scrollableRef}>
              <Stack xcss={cardListStyles} space="space.100">
                {column.items.map((item) => (
                  <Card item={item} key={item.userId} />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Stack>
        {state.type === "is-column-over" && state.closestEdge && (
          <DropIndicator edge={state.closestEdge} gap={token("space.200", "0")} />
        )}
      </Flex>
      {state.type === "generate-safari-column-preview"
        ? createPortal(<SafariColumnPreview column={column} />, state.container)
        : null}
    </ColumnContext.Provider>
  );
});

const safariPreviewStyles = xcss({
  width: "250px",
  backgroundColor: "elevation.surface.sunken",
  borderRadius: "border.radius",
  padding: "space.200",
});

function SafariColumnPreview({ column }: { column: ColumnType }) {
  return (
    <Box xcss={[columnHeaderStyles, safariPreviewStyles]}>
      <Heading size="xxsmall" as="span">
        {column.title}
      </Heading>
    </Box>
  );
}

function ActionMenu() {
  return (
    <DropdownMenu
      trigger={DropdownMenuTrigger}
      shouldRenderToParent={fg("should-render-to-parent-should-be-true-design-syst")}>
      <ActionMenuItems />
    </DropdownMenu>
  );
}

function ActionMenuItems() {
  const { columnId } = useColumnContext();
  const { getColumns, reorderColumn } = useBoardContext();

  const columns = getColumns();
  const startIndex = columns.findIndex((column) => column.columnId === columnId);

  const moveLeft = useCallback(() => {
    reorderColumn({
      startIndex,
      finishIndex: startIndex - 1,
    });
  }, [reorderColumn, startIndex]);

  const moveRight = useCallback(() => {
    reorderColumn({
      startIndex,
      finishIndex: startIndex + 1,
    });
  }, [reorderColumn, startIndex]);

  const isMoveLeftDisabled = startIndex === 0;
  const isMoveRightDisabled = startIndex === columns.length - 1;

  return (
    <DropdownItemGroup>
      <DropdownItem onClick={moveLeft} isDisabled={isMoveLeftDisabled}>
        Move left
      </DropdownItem>
      <DropdownItem onClick={moveRight} isDisabled={isMoveRightDisabled}>
        Move right
      </DropdownItem>
    </DropdownItemGroup>
  );
}

function DropdownMenuTrigger({ triggerRef, ...triggerProps }: CustomTriggerProps) {
  return (
    <IconButton
      ref={mergeRefs([triggerRef])}
      appearance="subtle"
      label="Actions"
      spacing="compact"
      icon={(iconProps) => <MoreIcon {...iconProps} size="small" />}
      {...triggerProps}
    />
  );
}
```

### column-context.tsx (Column Context)

```tsx
import { createContext, useContext } from "react";

import invariant from "tiny-invariant";

export type ColumnContextProps = {
  columnId: string;
  getCardIndex: (userId: string) => number;
  getNumCards: () => number;
};

export const ColumnContext = createContext<ColumnContextProps | null>(null);

export function useColumnContext(): ColumnContextProps {
  const value = useContext(ColumnContext);
  invariant(value, "cannot find ColumnContext provider");
  return value;
}
```

### card.tsx (Card Component)

```tsx
import React, { forwardRef, Fragment, memo, type Ref, useCallback, useEffect, useRef, useState } from "react";

import ReactDOM from "react-dom";
import invariant from "tiny-invariant";

import Avatar from "@atlaskit/avatar";
import { IconButton } from "@atlaskit/button/new";
import DropdownMenu, { DropdownItem, DropdownItemGroup } from "@atlaskit/dropdown-menu";
// eslint-disable-next-line @atlaskit/design-system/no-banned-imports
import mergeRefs from "@atlaskit/ds-lib/merge-refs";
import Heading from "@atlaskit/heading";
// This is the smaller MoreIcon soon to be more easily accessible with the
// ongoing icon project
import MoreIcon from "@atlaskit/icon/core/migration/show-more-horizontal--editor-more";
import { fg } from "@atlaskit/platform-feature-flags";
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { dropTargetForExternal } from "@atlaskit/pragmatic-drag-and-drop/external/adapter";
import { Box, Grid, Stack, xcss } from "@atlaskit/primitives";
import { token } from "@atlaskit/tokens";

import { type ColumnType, type Person } from "../../data/people";

import { useBoardContext } from "./board-context";
import { useColumnContext } from "./column-context";

type State = { type: "idle" } | { type: "preview"; container: HTMLElement; rect: DOMRect } | { type: "dragging" };

const idleState: State = { type: "idle" };
const draggingState: State = { type: "dragging" };

const noMarginStyles = xcss({ margin: "space.0" });
const noPointerEventsStyles = xcss({ pointerEvents: "none" });
const baseStyles = xcss({
  width: "100%",
  padding: "space.100",
  backgroundColor: "elevation.surface",
  borderRadius: "border.radius.200",
  position: "relative",
  ":hover": {
    backgroundColor: "elevation.surface.hovered",
  },
});

const stateStyles: {
  [Key in State["type"]]: ReturnType<typeof xcss> | undefined;
} = {
  idle: xcss({
    cursor: "grab",
    boxShadow: "elevation.shadow.raised",
  }),
  dragging: xcss({
    opacity: 0.4,
    boxShadow: "elevation.shadow.raised",
  }),
  // no shadow for preview - the platform will add it's own drop shadow
  preview: undefined,
};

const buttonColumnStyles = xcss({
  alignSelf: "start",
});

type CardPrimitiveProps = {
  closestEdge: Edge | null;
  item: Person;
  state: State;
  actionMenuTriggerRef?: Ref<HTMLButtonElement>;
};

function MoveToOtherColumnItem({ targetColumn, startIndex }: { targetColumn: ColumnType; startIndex: number }) {
  const { moveCard } = useBoardContext();
  const { columnId } = useColumnContext();

  const onClick = useCallback(() => {
    moveCard({
      startColumnId: columnId,
      finishColumnId: targetColumn.columnId,
      itemIndexInStartColumn: startIndex,
    });
  }, [columnId, moveCard, startIndex, targetColumn.columnId]);

  return <DropdownItem onClick={onClick}>{targetColumn.title}</DropdownItem>;
}

function LazyDropdownItems({ userId }: { userId: string }) {
  const { getColumns, reorderCard } = useBoardContext();
  const { columnId, getCardIndex, getNumCards } = useColumnContext();

  const numCards = getNumCards();
  const startIndex = getCardIndex(userId);

  const moveToTop = useCallback(() => {
    reorderCard({ columnId, startIndex, finishIndex: 0 });
  }, [columnId, reorderCard, startIndex]);

  const moveUp = useCallback(() => {
    reorderCard({ columnId, startIndex, finishIndex: startIndex - 1 });
  }, [columnId, reorderCard, startIndex]);

  const moveDown = useCallback(() => {
    reorderCard({ columnId, startIndex, finishIndex: startIndex + 1 });
  }, [columnId, reorderCard, startIndex]);

  const moveToBottom = useCallback(() => {
    reorderCard({ columnId, startIndex, finishIndex: numCards - 1 });
  }, [columnId, reorderCard, startIndex, numCards]);

  const isMoveUpDisabled = startIndex === 0;
  const isMoveDownDisabled = startIndex === numCards - 1;

  const moveColumnOptions = getColumns().filter((column) => column.columnId !== columnId);

  return (
    <Fragment>
      <DropdownItemGroup title="Reorder">
        <DropdownItem onClick={moveToTop} isDisabled={isMoveUpDisabled}>
          Move to top
        </DropdownItem>
        <DropdownItem onClick={moveUp} isDisabled={isMoveUpDisabled}>
          Move up
        </DropdownItem>
        <DropdownItem onClick={moveDown} isDisabled={isMoveDownDisabled}>
          Move down
        </DropdownItem>
        <DropdownItem onClick={moveToBottom} isDisabled={isMoveDownDisabled}>
          Move to bottom
        </DropdownItem>
      </DropdownItemGroup>
      {moveColumnOptions.length ? (
        <DropdownItemGroup title="Move to">
          {moveColumnOptions.map((column) => (
            <MoveToOtherColumnItem key={column.columnId} targetColumn={column} startIndex={startIndex} />
          ))}
        </DropdownItemGroup>
      ) : null}
    </Fragment>
  );
}

const CardPrimitive = forwardRef<HTMLDivElement, CardPrimitiveProps>(function CardPrimitive(
  { closestEdge, item, state, actionMenuTriggerRef },
  ref
) {
  const { avatarUrl, name, role, userId } = item;

  return (
    <Grid
      ref={ref}
      testId={`item-${userId}`}
      templateColumns="auto 1fr auto"
      columnGap="space.100"
      alignItems="center"
      xcss={[baseStyles, stateStyles[state.type]]}>
      <Box as="span" xcss={noPointerEventsStyles}>
        <Avatar size="large" src={avatarUrl} />
      </Box>

      <Stack space="space.050" grow="fill">
        <Heading size="xsmall" as="span">
          {name}
        </Heading>
        <Box as="small" xcss={noMarginStyles}>
          {role}
        </Box>
      </Stack>
      <Box xcss={buttonColumnStyles}>
        <DropdownMenu
          trigger={({ triggerRef, ...triggerProps }) => (
            <IconButton
              ref={
                actionMenuTriggerRef
                  ? mergeRefs([triggerRef, actionMenuTriggerRef])
                  : // Workaround for IconButton typing issue
                    mergeRefs([triggerRef])
              }
              icon={(iconProps) => <MoreIcon {...iconProps} size="small" />}
              label={`Move ${name}`}
              appearance="default"
              spacing="compact"
              {...triggerProps}
            />
          )}
          shouldRenderToParent={fg("should-render-to-parent-should-be-true-design-syst")}>
          <LazyDropdownItems userId={userId} />
        </DropdownMenu>
      </Box>
      {closestEdge && <DropIndicator edge={closestEdge} gap={token("space.100", "0")} />}
    </Grid>
  );
});

export const Card = memo(function Card({ item }: { item: Person }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { userId } = item;
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const [state, setState] = useState<State>(idleState);

  const actionMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const { instanceId, registerCard } = useBoardContext();
  useEffect(() => {
    invariant(actionMenuTriggerRef.current);
    invariant(ref.current);
    return registerCard({
      cardId: userId,
      entry: {
        element: ref.current,
        actionMenuTrigger: actionMenuTriggerRef.current,
      },
    });
  }, [registerCard, userId]);

  useEffect(() => {
    const element = ref.current;
    invariant(element);
    return combine(
      draggable({
        element: element,
        getInitialData: () => ({ type: "card", itemId: userId, instanceId }),
        onGenerateDragPreview: ({ location, source, nativeSetDragImage }) => {
          const rect = source.element.getBoundingClientRect();

          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({
              element,
              input: location.current.input,
            }),
            render({ container }) {
              setState({ type: "preview", container, rect });
              return () => setState(draggingState);
            },
          });
        },

        onDragStart: () => setState(draggingState),
        onDrop: () => setState(idleState),
      }),
      dropTargetForExternal({
        element: element,
      }),
      dropTargetForElements({
        element: element,
        canDrop: ({ source }) => {
          return source.data.instanceId === instanceId && source.data.type === "card";
        },
        getIsSticky: () => true,
        getData: ({ input, element }) => {
          const data = { type: "card", itemId: userId };

          return attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ["top", "bottom"],
          });
        },
        onDragEnter: (args) => {
          if (args.source.data.itemId !== userId) {
            setClosestEdge(extractClosestEdge(args.self.data));
          }
        },
        onDrag: (args) => {
          if (args.source.data.itemId !== userId) {
            setClosestEdge(extractClosestEdge(args.self.data));
          }
        },
        onDragLeave: () => {
          setClosestEdge(null);
        },
        onDrop: () => {
          setClosestEdge(null);
        },
      })
    );
  }, [instanceId, item, userId]);

  return (
    <Fragment>
      <CardPrimitive
        ref={ref}
        item={item}
        state={state}
        closestEdge={closestEdge}
        actionMenuTriggerRef={actionMenuTriggerRef}
      />
      {state.type === "preview" &&
        ReactDOM.createPortal(
          <Box
            style={{
              /**
               * Ensuring the preview has the same dimensions as the original.
               *
               * Using `border-box` sizing here is not necessary in this
               * specific example, but it is safer to include generally.
               */
              // eslint-disable-next-line @atlaskit/ui-styling-standard/enforce-style-prop -- Ignored via go/DSP-18766
              boxSizing: "border-box",
              width: state.rect.width,
              height: state.rect.height,
            }}>
            <CardPrimitive item={item} state={state} closestEdge={null} />
          </Box>,
          state.container
        )}
    </Fragment>
  );
});
```

### board.tsx (Board Container)

```tsx
import React, { forwardRef, memo, type ReactNode, useEffect } from "react";

import { autoScrollWindowForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { Box, xcss } from "@atlaskit/primitives";

import { useBoardContext } from "./board-context";

type BoardProps = {
  children: ReactNode;
};

const boardStyles = xcss({
  display: "flex",
  justifyContent: "center",
  gap: "space.200",
  flexDirection: "row",
  height: "480px",
});

const Board = forwardRef<HTMLDivElement, BoardProps>(({ children }: BoardProps, ref) => {
  const { instanceId } = useBoardContext();

  useEffect(() => {
    return autoScrollWindowForElements({
      canScroll: ({ source }) => source.data.instanceId === instanceId,
    });
  }, [instanceId]);

  return (
    <Box xcss={boardStyles} ref={ref}>
      {children}
    </Box>
  );
});

export default memo(Board);
```

### board-context.tsx (Board Context)

```tsx
import { createContext, useContext } from "react";

import invariant from "tiny-invariant";

import type { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/types";

import type { ColumnType } from "../../data/people";

export type BoardContextValue = {
  getColumns: () => ColumnType[];

  reorderColumn: (args: { startIndex: number; finishIndex: number }) => void;

  reorderCard: (args: { columnId: string; startIndex: number; finishIndex: number }) => void;

  moveCard: (args: {
    startColumnId: string;
    finishColumnId: string;
    itemIndexInStartColumn: number;
    itemIndexInFinishColumn?: number;
  }) => void;

  registerCard: (args: {
    cardId: string;
    entry: {
      element: HTMLElement;
      actionMenuTrigger: HTMLElement;
    };
  }) => CleanupFn;

  registerColumn: (args: {
    columnId: string;
    entry: {
      element: HTMLElement;
    };
  }) => CleanupFn;

  instanceId: symbol;
};

export const BoardContext = createContext<BoardContextValue | null>(null);

export function useBoardContext(): BoardContextValue {
  const value = useContext(BoardContext);
  invariant(value, "cannot find BoardContext provider");
  return value;
}
```

---

## Key Implementation Insights

### 1. **Utility Functions**

- `getReorderDestinationIndex` - calculates new position for reordering
- `reorder` - utility for reordering arrays
- `attachClosestEdge` / `extractClosestEdge` - for drop indicators

### 2. **State Management Pattern**

- Single source of truth in main component
- Optimistic updates with proper state transitions
- Registry pattern for DOM element management

### 3. **Drop Target Hierarchy**

- Cards can be dropped on: other cards, columns, or empty space
- Uses `location.current.dropTargets.length` to determine context
- Proper z-index management with overlapping drop targets

### 4. **Performance Optimizations**

- Memoized components with React.memo
- Stable state objects to prevent re-renders
- Efficient edge detection with state comparison

### 5. **Browser Compatibility**

- Safari-specific drag preview workarounds
- Cross-browser drag preview positioning
- Proper cleanup patterns for all browsers

This example provides the complete blueprint for implementing our kanban board with Pragmatic Drag and Drop!
