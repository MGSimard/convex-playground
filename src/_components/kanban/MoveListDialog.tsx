import { useEffect, useRef, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { cn } from "@/_lib/utils";
import { calculatePositionForIndex } from "@/_lib/drag-and-drop";

interface MoveListDialogProps {
  listId: Id<"lists">;
  currentPosition: number;
  totalLists: number;
  boardId: Id<"boards">;
  allLists: { _id: Id<"lists">; position: number }[];
  onReorderLists: (boardId: Id<"boards">, listUpdates: { listId: Id<"lists">; position: number }[]) => void;
  onClose: () => void;
}

interface ValidationState {
  isValid: boolean;
  errorMessage?: string;
}

export function MoveListDialog({
  listId,
  currentPosition,
  totalLists,
  boardId,
  allLists,
  onReorderLists,
  onClose,
}: MoveListDialogProps) {
  const [position, setPosition] = useState<string>(currentPosition.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({ isValid: true });

  // Refs for focus management
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Validate position input with comprehensive checks
  const validatePosition = (value: string): ValidationState => {
    // Check for empty input
    if (!value.trim()) {
      return {
        isValid: false,
        errorMessage: "Position is required",
      };
    }

    // Check for non-numeric input
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      return {
        isValid: false,
        errorMessage: "Position must be a number",
      };
    }

    // Check for decimal numbers (parseInt might truncate)
    if (value.includes(".")) {
      return {
        isValid: false,
        errorMessage: "Position must be a whole number",
      };
    }

    // Check for negative numbers or zero
    if (numValue < 1) {
      return {
        isValid: false,
        errorMessage: "Position must be at least 1",
      };
    }

    // Check for out of range
    if (numValue > totalLists) {
      return {
        isValid: false,
        errorMessage: `Position must be between 1 and ${totalLists}`,
      };
    }

    return {
      isValid: true,
    };
  };

  // Convert 1-based user input to 0-based index for internal logic
  const convertPositionToIndex = (userPosition: number): number => {
    return userPosition - 1;
  };

  // Handle position input change with real-time validation
  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPosition(value);

    // Perform real-time validation
    const validationResult = validatePosition(value);
    setValidation(validationResult);
  };

  // Handle form submission with comprehensive error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Re-validate before submission
    const validationResult = validatePosition(position);
    setValidation(validationResult);

    if (!validationResult.isValid) {
      return;
    }

    const newPosition = parseInt(position, 10);

    // If same position, just close without action
    if (newPosition === currentPosition) {
      onClose();
      return;
    }

    setIsLoading(true);

    try {
      // Convert 1-based user input to 0-based index for position calculation
      const targetIndex = convertPositionToIndex(newPosition);

      // Sort lists by position to ensure correct ordering
      const sortedLists = [...allLists].sort((a, b) => a.position - b.position);

      // Remove the current list from the sorted array to simulate the move
      const listsWithoutCurrent = sortedLists.filter((l) => l._id !== listId);

      // Calculate the new position value using the existing drag-and-drop utility
      // Use the array without the current list to get the correct position
      const newPositionValue = calculatePositionForIndex(listsWithoutCurrent, targetIndex);

      // Call the onReorderLists callback with the new position
      onReorderLists(boardId, [{ listId, position: newPositionValue }]);

      // Show success toast notification
      toast.success("SUCCESS: List moved.");

      // Close the dialog
      onClose();
    } catch (error) {
      console.error("ERROR: ", error);

      // Simple, standardized error handling
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`ERROR: Failed to move list: ${errorMessage}`);

      // Keep the dialog open so user can retry
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard events
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await handleSubmit(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Description */}
      <p className="text-sm text-muted-foreground">
        Position {currentPosition} of {totalLists} lists
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="position-input">New position</Label>
          <Input
            ref={inputRef}
            id="position-input"
            type="number"
            min={1}
            max={totalLists}
            value={position}
            onChange={handlePositionChange}
            onKeyDown={handleKeyDown}
            placeholder={`Enter position (1-${totalLists})`}
            className={cn(validation.errorMessage && "border-destructive focus-visible:border-destructive")}
            disabled={isLoading}
            aria-describedby={validation.errorMessage ? "position-error" : undefined}
            aria-invalid={!!validation.errorMessage}
            aria-required="true"
          />
          {validation.errorMessage && (
            <p id="position-error" className="text-sm text-destructive" role="alert" aria-live="polite">
              {validation.errorMessage}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={!validation.isValid || isLoading} className="grid place-items-center">
            <Loader2Icon
              className={cn("col-start-1 row-start-1 animate-spin", isLoading ? "visible" : "invisible")}
              aria-hidden="true"
            />
            <span className={cn("col-start-1 row-start-1", isLoading ? "invisible" : "visible")}>Move</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
