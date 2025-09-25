import { Loader2Icon, Plus } from "lucide-react";
import { useState } from "react";
import type {CardLink} from "@/_lib/links";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { cn } from "@/_lib/utils";
import {  createCardLink, validateUrl } from "@/_lib/links";

interface AddLinkFormProps {
  onAdd: (link: Omit<CardLink, "id">) => void;
  isLoading?: boolean;
}

export function AddLinkForm({ onAdd, isLoading = false }: AddLinkFormProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time URL validation
  const handleUrlChange = (value: string) => {
    setUrl(value);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();

    // Validate URL before submission
    const validation = validateUrl(trimmedUrl);
    if (!validation.isValid) {
      setUrlError(validation.error || "Invalid URL");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the link object
      const newLink = createCardLink(trimmedUrl, trimmedTitle || undefined);

      // Call the onAdd callback with the link data (without id since parent will handle it)
      onAdd({
        url: newLink.url,
        title: newLink.title,
      });

      // Reset form after successful addition
      setUrl("");
      setTitle("");
      setUrlError(null);
    } catch (error) {
      // Handle any errors from createCardLink or onAdd
      const errorMessage = error instanceof Error ? error.message : "Failed to add link";
      setUrlError(errorMessage);

      // Keep form expanded so user can correct the error
      // Don't reset form values so user doesn't lose their input
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 p-2 border border-border/50 rounded-md bg-muted/30 mb-2 relative z-10 w-full"
      // Prevent drag events from bubbling to avoid interference with link drag-and-drop
      onDragStart={(e) => e.stopPropagation()}
      onDragOver={(e) => e.stopPropagation()}
      onDrop={(e) => e.stopPropagation()}>
      {/* Compact grid layout for inputs */}
      <div className="grid grid-cols-1 gap-1.5">
        <div className="space-y-1">
          <Input
            id="link-url"
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="URL (required)"
            required
            autoFocus
            aria-invalid={!!urlError}
            className={cn("h-7 text-xs w-full", urlError && "border-destructive")}
            // Prevent drag events on input fields
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
          {urlError && (
            <p className="text-xs text-destructive leading-tight" role="alert">
              {urlError}
            </p>
          )}
        </div>

        <div className="flex gap-1.5">
          <Input
            id="link-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="h-7 text-xs flex-1"
            // Prevent drag events on input fields
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!url.trim() || !!urlError || isSubmitting || isLoading}
            className="h-7 w-7 grid place-items-center shrink-0"
            // Prevent drag events on button
            draggable={false}
            onDragStart={(e) => e.preventDefault()}>
            <Loader2Icon
              className={cn("col-start-1 row-start-1 animate-spin w-3 h-3", isSubmitting ? "visible" : "invisible")}
            />
            <Plus className={cn("col-start-1 row-start-1 w-3 h-3", isSubmitting ? "invisible" : "visible")} />
          </Button>
        </div>
      </div>
    </form>
  );
}
