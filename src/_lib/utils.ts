import {  clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type {ClassValue} from "clsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a URL-safe slug from a board name
 * @param boardName - The board name to convert to a slug
 * @returns A URL-safe slug string
 */
export function createBoardSlug(boardName: string): string {
  if (!boardName || typeof boardName !== "string") {
    return "untitled-board";
  }
  return (
    boardName
      .toLowerCase()
      .trim()
      // Handle accented characters
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      // Remove special characters, keep alphanumeric, spaces, hyphens, underscores
      .replace(/[^a-z0-9\s\-_]/g, "")
      // Replace multiple spaces/hyphens/underscores with single hyphen
      .replace(/[\s\-_]+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
      // Limit length and ensure we don't end with hyphen after truncation
      .substring(0, 50)
      .replace(/-+$/, "") ||
    // Fallback for empty results
    "untitled-board"
  );
}
