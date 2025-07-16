import { mutation, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { checkPermission } from "./lib/permissions";
import { Id } from "./_generated/dataModel";

// ADD CARD TO LIST
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

// REMOVE CARD
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
    if (!list) {
      throw new Error(`ERROR: List ${card.listId} not found.`);
    }

    await ctx.db.delete(args.cardId);

    await ctx.runMutation(internal.boards.updateBoardActivity, {
      boardId: list.boardId,
    });

    return null;
  },
});

// UPDATE CARD CONTENT
export const updateCard = mutation({
  args: {
    cardId: v.id("cards"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("ERROR: Unauthenticated.");

    const isMemberPlus = await checkPermission(ctx, userId, "member");
    if (!isMemberPlus) throw new Error("ERROR: Unauthorized.");

    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error(`ERROR: Card ${args.cardId} not found.`);
    }
    await ctx.db.patch(args.cardId, { content: args.content });

    const list = await ctx.db.get(card.listId);
    if (!list) {
      throw new Error(`ERROR: List ${card.listId} not found.`);
    }

    await ctx.runMutation(internal.boards.updateBoardActivity, {
      boardId: list.boardId,
    });

    return null;
  },
});

// Helper function for updating card positions
async function updateCardPositionsHelper(
  ctx: MutationCtx,
  cardUpdates: Array<{
    cardId: Id<"cards">;
    listId: Id<"lists">;
    position: number;
  }>
): Promise<void> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("ERROR: Unauthenticated.");

  const isMemberPlus = await checkPermission(ctx, userId, "member");
  if (!isMemberPlus) throw new Error("ERROR: Unauthorized.");

  if (cardUpdates.length === 0) {
    return;
  }

  // Validate all cards exist and collect affected boards for activity updates
  const affectedBoards = new Set<Id<"boards">>();

  for (const update of cardUpdates) {
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

      // Ensure we're not moving between different boards
      if (currentList.boardId !== targetList.boardId) {
        throw new Error("ERROR: Cannot move cards between different boards.");
      }
      affectedBoards.add(targetList.boardId);
    }
  }

  // Apply all updates atomically
  for (const update of cardUpdates) {
    await ctx.db.patch(update.cardId, {
      listId: update.listId,
      position: update.position,
    });
  }

  // Update activity for all affected boards
  for (const boardId of affectedBoards) {
    await ctx.runMutation(internal.boards.updateBoardActivity, { boardId });
  }
}

// UPDATE CARD POSITIONS (replaces both reorderCards and moveCard)
export const updateCardPositions = mutation({
  args: {
    cardUpdates: v.array(
      v.object({
        cardId: v.id("cards"),
        listId: v.id("lists"), // Allow changing list
        position: v.number(),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await updateCardPositionsHelper(ctx, args.cardUpdates);
    return null;
  },
});

// LEGACY: Keep for backward compatibility, will remove in next version
export const reorderCards = mutation({
  args: {
    listId: v.id("lists"),
    cardUpdates: v.array(
      v.object({
        cardId: v.id("cards"),
        position: v.number(),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Convert to new format and delegate
    const updates = args.cardUpdates.map((update) => ({
      cardId: update.cardId,
      listId: args.listId,
      position: update.position,
    }));

    await updateCardPositionsHelper(ctx, updates);
    return null;
  },
});

// LEGACY: Keep for backward compatibility, will remove in next version
export const moveCard = mutation({
  args: {
    cardId: v.id("cards"),
    newListId: v.id("lists"),
    newPosition: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Convert to new format and delegate
    await updateCardPositionsHelper(ctx, [
      {
        cardId: args.cardId,
        listId: args.newListId,
        position: args.newPosition,
      },
    ]);
    return null;
  },
});
