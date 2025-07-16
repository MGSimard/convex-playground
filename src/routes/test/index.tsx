import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { CollisionPriority } from "@dnd-kit/abstract";
import { move } from "@dnd-kit/helpers";

export const Route = createFileRoute("/test/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [items, setItems] = useState({
    A: ["A0", "A1", "A2"],
    B: ["B0", "B1"],
    C: [],
  });
  const [columnOrder, setColumnOrder] = useState(() => Object.keys(items));

  return (
    <DragDropProvider
      onDragOver={(event) => {
        const { source, target } = event.operation;

        if (source?.type === "column") return;

        setItems((items) => move(items, event));
      }}
      onDragEnd={(event) => {
        const { source, target } = event.operation;

        if (event.canceled || source.type !== "column") return;

        setColumnOrder((columns) => move(columns, event));
      }}>
      <div className="flex gap-4">
        {columnOrder.map((column, columnIndex) => (
          <Column key={column} id={column} index={columnIndex}>
            {items[column].map((id, index) => (
              <Item key={id} id={id} index={index} column={column} />
            ))}
          </Column>
        ))}
      </div>
    </DragDropProvider>
  );
}

export function Column({ children, id, index }: { children: React.ReactNode; id: string; index: number }) {
  const { ref } = useSortable({
    id,
    index,
    type: "column",
    collisionPriority: CollisionPriority.Low,
    accept: ["item", "column"],
  });

  return (
    <div className="Column bg-card w-64 p-2 flex flex-col gap-2" ref={ref}>
      <div>
        <h2>Column</h2>
      </div>
      <ol className="flex flex-col gap-2 grow border-red-500 border">{children}</ol>
    </div>
  );
}

function Item({ id, index, column }: { id: string; index: number; column: string }) {
  const { ref, isDragging } = useSortable({
    id,
    index,
    type: "item",
    accept: "item",
    group: column,
  });

  return (
    <li className="Item bg-accent p-2" ref={ref} data-dragging={isDragging}>
      {id}
    </li>
  );
}
