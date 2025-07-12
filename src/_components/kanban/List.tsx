import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Plus, X, Loader2Icon } from "lucide-react";
import { ListActions } from "@/_components/kanban/ListActions";
import { Card } from "@/_components/kanban/Card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

// <ul mx-1 px-1> makes the scrollbar position look better than px-2
export function List({ listId, listName }: { listId: Id<"lists">; listName: string }) {
  const [isCreating, setIsCreating] = useState<"top" | "bottom" | false>(false);
  const [cardContent, setCardContent] = useState("");

  // Fetch cards for this list using convex_tsquery_rules
  const { data: cards = [], isPending: cardsLoading } = useQuery({
    ...convexQuery(api.cards.getCards, { listId }),
    initialData: [],
  });

  // Card creation mutation following convex_tsquery_rules
  const { mutate: addCard, isPending: addingCard } = useMutation({
    mutationFn: useConvexMutation(api.cards.addCard),
  });

  const handleStartCreatingAtTop = () => {
    setIsCreating("top");
    setCardContent("");
  };

  const handleStartCreatingAtBottom = () => {
    setIsCreating("bottom");
    setCardContent("");
  };

  const handleCancel = () => {
    setIsCreating(false);
    setCardContent("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = cardContent.trim();
    if (trimmedContent) {
      // Calculate position based on placement preference
      let position: number;
      if (isCreating === "top") {
        // Add to top: use smaller position than the smallest existing card
        position = cards.length > 0 ? Math.min(...cards.map((card) => card.position)) - 1 : 0;
      } else {
        // Add to bottom: use larger position than the largest existing card
        position = cards.length > 0 ? Math.max(...cards.map((card) => card.position)) + 1 : 0;
      }

      addCard(
        {
          listId,
          content: trimmedContent,
          position,
        },
        {
          onSuccess: () => {
            toast.success("Card created successfully!");
            setIsCreating(false);
            setCardContent("");
          },
          onError: (error) => {
            toast.error(`Failed to create card: ${error.message}`);
          },
        }
      );
    } else {
      toast.error("Card content cannot be empty.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave(e);
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const CardCreateForm = () => (
    <li className="bg-muted rounded-md p-2">
      <form onSubmit={handleSave} className="space-y-2">
        <Input
          value={cardContent}
          onChange={(e) => setCardContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter card content..."
          className="text-sm"
          disabled={addingCard}
          autoFocus
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={addingCard} className="grid place-items-center">
            <Loader2Icon className={`col-start-1 row-start-1 animate-spin${addingCard ? " visible" : " invisible"}`} />
            <span className={`col-start-1 row-start-1${addingCard ? " invisible" : " visible"}`}>Save</span>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleCancel} disabled={addingCard}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </form>
    </li>
  );

  return (
    <li className="flex flex-col gap-2 bg-card rounded-lg w-64 max-h-full border overflow-hidden py-2">
      <div className="flex justify-between items-center gap-2 px-2">
        <h2 className="truncate font-medium text-muted-foreground">{listName}</h2>
        <ListActions listId={listId} onAddCard={() => handleStartCreatingAtTop()} />
      </div>

      <ul className="flex flex-col px-1 mx-1 gap-2 list-none overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent]">
        {/* Show card creation form at top if triggered from dropdown */}
        {isCreating === "top" && <CardCreateForm />}

        {cardsLoading ? (
          <li className="text-center py-4 text-sm text-muted-foreground">Loading cards...</li>
        ) : (
          cards.map((card) => <Card key={card._id} card={card} />)
        )}

        {/* Show card creation form at bottom if triggered from bottom button */}
        {isCreating === "bottom" && <CardCreateForm />}
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
