import { Button } from "@/_components/ui/button";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { SquarePen, Link, FileText, ExternalLink, Loader2Icon, Trash2 } from "lucide-react";
import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/_components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/_components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/_components/ui/tooltip";
import { cn } from "@/_lib/utils";
import { Textarea } from "@/_components/ui/textarea";
import { Label } from "@/_components/ui/label";
import { LinkItem } from "@/_components/kanban/LinkItem";
import { AddLinkForm } from "@/_components/kanban/AddLinkForm";
import {
  type CardLink,
  generateLinkId,
  reorderLinks,
  findLinkIndex,
  removeLinkById,
  updateLinkById,
} from "@/_lib/links";
import { useConvexMutation } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { Separator } from "../ui/separator";

const TABS = [
  {
    label: "Content",
    icon: <FileText />,
  },
  {
    label: "Links",
    icon: <Link />,
  },
] as const;
type Tab = (typeof TABS)[number];

interface EditCardProps {
  card: Doc<"cards">;
}

export function EditCard({ card }: EditCardProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(TABS[0]);
  const [cardText, setCardText] = useState(card.content);
  const [cardLinks, setCardLinks] = useState<CardLink[]>(card.links || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Original values for dirty state comparison
  const [originalText] = useState(card.content);
  const [originalLinks] = useState<CardLink[]>(card.links || []);

  // Query to get current user data for permission checking
  const { data: currentUser } = useQuery(convexQuery(api.auth.currentUserData, {}));

  // Check if user has admin permissions for delete functionality
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "owner";

  // Mutations
  const updateCardContent = useConvexMutation(api.cards.updateCardContent);
  const removeCard = useConvexMutation(api.cards.removeCard);



  // Check if there are unsaved changes (dirty state)
  const isDirty = cardText !== originalText || JSON.stringify(cardLinks) !== JSON.stringify(originalLinks);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setCardText(card.content);
      setCardLinks(card.links || []);
      setActiveTab(TABS[0]);
    }
  }, [open, card.content, card.links]);

  // Handle save operation
  const handleSave = async () => {
    if (!isDirty) return;

    setIsSaving(true);
    try {
      await updateCardContent({
        cardId: card._id as Id<"cards">,
        content: cardText.trim() !== "" ? cardText.trim() : undefined,
        links: cardLinks.length > 0 ? cardLinks : undefined,
      });

      toast.success("SUCCESS: Card updated.");
      setOpen(false);
    } catch (error) {
      console.error("Failed to save card:", error);
      toast.error(`ERROR: Failed to save card: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel operation
  const handleCancel = () => {
    if (isDirty) {
      setShowUnsavedAlert(true);
    } else {
      setOpen(false);
    }
  };

  // Handle dialog close with dirty state check
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isDirty) {
      setShowUnsavedAlert(true);
    } else {
      setOpen(newOpen);
    }
  };

  // Handle confirming cancellation (discard changes)
  const handleConfirmCancel = () => {
    setShowUnsavedAlert(false);
    setOpen(false);
  };

  // Handle card deletion with loading states and user feedback
  const handleDeleteCard = async () => {
    setIsDeleting(true);
    try {
      await removeCard({
        cardId: card._id as Id<"cards">,
      });

      toast.success("SUCCESS: Card deleted.");
      setShowDeleteDialog(false);
      setOpen(false); // Close the edit dialog after successful deletion
    } catch (error) {
      console.error("Failed to delete card:", error);
      toast.error(`ERROR: Failed to delete card: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="bg-muted size-6 absolute top-1 right-1 z-10 invisible group-hover:visible transition-all duration-150">
            <SquarePen />
          </Button>
        </DialogTrigger>
        <DialogContent className="overflow-hidden p-0 gap-0 flex h-[min(500px,calc(100dvh-32px))] max-w-[min(500px,calc(100dvw-32px))]">
          <nav className="shrink-0 border-r bg-sidebar p-2">
            <ul className="flex flex-col gap-2">
              {TABS.map((tab) => (
                <li key={tab.label}>
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab(tab)}
                    className={cn("size-8", activeTab?.label === tab.label && "bg-primary! text-primary-foreground!")}
                    aria-label={tab.label}>
                    {tab.icon}
                  </Button>
                </li>
              ))}
              <li><Separator /></li>
              {/* Delete button - positioned below tabs */}
              <li>
                {isAdmin ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 hover:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    aria-label="Delete card"
                  >
                    <Trash2/>
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground cursor-not-allowed opacity-50"
                          aria-disabled
                          aria-label="Delete card (requires admin role)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    ></TooltipTrigger>
                    <TooltipContent>Requires admin role</TooltipContent>
                  </Tooltip>
                )}
              </li>
            </ul>
          </nav>
          <main className="flex flex-col w-full overflow-hidden">
            <header className="shrink-0 p-4 border-b">
              <DialogTitle className="flex items-center gap-2">Edit Card</DialogTitle>
              <DialogDescription className="sr-only">Edit the card content and links.</DialogDescription>
            </header>
            <div className="grow flex flex-col gap-4 p-4 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent]">
              {activeTab.label === "Content" && <TabContent content={cardText} setCardText={setCardText} />}
              {activeTab.label === "Links" && (
                <TabLinks cardId={card._id} links={cardLinks} onLinksChange={setCardLinks} />
              )}
            </div>
            <div className="shrink-0 flex items-center justify-end gap-2 p-4 border-t">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving || isDeleting}>
                Cancel
              </Button>
              <Button className="grid place-items-center" onClick={handleSave} disabled={!isDirty || isSaving || isDeleting}>
                <Loader2Icon
                  className={cn("col-start-1 row-start-1 animate-spin", isSaving ? "visible" : "invisible")}
                />
                <span className={cn("col-start-1 row-start-1", isSaving ? "invisible" : "visible")}>Save</span>
              </Button>
            </div>
          </main>
        </DialogContent>
      </Dialog>

      {/* Unsaved changes alert dialog */}
      <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost if you continue. Are you sure you want to discard your changes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>Discard Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the card and all its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCard} disabled={isDeleting} className="grid place-items-center bg-destructive hover:bg-destructive">
              <Loader2Icon
                className={cn("col-start-1 row-start-1 animate-spin", isDeleting ? "visible" : "invisible")}
              />
              <span className={cn("col-start-1 row-start-1", isDeleting ? "invisible" : "visible")}>Delete</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface TabContentProps {
  content: string;
  setCardText: Dispatch<SetStateAction<string>>;
}

function TabContent({ content, setCardText }: TabContentProps) {
  return (
    <>
      <Label htmlFor="card-content" className="text-xs text-muted-foreground">
        Describe the task, add notes, or provide detailed information.
      </Label>
      <Textarea
        id="card-content"
        value={content}
        onChange={(e) => setCardText(e.target.value)}
        placeholder="Enter card content..."
        className="min-h-[150px] resize-none [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent]"
        required
        minLength={1}
        autoFocus
      />
    </>
  );
}

interface TabLinksProps {
  cardId: Id<"cards">;
  links: CardLink[];
  onLinksChange: (links: CardLink[]) => void;
}

function TabLinks({ cardId, links, onLinksChange }: TabLinksProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Clear error after a delay
  const clearError = () => {
    setTimeout(() => setError(null), 5000);
  };

  // Handle adding a new link
  const handleAddLink = (linkData: Omit<CardLink, "id">) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check for duplicate URLs
      const isDuplicate = links.some((link) => link.url === linkData.url);
      if (isDuplicate) {
        throw new Error("ERROR: This URL has already been added to this card.");
      }

      const newLink: CardLink = {
        id: generateLinkId(),
        url: linkData.url,
        title: linkData.title,
      };

      const updatedLinks = [...links, newLink];
      onLinksChange(updatedLinks);
      toast.success("SUCCESS: Link added.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add link.";
      setError(errorMessage);
      toast.error(`ERROR: ${errorMessage}`);
      clearError();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle updating an existing link
  const handleUpdateLink = (linkId: string, updates: Partial<CardLink>) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check for duplicate URLs if URL is being updated
      if (updates.url) {
        const isDuplicate = links.some((link) => link.id !== linkId && link.url === updates.url);
        if (isDuplicate) {
          throw new Error("ERROR: This URL is already used by another link in this card");
        }
      }

      const updatedLinks = updateLinkById(links, linkId, updates);
      onLinksChange(updatedLinks);
      toast.success("SUCCESS: Link updated.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update link.";
      setError(errorMessage);
      toast.error(`ERROR: ${errorMessage}`);
      clearError();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a link
  const handleDeleteLink = (linkId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedLinks = removeLinkById(links, linkId);
      onLinksChange(updatedLinks);
      toast.success("SUCCESS: Link deleted.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete link.";
      setError(errorMessage);
      toast.error(`Failed to delete link: ${errorMessage}`);
      clearError();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reordering links via drag and drop
  const handleReorderLinks = (sourceLinkId: string, targetIndex: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const sourceIndex = findLinkIndex(links, sourceLinkId);
      if (sourceIndex === -1) {
        throw new Error("ERROR: Source link not found. The link may have been removed.");
      }

      const reorderedLinks = reorderLinks(links, sourceIndex, targetIndex);
      onLinksChange(reorderedLinks);
      // Don't show success toast for reordering as it's a frequent operation
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reorder links";
      setError(errorMessage);
      toast.error(`ERROR: ${errorMessage}`);
      clearError();
    } finally {
      setIsLoading(false);
    }
  };

  // Set up autoscroll for the links container
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const cleanupAutoScroll = autoScrollForElements({
      element: scrollContainer,
      getAllowedAxis: () => "vertical",
      getConfiguration: () => ({
        maxScrollSpeed: "standard",
        startScrollingThreshold: "percentage-based",
        maxPixelScrollDelta: 6,
      }),
    });

    return () => {
      cleanupAutoScroll();
    };
  }, [links]);

  return (
    <div className="flex flex-col h-full">
      {/* Header description */}
      <div className="flex-shrink-0 mb-4">
        <p className="text-xs text-muted-foreground">
          Add external resources, references, or related content to this card.
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex-shrink-0 mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive font-medium">Error</p>
          <p className="text-xs text-destructive/80 mt-1">{error}</p>
        </div>
      )}

      {/* Add link form - positioned at top with clear visual hierarchy */}
      <div className="flex-shrink-0">
        <AddLinkForm onAdd={handleAddLink} isLoading={isLoading} />
      </div>

      {/* Links list container with proper spacing and responsive behavior */}
      <div className="flex-1 min-h-0">
        {links.length > 0 ? (
          <div
            ref={scrollContainerRef}
            className="space-y-2 h-full overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent] py-2 px-2">
            {links.map((link, index) => (
              <LinkItem
                key={link.id}
                link={link}
                index={index}
                cardId={cardId}
                onUpdate={handleUpdateLink}
                onDelete={handleDeleteLink}
                onReorder={handleReorderLinks}
                isLoading={isLoading}
              />
            ))}
          </div>
        ) : (
          /* Empty state when no links exist below the form */
          <div className="flex flex-col items-center justify-center py-8 text-center h-full min-h-[120px]">
            <ExternalLink className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-1">No links added yet</p>
            <p className="text-xs text-muted-foreground">Use the form above to add your first link.</p>
          </div>
        )}
      </div>
    </div>
  );
}
