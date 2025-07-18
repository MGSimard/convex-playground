import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/_lib/utils";
import { validateUrl, createCardLink, type CardLink } from "@/_lib/links";

interface AddLinkFormProps {
  onAdd: (link: Omit<CardLink, "id">) => void;
  isLoading?: boolean;
  onExpandedChange?: (isExpanded: boolean) => void;
}

export function AddLinkForm({ onAdd, isLoading = false, onExpandedChange }: AddLinkFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
      setIsExpanded(false);
      onExpandedChange?.(false);
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

  const handleCancel = () => {
    setUrl("");
    setTitle("");
    setUrlError(null);
    setIsExpanded(false);
    onExpandedChange?.(false);
  };

  if (!isExpanded) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setIsExpanded(true);
          onExpandedChange?.(true);
        }}
        disabled={isLoading}
        className="w-full justify-start gap-2">
        <Plus className="h-4 w-4" />
        Add Link
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 border rounded-md bg-card">
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
          className={cn(urlError && "border-destructive")}
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
        />
        <p className="text-xs text-muted-foreground">If left empty, the URL will be displayed</p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button
          type="submit"
          size="sm"
          disabled={!url.trim() || !!urlError || isSubmitting || isLoading}
          className="grid place-items-center">
          <Loader2
            className={cn("col-start-1 row-start-1 h-4 w-4 animate-spin", isSubmitting ? "visible" : "invisible")}
          />
          <span className={cn("col-start-1 row-start-1", isSubmitting ? "invisible" : "visible")}>Add Link</span>
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleCancel} disabled={isSubmitting || isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
