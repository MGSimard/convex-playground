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

interface ListProps {
  list: Doc<"lists">;
  cards: Doc<"cards">[];
}

// <ul mx-1 px-1> makes the scrollbar position look better than px-2
export function List({ list, cards }: ListProps) {
  const [isCreating, setIsCreating] = useState<"top" | "bottom" | false>(false);
  const formRef = useRef<HTMLDivElement>(null);

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

  return (
    <li className="flex flex-col gap-2 bg-card rounded-lg w-64 max-h-full border overflow-hidden py-2">
      <div className="flex justify-between items-center gap-2 px-2">
        <h2 className="truncate font-medium text-muted-foreground">{list.name}</h2>
        <ListActions listId={list._id} onAddCard={handleStartCreatingAtTop} />
      </div>

      <ul className="flex flex-col px-1 mx-1 py-2 gap-2 list-none overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent]">
        {/* Show card creation form at top if triggered from dropdown */}
        {isCreating === "top" && (
          <div ref={formRef}>
            <CardCreateForm listId={list._id} cards={cards} placement="top" onComplete={handleCreationComplete} />
          </div>
        )}
        {cards.length === 0 ? (
          <li className="text-sm font-medium border text-muted-foreground flex items-center justify-center p-4 bg-[repeating-linear-gradient(45deg,var(--border),var(--border)_4px,transparent_4px,transparent_8px)]">
            Empty
          </li>
        ) : (
          cards.map((card) => <Card key={card._id} card={card} />)
        )}
        {/* Show card creation form at bottom if triggered from bottom button */}
        {isCreating === "bottom" && (
          <div ref={formRef}>
            <CardCreateForm listId={list._id} cards={cards} placement="bottom" onComplete={handleCreationComplete} />
          </div>
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
      }, 10);
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
            toast.success("Card created successfully!");
            setCardContent("");
            onComplete();
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
}
