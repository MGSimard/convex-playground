import type { Doc } from "../../../convex/_generated/dataModel";

interface CardProps {
  card: Doc<"cards">;
}

export function Card({ card }: CardProps) {
  return <li className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-1.5">{card.content}</li>;
}
