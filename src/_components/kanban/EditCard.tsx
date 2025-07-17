import { Button } from "@/_components/ui/button";
import type { Doc } from "../../../convex/_generated/dataModel";
import { SquarePen } from "lucide-react";

export function EditCard({ card }: { card: Doc<"cards"> }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="bg-muted size-6 absolute top-1 right-1 z-10 invisible group-hover:visible"
      aria-label={`Edit card: ${card.content}`}>
      <SquarePen />
    </Button>
  );
}
