import { Check, Edit2, GripVertical, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import type { CardLink, LinkDragData, LinkDropData } from "@/_lib/links";
import type { Edge } from "@/_lib/drag-and-drop";
import type { Id } from "../../../convex/_generated/dataModel";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/_components/ui/popover";
import { DropIndicator } from "@/_components/kanban/DropIndicator";
import { useDragAndDrop } from "@/_hooks/useDragAndDrop";
import { cn } from "@/_lib/utils";
import { updateCardLink, validateUrl } from "@/_lib/links";
import { attachClosestEdge, dragRegistry, extractClosestEdge, getReorderDestinationIndex } from "@/_lib/drag-and-drop";

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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [editUrl, setEditUrl] = useState(link.url);
  const [editTitle, setEditTitle] = useState(link.title ?? "");
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
    if (!element || isPopoverOpen) return;

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
        getData: ({ input, element: targetElement }) =>
          attachClosestEdge(dropData, {
            input,
            element: targetElement as HTMLElement,
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
  }, [link.id, cardId, index, onReorder, dragState, closestEdge, isPopoverOpen]);

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
        setUrlError(validation.error ?? "Invalid URL");
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
      setUrlError(validation.error ?? "Invalid URL");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update the link using the utility function
      const updatedLink = updateCardLink(link, {
        url: trimmedUrl,
        title: trimmedTitle,
      });

      // Call the onUpdate callback
      onUpdate(link.id, {
        url: updatedLink.url,
        title: updatedLink.title,
      });

      // Close popover and reset state
      setIsPopoverOpen(false);
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
    setEditTitle(link.title ?? "");
    setUrlError(null);
    setIsPopoverOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      // Reset form when opening
      setEditUrl(link.url);
      setEditTitle(link.title ?? "");
      setUrlError(null);
    }
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

  return (
    <div
      ref={linkRef}
      className={cn(
        "relative flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted group",
        isDragging && "opacity-50 scale-98"
      )}>
      {isBeingDraggedOver && closestEdge && <DropIndicator edge={closestEdge} isVisible={true} gap="8px" />}

      {/* Drag handle */}
      <div className="flex-shrink-0">
        <GripVertical
          className="h-4 w-4 text-muted-foreground cursor-grab hover:text-foreground transition-colors"
          aria-label="Drag to reorder"
          aria-disabled="false"
          role="button"
          tabIndex={0}
        />
      </div>

      {/* Link content */}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0 text-xs text-muted-foreground hover:text-foreground hover:underline flex flex-col gap-0.5"
        title={link.title ? `${link.title} - ${link.url}` : link.url}>
        {link.title && <span className="truncate font-medium text-foreground">{link.title}</span>}
        <span className="truncate text-muted-foreground">{link.url}</span>
      </a>

      {/* Action buttons */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <Popover open={isPopoverOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isLoading}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Edit link"
              />
            }>
            <Edit2 className="h-3 w-3" />
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Edit Link</h4>
                <p className="text-sm text-muted-foreground">Update the URL and title for this link.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`edit-url-${link.id}`} className="text-sm">
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
                    <p className="text-sm text-destructive" role="alert">
                      {urlError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`edit-title-${link.id}`} className="text-sm">
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

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={!editUrl.trim() || !!urlError || isSubmitting || isLoading}
                    className="flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting || isLoading}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isLoading}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                aria-label="Delete link"
              />
            }>
            <Trash2 className="h-3 w-3" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Link</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this link? This action cannot be undone.
                <br />
                <br />
                <div className="space-y-1">
                  {link.title && (
                    <div>
                      <strong>Title:</strong> {link.title}
                    </div>
                  )}
                  <div>
                    <strong>URL:</strong> {link.url}
                  </div>
                </div>
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
