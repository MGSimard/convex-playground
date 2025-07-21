import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/_components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { Loader2Icon, AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/_lib/utils";

interface RenameBoardDialogProps {
  boardId: Id<"boards">;
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RenameBoardDialog({ boardId, currentName, open, onOpenChange, onSuccess }: RenameBoardDialogProps) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or currentName changes
  useEffect(() => {
    if (open) {
      setName(currentName);
      setError(null); // Clear any previous errors when dialog opens
    }
  }, [open, currentName]);

  const { mutate: renameBoard, isPending } = useMutation({
    mutationFn: useConvexMutation(api.boards.renameBoard),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); // Clear any previous errors

    const trimmedName = name.trim();

    // Client-side validation
    if (!trimmedName) {
      const errorMsg = "Board name cannot be empty.";
      setError(errorMsg);
      toast.error(`ERROR: ${errorMsg}`);
      return;
    }

    // Check if name is the same as current (no-op but allowed)
    if (trimmedName === currentName.trim()) {
      toast.success("SUCCESS: Board renamed successfully.");
      onOpenChange(false);
      onSuccess?.();
      return;
    }

    renameBoard(
      { boardId, newName: trimmedName },
      {
        onSuccess: () => {
          setError(null);
          toast.success("SUCCESS: Board renamed successfully.");
          onOpenChange(false);
          onSuccess?.();
        },
        onError: (error) => {
          console.error("Board rename error:", error);

          // Handle specific error cases as per requirements
          let errorMessage = "Failed to rename board";

          if (error.message.includes("Unauthenticated")) {
            errorMessage = "You must be logged in to rename boards";
            toast.error("ERROR: Unauthenticated");
          } else if (error.message.includes("Unauthorized")) {
            errorMessage = "You don't have permission to rename this board";
            toast.error("ERROR: Unauthorized");
          } else if (error.message.includes("not found")) {
            errorMessage = "Board not found";
            toast.error("ERROR: Board not found");
          } else if (error.message.includes("network") || error.message.includes("fetch")) {
            errorMessage = "Network error. Please check your connection and try again";
            toast.error("ERROR: Network error. Please try again.");
          } else if (error.message.includes("timeout")) {
            errorMessage = "Request timed out. Please try again";
            toast.error("ERROR: Request timed out. Please try again.");
          } else {
            // Generic error with the actual error message
            errorMessage = error.message || "An unexpected error occurred";
            toast.error(`ERROR: ${errorMessage}`);
          }

          setError(errorMessage);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  const isValid = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onKeyDown={handleKeyDown}>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Rename Board</DialogTitle>
            <DialogDescription>Enter a new name for your board.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Label htmlFor="board-name">Board Name</Label>
            <Input
              id="board-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                // Clear error when user starts typing
                if (error) {
                  setError(null);
                }
              }}
              placeholder="Enter board name"
              autoFocus
              onFocus={(e) => e.target.select()}
              disabled={isPending}
              required
              className={cn(error && "border-red-500 focus-visible:ring-red-500")}
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircleIcon className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="grid place-items-center" disabled={isPending || !isValid}>
              <Loader2Icon
                className={cn("col-start-1 row-start-1 animate-spin", isPending ? "visible" : "invisible")}
              />
              <span className={cn("col-start-1 row-start-1", isPending ? "invisible" : "visible")}>Rename Board</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
