import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

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
    // Verify board exists
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Create the list
    const listId = await ctx.db.insert("lists", {
      boardId: args.boardId,
      name: args.name,
      position: args.position,
    });

    // Update board activity
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
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }

    // Delete all cards in the list
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();

    for (const card of cards) {
      await ctx.db.delete(card._id);
    }

    // Delete the list
    await ctx.db.delete(args.listId);

    // Update board activity
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
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }

    await ctx.db.patch(args.listId, {
      name: args.name,
    });

    // Update board activity
    await ctx.runMutation(api.boards.updateBoardActivity, {
      boardId: list.boardId,
    });

    return null;
  },
});

/**
 * Move a list to another board.
 */
export const moveList = mutation({
  args: {
    listId: v.id("lists"),
    newBoardId: v.id("boards"),
    position: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }

    // Verify destination board exists
    const newBoard = await ctx.db.get(args.newBoardId);
    if (!newBoard) {
      throw new Error("Destination board not found");
    }

    const oldBoardId = list.boardId;

    // Update the list's board and position
    await ctx.db.patch(args.listId, {
      boardId: args.newBoardId,
      position: args.position,
    });

    // Update activity on BOTH boards
    await ctx.runMutation(api.boards.updateBoardActivity, {
      boardId: oldBoardId,
    });
    await ctx.runMutation(api.boards.updateBoardActivity, {
      boardId: args.newBoardId,
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
    // Verify board exists
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Update positions for all lists
    for (const update of args.listUpdates) {
      const list = await ctx.db.get(update.listId);
      if (!list) {
        throw new Error(`List ${update.listId} not found`);
      }
      if (list.boardId !== args.boardId) {
        throw new Error(`List ${update.listId} does not belong to board ${args.boardId}`);
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
