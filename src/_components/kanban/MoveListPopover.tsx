import { useState, useRef } from "react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { PopoverClose } from "@/_components/ui/popover";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/_lib/utils";
import { toast } from "sonner";
import { calculatePositionForIndex } from "@/_lib/drag-and-drop";
import type { Id } from "../../../convex/_generated/dataModel";

interface MoveListPopoverProps {
  listId: Id<"lists">;
  currentPosition: number;
  totalLists: number;
  boardId: Id<"boards">;
  allLists: Array<{ _id: Id<"lists">; position: number }>;
  onReorderLists: (boardId: Id<"boards">, listUpdates: Array<{ listId: Id<"lists">; position: number }>) => void;
}

interface ValidationState {
  isValid: boolean;
  errorMessage?: string;
}

export function MoveListPopover({
  listId,
  currentPosition,
  totalLists,
  boardId,
  allLists,
  onReorderLists,
}: MoveListPopoverProps) {
  const [position, setPosition] = useState<string>(currentPosition.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({ isValid: true });
  const [lastError, setLastError] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);

  // Refs for focus management
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

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

    // If same position, just close without action (requirement 2.5)
    if (newPosition === currentPosition) {
      // Close popover by clicking outside or using PopoverClose
      return;
    }

    setIsLoading(true);

    try {
      // Convert 1-based user input to 0-based index for position calculation
      const targetIndex = convertPositionToIndex(newPosition);

      // Sort lists by position to ensure correct ordering
      const sortedLists = [...allLists].sort((a, b) => a.position - b.position);

      // Calculate the new position value using the existing drag-and-drop utility
      const newPositionValue = calculatePositionForIndex(sortedLists, targetIndex);

      // Call the onReorderLists callback with the new position
      await onReorderLists(boardId, [{ listId, position: newPositionValue }]);

      // Show success toast notification (requirement 2.3)
      toast.success("SUCCESS: List moved successfully");

      // Close the popover by clicking the close button
      closeRef.current?.click();
    } catch (error) {
      console.error("ERROR: ", error);

      // Comprehensive error handling for different failure types
      let errorMessage = "Failed to move list. Please try again.";
      let isNetworkError = false;

      if (error instanceof Error) {
        // Handle specific error types
        if (
          error.message.includes("network") ||
          error.message.includes("fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("Failed to fetch")
        ) {
          errorMessage = `Network error: ${error.message}. Please check your connection and try again.`;
          isNetworkError = true;
        } else if (
          error.message.includes("permission") ||
          error.message.includes("unauthorized") ||
          error.message.includes("403")
        ) {
          errorMessage = `Permission error: ${error.message}. You may not have permission to move this list.`;
        } else if (
          error.message.includes("validation") ||
          error.message.includes("invalid") ||
          error.message.includes("400")
        ) {
          errorMessage = `Validation error: ${error.message}. Please check your input and try again.`;
        } else {
          errorMessage = `ERROR: Failed to move list: ${error.message}`;
        }
      } else if (typeof error === "string") {
        errorMessage = `ERROR: Failed to move list: ${error}`;
      }

      // Store error details for potential retry
      setLastError(errorMessage);
      setShowRetry(isNetworkError);

      // Show error toast notification with specific error details (requirement 2.4)
      toast.error(errorMessage);

      // Keep the popover open so user can retry
    } finally {
      setIsLoading(false);
    }
  };

  // Handle retry for network errors
  const handleRetry = () => {
    setLastError(null);
    setShowRetry(false);
    // Trigger form submission again
    const form = document.getElementById("move-list-form") as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  // Handle cancel - will use PopoverClose to close the popover

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
    // Escape key will be handled by Popover automatically
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <h4 id="move-list-title" className="font-medium leading-none">
          Move List
        </h4>
        <p id="move-list-description" className="text-sm text-muted-foreground">
          Position {currentPosition} of {totalLists} lists
        </p>
      </div>

      {/* Form */}
      <form id="move-list-form" onSubmit={handleSubmit} className="space-y-4" role="form" aria-label="Move list form">
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
            aria-describedby={validation.errorMessage ? "position-error" : "move-list-description"}
            aria-invalid={!!validation.errorMessage}
            aria-required="true"
            aria-label={`Enter new position for list, currently at position ${currentPosition} of ${totalLists}`}
          />
          {validation.errorMessage && (
            <p
              id="position-error"
              className="text-sm text-destructive"
              role="alert"
              aria-live="polite"
              aria-atomic="true">
              {validation.errorMessage}
            </p>
          )}
        </div>

        {/* Network Error Retry Section */}
        {showRetry && lastError && (
          <div className="space-y-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive" role="alert" aria-live="polite">
              {lastError}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isLoading}
              className="w-full"
              aria-label="Retry moving list after network error">
              Retry
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2" role="group" aria-label="Form actions">
          <PopoverClose asChild>
            <Button
              ref={closeRef}
              type="button"
              variant="outline"
              disabled={isLoading}
              aria-label="Cancel move operation">
              Cancel
            </Button>
          </PopoverClose>
          <Button
            type="submit"
            disabled={!validation.isValid || isLoading}
            className="grid place-items-center"
            aria-label={isLoading ? "Moving list..." : "Move list to new position"}
            aria-describedby={isLoading ? "loading-status" : undefined}>
            <Loader2Icon
              className={cn("col-start-1 row-start-1 animate-spin", isLoading ? "visible" : "invisible")}
              aria-hidden="true"
            />
            <span className={cn("col-start-1 row-start-1", isLoading ? "invisible" : "visible")}>Move</span>
            {isLoading && (
              <span id="loading-status" className="sr-only">
                Moving list, please wait...
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
