import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Add a new board with the given name.
 */
export const addBoard = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("boards"),
  handler: async (ctx, args) => {
    const now = Date.now();
    if (!args.name.trim()) {
      throw new Error("Board name cannot be empty.");
    }
    return await ctx.db.insert("boards", {
      name: args.name,
      updatedTime: now,
    });
  },
});

/**
 * Remove a board by its ID.
 */
export const removeBoard = mutation({
  args: {
    boardId: v.id("boards"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error("Board not found");
    }
    await ctx.db.delete(args.boardId);
    return null;
  },
});

/**
 * Fetch all boards for the Combobox, ordered by most recent activity.
 */
export const getBoards = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("boards"),
      _creationTime: v.number(),
      name: v.string(),
      updatedTime: v.number(),
    })
  ),
  handler: async (ctx) => {
    // Get all boards ordered by updatedTime (most recent first)
    const boards = await ctx.db.query("boards").withIndex("by_updated_time").order("desc").collect();
    return boards;
  },
});

/**
 * Get a specific board by its ID.
 */
export const getBoard = query({
  args: {
    boardId: v.id("boards"),
  },
  returns: v.union(
    v.object({
      _id: v.id("boards"),
      _creationTime: v.number(),
      name: v.string(),
      updatedTime: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    return board || null;
  },
});

/**
 * Update the board's activity time (call this whenever there's activity on the board).
 */
export const updateBoardActivity = mutation({
  args: {
    boardId: v.id("boards"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.boardId, {
      updatedTime: now,
    });
    return null;
  },
});

/**
 * Rename a board and update its activity time.
 */
export const renameBoard = mutation({
  args: {
    boardId: v.id("boards"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.boardId, {
      name: args.name,
      updatedTime: now,
    });

    return null;
  },
});

/**
 * Migration function to backfill updatedTime for existing boards.
 * This should be run once to populate the updatedTime field for boards that don't have it.
 */
export const migrateBoards = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const boards = await ctx.db.query("boards").collect();

    for (const board of boards) {
      if (board.updatedTime === undefined) {
        // Use creationTime as fallback for updatedTime
        await ctx.db.patch(board._id, {
          updatedTime: board._creationTime,
        });
      }
    }

    return null;
  },
});
