import { SquarePen } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "@/_components/ui/button";
import { useDraggable } from "@dnd-kit/react";

interface CardProps {
  card: Doc<"cards">;
}

// Handle accessible interactivity once we implement dndkit+

export function Card({ card }: CardProps) {
  const { ref } = useDraggable({
    id: card._id,
  });

  return (
    <li
      ref={ref}
      className="relative text-sm text-muted-foreground bg-muted rounded-md px-3 py-1.5 overflow-hidden break-all group hover:outline-1 hover:outline-primary">
      {card.content}
      <Button
        variant="ghost"
        size="icon"
        className="bg-muted size-6 absolute top-1 right-1 z-10 invisible group-hover:visible">
        <SquarePen />
      </Button>
    </li>
  );
}
