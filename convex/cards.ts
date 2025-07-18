import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { checkPermission } from "./lib/permissions";
import type { Id } from "./_generated/dataModel";

export const addCard = mutation({
  args: {
    listId: v.id("lists"),
    content: v.string(),
    position: v.number(),
  },
  returns: v.id("cards"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("ERROR: Unauthenticated.");

    const isMemberPlus = await checkPermission(ctx, userId, "member");
    if (!isMemberPlus) throw new Error("ERROR: Unauthorized.");

    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error(`ERROR: List ${args.listId} not found.`);
    }

    const cardId = await ctx.db.insert("cards", {
      listId: args.listId,
      content: args.content,
      position: args.position,
    });

    await ctx.runMutation(internal.boards.updateBoardActivity, {
      boardId: list.boardId,
    });

    return cardId;
  },
});

export const removeCard = mutation({
  args: {
    cardId: v.id("cards"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("ERROR: Unauthenticated.");

    const isAdminPlus = await checkPermission(ctx, userId, "admin");
    if (!isAdminPlus) throw new Error("ERROR: Unauthorized.");

    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error(`ERROR: Card ${args.cardId} not found.`);
    }

    const list = await ctx.db.get(card.listId);

    await ctx.db.delete(args.cardId);

    if (list) {
      await ctx.runMutation(internal.boards.updateBoardActivity, {
        boardId: list.boardId,
      });
    }

    return null;
  },
});

export const updateCardPositions = mutation({
  args: {
    cardUpdates: v.array(
      v.object({
        cardId: v.id("cards"),
        listId: v.id("lists"),
        position: v.number(),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("ERROR: Unauthenticated.");

    const isMemberPlus = await checkPermission(ctx, userId, "member");
    if (!isMemberPlus) throw new Error("ERROR: Unauthorized.");

    if (args.cardUpdates.length === 0) {
      return;
    }

    // Validate all cards exist and collect affected boards for activity updates
    const affectedBoards = new Set<Id<"boards">>();

    for (const update of args.cardUpdates) {
      const card = await ctx.db.get(update.cardId);
      if (!card) {
        throw new Error(`ERROR: Card ${update.cardId} not found.`);
      }

      // Validate current list exists
      const currentList = await ctx.db.get(card.listId);
      if (!currentList) {
        throw new Error(`ERROR: Current list ${card.listId} not found.`);
      }
      affectedBoards.add(currentList.boardId);

      // Validate target list exists (if different)
      if (update.listId !== card.listId) {
        const targetList = await ctx.db.get(update.listId);
        if (!targetList) {
          throw new Error(`ERROR: Target list ${update.listId} not found.`);
        }

        if (currentList.boardId !== targetList.boardId) {
          throw new Error("ERROR: Cannot move cards between different boards.");
        }
        affectedBoards.add(targetList.boardId);
      }
    }

    for (const update of args.cardUpdates) {
      await ctx.db.patch(update.cardId, {
        listId: update.listId,
        position: update.position,
      });
    }

    for (const boardId of affectedBoards) {
      await ctx.runMutation(internal.boards.updateBoardActivity, { boardId });
    }
    return null;
  },
});

// Helper function to validate URL format
function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Helper function to validate links array
function validateLinks(links: Array<{ id: string; url: string; title?: string }>): void {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();

  for (const link of links) {
    // Validate link ID is not empty
    if (!link.id || link.id.trim() === "") {
      throw new Error("ERROR: Link ID cannot be empty.");
    }

    // Validate link ID is unique
    if (seenIds.has(link.id)) {
      throw new Error(`ERROR: Duplicate link ID found: ${link.id}.`);
    }
    seenIds.add(link.id);

    // Validate URL format
    if (!link.url || link.url.trim() === "") {
      throw new Error("ERROR: Link URL cannot be empty.");
    }

    const trimmedUrl = link.url.trim();
    if (!validateUrl(trimmedUrl)) {
      throw new Error(`ERROR: Invalid URL format: ${trimmedUrl}.`);
    }

    // Check for duplicate URLs within the same card
    if (seenUrls.has(trimmedUrl)) {
      throw new Error(`ERROR: Duplicate URL found: ${trimmedUrl}.`);
    }
    seenUrls.add(trimmedUrl);

    // Validate title if provided
    if (link.title !== undefined && typeof link.title !== "string") {
      throw new Error("ERROR: Link title must be a string.");
    }
  }
}

// Helper function to get board ID from card
async function getBoardIdFromCard(ctx: any, cardId: Id<"cards">): Promise<Id<"boards">> {
  const card = await ctx.db.get(cardId);
  if (!card) {
    throw new Error(`ERROR: Card ${cardId} not found.`);
  }

  const list = await ctx.db.get(card.listId);
  if (!list) {
    throw new Error(`ERROR: List ${card.listId} not found.`);
  }

  return list.boardId;
}

export const updateCardContent = mutation({
  args: {
    cardId: v.id("cards"),
    content: v.optional(v.string()),
    links: v.optional(
      v.array(
        v.object({
          id: v.string(),
          url: v.string(),
          title: v.optional(v.string()),
        })
      )
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("ERROR: Unauthenticated.");

    const isMemberPlus = await checkPermission(ctx, userId, "member");
    if (!isMemberPlus) throw new Error("ERROR: Unauthorized.");

    // Validate card exists
    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error(`ERROR: Card ${args.cardId} not found.`);
    }

    // Validate content if provided
    if (args.content !== undefined) {
      if (typeof args.content !== "string") {
        throw new Error("ERROR: Card content must be a string.");
      }
      if (args.content.trim() === "") {
        throw new Error("ERROR: Card content cannot be empty.");
      }
    }

    // Validate links if provided
    if (args.links !== undefined) {
      if (!Array.isArray(args.links)) {
        throw new Error("ERROR: Links must be an array.");
      }
      validateLinks(args.links);
    }

    // Prepare update object
    const updateData: { content?: string; links?: Array<{ id: string; url: string; title?: string }> } = {};

    if (args.content !== undefined) {
      updateData.content = args.content.trim();
    }

    if (args.links !== undefined) {
      // Normalize URLs and titles
      updateData.links = args.links.map((link) => ({
        id: link.id.trim(),
        url: link.url.trim(),
        title: link.title?.trim() || undefined,
      }));
    }

    // Update the card
    await ctx.db.patch(args.cardId, updateData);

    // Update board activity
    const boardId = await getBoardIdFromCard(ctx, args.cardId);
    await ctx.runMutation(internal.boards.updateBoardActivity, { boardId });

    return null;
  },
});
