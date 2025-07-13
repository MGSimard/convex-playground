import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { checkPermission } from "./lib/permissions";

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

// MOVE CARD TO ANOTHER LIST WITHIN SAME BOARD
export const moveCard = mutation({
  args: {
    cardId: v.id("cards"),
    newListId: v.id("lists"),
    newPosition: v.number(),
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

    const currentList = await ctx.db.get(card.listId);
    if (!currentList) {
      throw new Error(`ERROR: Current list ${card.listId} not found.`);
    }

    const newList = await ctx.db.get(args.newListId);
    if (!newList) {
      throw new Error(`ERROR: Destination list ${args.newListId} not found.`);
    }

    if (currentList.boardId !== newList.boardId) {
      throw new Error("ERROR: Cannot move card between different boards.");
    }

    await ctx.db.patch(args.cardId, {
      listId: args.newListId,
      position: args.newPosition,
    });

    await ctx.runMutation(internal.boards.updateBoardActivity, {
      boardId: currentList.boardId,
    });

    return null;
  },
});

// REORDER CARDS WITHIN LIST
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("ERROR: Unauthenticated.");

    const isMemberPlus = await checkPermission(ctx, userId, "member");
    if (!isMemberPlus) throw new Error("ERROR: Unauthorized.");

    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error(`ERROR: List ${args.listId} not found.`);
    }

    for (const update of args.cardUpdates) {
      const card = await ctx.db.get(update.cardId);
      if (!card) {
        throw new Error(`ERROR: Card ${update.cardId} not found.`);
      }

      if (card.listId !== args.listId) {
        throw new Error(`ERROR: Card ${update.cardId} does not belong to list ${args.listId}.`);
      }

      await ctx.db.patch(update.cardId, {
        position: update.position,
      });
    }

    await ctx.runMutation(internal.boards.updateBoardActivity, {
      boardId: list.boardId,
    });

    return null;
  },
});
