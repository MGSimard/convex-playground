import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/_components/ui/alert-dialog";
import { GripVertical, Edit2, Trash2, ExternalLink, Check, X, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { DropIndicator } from "@/_components/kanban/DropIndicator";
import { useDragAndDrop } from "@/_hooks/useDragAndDrop";
import { cn } from "@/_lib/utils";
import {
  type CardLink,
  type LinkDragData,
  type LinkDropData,
  validateUrl,
  updateCardLink,
  getLinkDisplayText,
} from "@/_lib/links";
import {
  type Edge,
  attachClosestEdge,
  extractClosestEdge,
  getReorderDestinationIndex,
  dragRegistry,
} from "@/_lib/drag-and-drop";
import type { Id } from "../../../convex/_generated/dataModel";

interface LinkItemProps {
  link: CardLink;
  index: number;
  cardId: Id<"cards">;
  onUpdate: (id: string, updates: Partial<CardLink>) => void;
  onDelete: (id: string) => void;
  onReorder: (sourceLinkId: string, targetIndex: number) => void;
  isLoading?: boolean;
}

export function LinkItem({ link, index, cardId, onUpdate, onDelete, onReorder, isLoading = false }: LinkItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(link.url);
  const [editTitle, setEditTitle] = useState(link.title || "");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  const linkRef = useRef<HTMLDivElement>(null);
  const dragState = useDragAndDrop();

  const isDragging =
    dragState.isDragging && dragState.draggedItem?.type === "link" && dragState.draggedItem.linkId === link.id;
  const isBeingDraggedOver = isDraggedOver && dragState.isDragging;

  // Set up drag and drop
  useEffect(() => {
    const element = linkRef.current;
    if (!element) return;

    const dragData: LinkDragData = {
      type: "link",
      linkId: link.id,
      cardId: cardId,
    };

    const dropData: LinkDropData = {
      type: "link",
      linkId: link.id,
      cardId: cardId,
    };

    return combine(
      // Make link draggable
      draggable({
        element,
        getInitialData: () => dragData,
        onDragStart: () => {
          dragRegistry.startDrag(dragData);
        },
        onDrop: () => {
          dragRegistry.endDrag();
        },
      }),
      // Make link a drop target
      dropTargetForElements({
        element,
        getData: ({ input, element }) =>
          attachClosestEdge(dropData, {
            input,
            element: element as HTMLElement,
            allowedEdges: ["top", "bottom"],
          }),
        getIsSticky: () => true,
        canDrop: ({ source }) => {
          const sourceData = source.data;
          return sourceData.type === "link" && sourceData.cardId === cardId && sourceData.linkId !== link.id;
        },
        onDragEnter: ({ self, source }) => {
          if (source.data.type === "link" && source.data.cardId === cardId) {
            setIsDraggedOver(true);
            setClosestEdge(extractClosestEdge(self.data));
          }
        },
        onDrag: ({ self }) => {
          setClosestEdge(extractClosestEdge(self.data));
        },
        onDragLeave: () => {
          setIsDraggedOver(false);
          setClosestEdge(null);
        },
        onDrop: ({ source }) => {
          setIsDraggedOver(false);
          setClosestEdge(null);
          const sourceData = source.data;

          if (sourceData.type === "link" && sourceData.cardId === cardId) {
            const sourceLinkId = sourceData.linkId as string;
            if (sourceLinkId === link.id) return;

            // Calculate destination index based on closest edge
            const destinationIndex = getReorderDestinationIndex({
              startIndex: -1, // Will be resolved by parent
              indexOfTarget: index,
              closestEdgeOfTarget: closestEdge,
              axis: "vertical",
            });

            // Pass the source link ID and destination index to parent
            // Parent will resolve the actual source index from the link ID
            onReorder(sourceLinkId, destinationIndex);
          }
        },
      })
    );
  }, [link.id, cardId, index, onReorder, dragState, closestEdge]);

  // Real-time URL validation during editing
  const handleUrlChange = (value: string) => {
    setEditUrl(value);

    // Clear error when user starts typing
    if (urlError && value.trim() !== "") {
      setUrlError(null);
    }

    // Validate URL in real-time if there's content
    if (value.trim()) {
      const validation = validateUrl(value);
      if (!validation.isValid) {
        setUrlError(validation.error || "Invalid URL");
      } else {
        setUrlError(null);
      }
    }
  };

  const handleSaveEdit = async () => {
    const trimmedUrl = editUrl.trim();
    const trimmedTitle = editTitle.trim();

    // Validate URL before saving
    const validation = validateUrl(trimmedUrl);
    if (!validation.isValid) {
      setUrlError(validation.error || "Invalid URL");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update the link using the utility function
      const updatedLink = updateCardLink(link, {
        url: trimmedUrl,
        title: trimmedTitle || undefined,
      });

      // Call the onUpdate callback
      onUpdate(link.id, {
        url: updatedLink.url,
        title: updatedLink.title,
      });

      // Exit edit mode
      setIsEditing(false);
      setUrlError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update link";
      setUrlError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditUrl(link.url);
    setEditTitle(link.title || "");
    setUrlError(null);
    setIsEditing(false);
  };

  const handleDelete = () => {
    try {
      onDelete(link.id);
    } catch (error) {
      // Error handling is done in the parent component, but we can provide user feedback
      console.error("Failed to delete link:", error);
      // The parent component will show the error via toast notifications
    }
  };

  const displayText = getLinkDisplayText(link);

  if (isEditing) {
    return (
      <div
        ref={linkRef}
        className={cn(
          "relative flex items-start gap-2 p-2 border rounded-md bg-card",
          isDragging && "opacity-50 scale-98"
        )}>
        {isBeingDraggedOver && closestEdge && <DropIndicator edge={closestEdge} isVisible={true} gap="4px" />}

        {/* Drag handle */}
        <div className="flex-shrink-0 mt-1">
          <GripVertical
            className="h-4 w-4 text-muted-foreground cursor-grab hover:text-foreground"
            aria-label="Drag to reorder"
          />
        </div>

        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`edit-url-${link.id}`} className="text-xs text-muted-foreground">
              URL *
            </Label>
            <Input
              id={`edit-url-${link.id}`}
              type="url"
              value={editUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com"
              required
              autoFocus
              aria-invalid={!!urlError}
              className={cn(urlError && "border-destructive")}
            />
            {urlError && (
              <p className="text-xs text-destructive" role="alert">
                {urlError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-title-${link.id}`} className="text-xs text-muted-foreground">
              Title (optional)
            </Label>
            <Input
              id={`edit-title-${link.id}`}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Link description"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSaveEdit}
              disabled={!editUrl.trim() || !!urlError || isSubmitting || isLoading}
              className="grid place-items-center">
              <Loader2
                className={cn("col-start-1 row-start-1 h-4 w-4 animate-spin", isSubmitting ? "visible" : "invisible")}
              />
              <Check className={cn("col-start-1 row-start-1 h-4 w-4", isSubmitting ? "invisible" : "visible")} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelEdit}
              disabled={isSubmitting || isLoading}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={linkRef}
      className={cn(
        "relative flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted group",
        isDragging && "opacity-50 scale-98"
      )}>
      {isBeingDraggedOver && closestEdge && <DropIndicator edge={closestEdge} isVisible={true} gap="4px" />}

      {/* Drag handle */}
      <div className="flex-shrink-0">
        <GripVertical
          className="h-4 w-4 text-muted-foreground cursor-grab hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Drag to reorder"
        />
      </div>

      {/* Link content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline truncate"
            title={displayText}>
            {displayText}
          </a>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          disabled={isLoading}
          className="h-6 w-6 p-0"
          aria-label="Edit link">
          <Edit2 className="h-3 w-3" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isLoading}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              aria-label="Delete link">
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Link</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this link? This action cannot be undone.
                <br />
                <br />
                <strong>Link:</strong> {displayText}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
