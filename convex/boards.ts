import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Add a new board with the given name.
 */
export const addBoard = mutation({
  args: {
    name: v.string(),
  },
  returns: v.object({
    id: v.id("boards"),
    shortId: v.string(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    if (!args.name.trim()) {
      throw new Error("Board name cannot be empty.");
    }

    // Generate shortId (collision probability: ~1 in 2.8 trillion)
    const shortId = Math.random().toString(36).substring(2, 10);

    const id = await ctx.db.insert("boards", {
      name: args.name,
      shortId: shortId!,
      updatedTime: now,
    });

    return { id, shortId: shortId! };
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
      shortId: v.string(),
      updatedTime: v.number(),
    })
  ),
  handler: async (ctx) => {
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
      shortId: v.string(),
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
 * Find a board by short ID using efficient indexed query.
 */
export const getBoardByShortId = query({
  args: {
    shortId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("boards"),
      _creationTime: v.number(),
      name: v.string(),
      shortId: v.string(),
      updatedTime: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("boards")
      .withIndex("by_short_id", (q) => q.eq("shortId", args.shortId))
      .first();
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
        await ctx.db.patch(board._id, {
          updatedTime: board._creationTime,
        });
      }
    }

    return null;
  },
});
