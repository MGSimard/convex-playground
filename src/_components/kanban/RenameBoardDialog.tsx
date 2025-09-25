import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
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
import { cn } from "@/_lib/utils";

interface RenameBoardDialogProps {
  boardId: Id<"boards">;
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameBoardDialog({ boardId, currentName, open, onOpenChange }: RenameBoardDialogProps) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens or currentName changes
  useEffect(() => {
    setName(currentName);
    setError(null);
  }, [currentName]);

  // Clear error when dialog closes
  useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  const { mutate: renameBoard, isPending } = useMutation({
    mutationFn: useConvexMutation(api.boards.renameBoard),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      const errorMsg = "Board name cannot be empty.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (trimmedName === currentName.trim()) {
      toast.success("SUCCESS: Board renamed.");
      onOpenChange(false);
      return;
    }

    // Avoid stale closure by using current values
    const currentBoardId = boardId;
    const currentTrimmedName = trimmedName;

    renameBoard(
      { boardId: currentBoardId, newName: currentTrimmedName },
      {
        onSuccess: () => {
          setError(null);
          toast.success("SUCCESS: Board renamed.");
          onOpenChange(false);
        },
        onError: (err) => {
          console.error("Board rename error:", err);
          toast.error(`ERROR: Failed to rename board: ${err.message}`);
          setError(err.message);
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
            <DialogClose render={<Button variant="outline" disabled={isPending} />}>Cancel</DialogClose>
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
