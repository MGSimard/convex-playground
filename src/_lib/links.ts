import type { Id } from "../../convex/_generated/dataModel";

// CardLink interface matching the Convex schema
export interface CardLink {
  id: string;
  url: string;
  title?: string;
}

// Drag and drop data types for links
export interface LinkDragData extends Record<string | symbol, unknown> {
  type: "link";
  linkId: string;
  cardId: Id<"cards">;
}

export interface LinkDropData extends Record<string | symbol, unknown> {
  type: "link";
  linkId: string;
  cardId: Id<"cards">;
  closestEdge?: "top" | "bottom" | null;
}

// Enhanced URL validation function with comprehensive error handling
export function validateUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || url.trim().length === 0) {
    return { isValid: false, error: "URL is required" };
  }

  const trimmedUrl = url.trim();

  // Check for maximum URL length (common limit is 2048 characters)
  if (trimmedUrl.length > 2048) {
    return { isValid: false, error: "URL is too long (maximum 2048 characters)" };
  }

  // Check for suspicious characters that might indicate malicious URLs
  const suspiciousPatterns = [/javascript:/i, /data:/i, /vbscript:/i, /file:/i];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmedUrl)) {
      return { isValid: false, error: "URL contains potentially unsafe content" };
    }
  }

  try {
    // Try to create a URL object to validate format
    const urlObj = new URL(trimmedUrl);

    // Check for valid protocols
    const validProtocols = ["http:", "https:", "ftp:", "ftps:", "mailto:", "tel:"];
    if (!validProtocols.includes(urlObj.protocol)) {
      return { isValid: false, error: "URL must use a valid protocol (http, https, ftp, ftps, mailto, tel)" };
    }

    // Additional validation for http/https URLs
    if (urlObj.protocol === "http:" || urlObj.protocol === "https:") {
      if (!urlObj.hostname || urlObj.hostname.length === 0) {
        return { isValid: false, error: "URL must include a valid domain name" };
      }

      // Check for localhost in production (optional security measure)
      if (
        process.env.NODE_ENV === "production" &&
        (urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1")
      ) {
        return { isValid: false, error: "Localhost URLs are not allowed" };
      }
    }

    return { isValid: true };
  } catch (error) {
    // If URL constructor fails, try adding https:// prefix for common cases
    if (!trimmedUrl.includes("://")) {
      try {
        const testUrl = new URL(`https://${trimmedUrl}`);
        if (testUrl.hostname && testUrl.hostname.length > 0) {
          return { isValid: false, error: "URL must include protocol (e.g., https://)" };
        }
      } catch {
        return { isValid: false, error: "Invalid URL format" };
      }
    }

    return { isValid: false, error: "Invalid URL format" };
  }
}

// Utility function to generate unique IDs for links
export function generateLinkId(): string {
  // Generate a unique ID using timestamp and random string
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `link_${timestamp}_${randomStr}`;
}

// Utility function to normalize URL (add https:// if missing protocol)
export function normalizeUrl(url: string): string {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return trimmedUrl;
  }

  // If URL doesn't have a protocol, add https://
  if (!trimmedUrl.includes("://")) {
    return `https://${trimmedUrl}`;
  }

  return trimmedUrl;
}

// Utility function to create a new CardLink with error handling
export function createCardLink(url: string, title?: string): CardLink {
  const validation = validateUrl(url);
  if (!validation.isValid) {
    throw new Error(validation.error ?? "Invalid URL");
  }

  return {
    id: generateLinkId(),
    url: normalizeUrl(url),
    title: title?.trim() ?? undefined,
  };
}

// Utility function to update a CardLink with error handling
export function updateCardLink(link: CardLink, updates: { url?: string; title?: string }): CardLink {
  if (!link.id) {
    throw new Error("Invalid link object");
  }

  const updatedLink = { ...link };

  if (updates.url !== undefined) {
    const validation = validateUrl(updates.url);
    if (!validation.isValid) {
      throw new Error(validation.error ?? "Invalid URL");
    }
    updatedLink.url = normalizeUrl(updates.url);
  }

  if (updates.title !== undefined) {
    updatedLink.title = updates.title.trim() || undefined;
  }

  return updatedLink;
}

// Utility function to reorder links array with proper error handling
export function reorderLinks(links: CardLink[], fromIndex: number, toIndex: number): CardLink[] {
  // Validate input parameters
  if (!Array.isArray(links)) {
    throw new Error("Links must be an array");
  }

  if (fromIndex === toIndex) {
    return links; // No change needed
  }

  if (fromIndex < 0 || toIndex < 0) {
    throw new Error("Indices must be non-negative");
  }

  if (fromIndex >= links.length || toIndex > links.length) {
    throw new Error("Index out of bounds");
  }

  // Perform the reordering
  const newLinks = [...links];
  const movedItems = newLinks.splice(fromIndex, 1);

  if (movedItems.length === 0) {
    throw new Error("No item found at source index");
  }

  const movedLink = movedItems[0];
  if (!movedLink) {
    throw new Error("Invalid link at source index");
  }

  // Insert at the target index
  newLinks.splice(toIndex, 0, movedLink);

  return newLinks;
}

// Type guards for drag and drop
export function isLinkDragData(data: Record<string | symbol, unknown>): data is LinkDragData {
  return data.type === "link" && typeof data.linkId === "string" && typeof data.cardId === "string";
}

export function isLinkDropData(data: Record<string | symbol, unknown>): data is LinkDropData {
  return data.type === "link" && typeof data.linkId === "string" && typeof data.cardId === "string";
}

// Utility to find link index by ID
export function findLinkIndex(links: CardLink[], linkId: string): number {
  return links.findIndex((link) => link.id === linkId);
}

// Utility to remove link by ID
export function removeLinkById(links: CardLink[], linkId: string): CardLink[] {
  return links.filter((link) => link.id !== linkId);
}

// Utility to update link by ID
export function updateLinkById(
  links: CardLink[],
  linkId: string,
  updates: { url?: string; title?: string }
): CardLink[] {
  return links.map((link) => (link.id === linkId ? updateCardLink(link, updates) : link));
}
