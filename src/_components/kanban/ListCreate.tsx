import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Plus, X, Loader2Icon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import type { Doc } from "../../../convex/_generated/dataModel";

interface ListCreateProps {
  board: Doc<"boards">;
}

export function ListCreate({ board }: ListCreateProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [listName, setListName] = useState("");
  const formRef = useRef<HTMLLIElement>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: useConvexMutation(api.lists.addList),
  });

  // Handle click outside to cancel form (same pattern as in List.tsx)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCreating && formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsCreating(false);
        setListName("");
      }
    };

    if (isCreating) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCreating]);

  const handleStartCreating = () => {
    setIsCreating(true);
    setListName("");
  };

  const handleCancel = () => {
    setIsCreating(false);
    setListName("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = listName.trim();
    if (trimmedName) {
      // Use current timestamp as position - simple and works
      // TODO: Store ordering instead once we implement drag & drop
      const position = Date.now();

      mutate(
        {
          boardId: board._id,
          name: trimmedName,
          position: position,
        },
        {
          onSuccess: () => {
            toast.success("SUCCESS: List created successfully.");
            setIsCreating(false);
            setListName("");
          },
          onError: (error) => {
            toast.error(`ERROR: Failed to create list: ${error.message}`);
          },
        }
      );
    } else {
      toast.error("ERROR: List name cannot be empty.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave(e);
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isCreating) {
    return (
      <li ref={formRef} className="bg-card rounded-lg w-64 max-h-full border overflow-hidden p-2">
        <form onSubmit={handleSave} className="space-y-2">
          <Input
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter list name..."
            className="text-sm"
            disabled={isPending}
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending} className="flex-1 grid place-items-center">
              <Loader2Icon className={`col-start-1 row-start-1 animate-spin${isPending ? " visible" : " invisible"}`} />
              <span className={`col-start-1 row-start-1${isPending ? " invisible" : " visible"}`}>Save</span>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleCancel} disabled={isPending}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="bg-card rounded-lg w-64 max-h-full border overflow-hidden opacity-70 hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground w-full justify-start"
        onClick={handleStartCreating}>
        <Plus /> Add new list
      </Button>
    </li>
  );
}
