import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { Loader2, Loader2Icon, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/_lib/utils";
import { validateUrl, createCardLink, type CardLink } from "@/_lib/links";

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
      className="space-y-3 p-3 border border-border/50 rounded-md bg-muted/30 mb-3 relative z-10 w-full"
      // Prevent drag events from bubbling to avoid interference with link drag-and-drop
      onDragStart={(e) => e.stopPropagation()}
      onDragOver={(e) => e.stopPropagation()}
      onDrop={(e) => e.stopPropagation()}>
      {/* Input fields container with responsive layout */}
      <div className="space-y-3 sm:space-y-2">
        <div className="space-y-2">
          <Label htmlFor="link-url" className="text-xs text-muted-foreground">
            URL *
          </Label>
          <Input
            id="link-url"
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com"
            required
            autoFocus
            aria-invalid={!!urlError}
            className={cn("h-8 text-sm w-full", urlError && "border-destructive")}
            // Prevent drag events on input fields
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
          {urlError && (
            <p className="text-xs text-destructive" role="alert">
              {urlError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="link-title" className="text-xs text-muted-foreground">
            Title (optional)
          </Label>
          <Input
            id="link-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Link description"
            className="h-8 text-sm w-full"
            // Prevent drag events on input fields
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
          <p className="text-xs text-muted-foreground hidden sm:block">If left empty, the URL will be displayed</p>
        </div>
      </div>

      {/* Button container with responsive positioning */}
      <div className="flex items-center justify-start gap-2 pt-2">
        <Button
          type="submit"
          size="sm"
          disabled={!url.trim() || !!urlError || isSubmitting || isLoading}
          className="grid place-items-center"
          // Prevent drag events on button
          draggable={false}
          onDragStart={(e) => e.preventDefault()}>
          <Loader2Icon className={cn("col-start-1 row-start-1 animate-spin", isSubmitting ? "visible" : "invisible")} />
          <span className={cn("col-start-1 row-start-1", isSubmitting ? "invisible" : "visible")}>Add</span>
        </Button>
      </div>
    </form>
  );
}
