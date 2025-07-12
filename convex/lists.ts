import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { requireAuth } from "./authActions";

/**
 * Add a new list to a board.
 */
export const addList = mutation({
  args: {
    boardId: v.id("boards"),
    name: v.string(),
    position: v.number(),
  },
  returns: v.id("lists"),
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error(`ERROR: Board ${args.boardId} not found.`);
    }

    const listId = await ctx.db.insert("lists", {
      boardId: args.boardId,
      name: args.name,
      position: args.position,
    });

    await ctx.runMutation(api.boards.updateBoardActivity, {
      boardId: args.boardId,
    });

    return listId;
  },
});

/**
 * Remove a list and all its cards.
 */
export const removeList = mutation({
  args: {
    listId: v.id("lists"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error(`ERROR: List ${args.listId} not found.`);
    }

    const cards = await ctx.db
      .query("cards")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();
    for (const card of cards) {
      await ctx.db.delete(card._id);
    }

    await ctx.db.delete(args.listId);

    await ctx.runMutation(api.boards.updateBoardActivity, {
      boardId: list.boardId,
    });

    return null;
  },
});

/**
 * Rename a list.
 */
export const renameList = mutation({
  args: {
    listId: v.id("lists"),
    newName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error(`ERROR: List ${args.listId} not found.`);
    }

    await ctx.db.patch(args.listId, {
      name: args.newName,
    });

    await ctx.runMutation(api.boards.updateBoardActivity, {
      boardId: list.boardId,
    });

    return null;
  },
});

/**
 * Reorder lists within a board.
 */
export const reorderLists = mutation({
  args: {
    boardId: v.id("boards"),
    listUpdates: v.array(
      v.object({
        listId: v.id("lists"),
        position: v.number(),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error(`ERROR: Board ${args.boardId} not found.`);
    }

    // Update positions for all lists
    for (const update of args.listUpdates) {
      const list = await ctx.db.get(update.listId);
      if (!list) {
        throw new Error(`ERROR: List ${update.listId} not found.`);
      }
      if (list.boardId !== args.boardId) {
        throw new Error(`ERROR: List ${update.listId} does not belong to board ${args.boardId}.`);
      }

      await ctx.db.patch(update.listId, {
        position: update.position,
      });
    }

    // Update board activity
    await ctx.runMutation(api.boards.updateBoardActivity, {
      boardId: args.boardId,
    });

    return null;
  },
});
