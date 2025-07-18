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
