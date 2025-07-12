import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./authActions";

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
    await requireAuth(ctx);

    const trimmedName = args.name.trim();
    if (!trimmedName) {
      throw new Error("ERROR: Board name cannot be empty.");
    }

    // Generate shortId (collision probability: ~1 in 2.8 trillion)
    const shortId = Math.random().toString(36).substring(2, 10);

    const id = await ctx.db.insert("boards", {
      name: trimmedName,
      shortId: shortId,
      updatedTime: Date.now(),
    });

    return { id, shortId };
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
    await requireAuth(ctx);

    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error(`ERROR: Board ${args.boardId} not found.`);
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
    // Require authentication
    await requireAuth(ctx);

    const boards = await ctx.db.query("boards").withIndex("by_updated_time").order("desc").collect();
    return boards;
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
    // Require authentication
    await requireAuth(ctx);

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
    newName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error(`ERROR: Board ${args.boardId} not found.`);
    }

    const now = Date.now();
    await ctx.db.patch(args.boardId, {
      name: args.newName,
      updatedTime: now,
    });

    return null;
  },
});

/**
 * Get board with all its lists and cards in a single query to eliminate request waterfall.
 * This consolidates what used to be separate queries for board, lists, and cards.
 */
export const getBoardWithListsAndCards = query({
  args: {
    shortId: v.string(),
  },
  returns: v.union(
    v.object({
      board: v.object({
        _id: v.id("boards"),
        _creationTime: v.number(),
        name: v.string(),
        shortId: v.string(),
        updatedTime: v.number(),
      }),
      lists: v.array(
        v.object({
          _id: v.id("lists"),
          _creationTime: v.number(),
          name: v.string(),
          position: v.number(),
          boardId: v.id("boards"),
        })
      ),
      cards: v.array(
        v.object({
          _id: v.id("cards"),
          _creationTime: v.number(),
          content: v.string(),
          position: v.number(),
          listId: v.id("lists"),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const board = await ctx.db
      .query("boards")
      .withIndex("by_short_id", (q) => q.eq("shortId", args.shortId))
      .unique();

    if (!board) {
      return null;
    }

    // Get all lists for this board
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_board", (q) => q.eq("boardId", board._id))
      .collect();

    // Sort lists by position
    const sortedLists = lists.sort((a, b) => a.position - b.position);

    // Get all cards for all lists in this board
    const allCards = [];
    for (const list of sortedLists) {
      const cards = await ctx.db
        .query("cards")
        .withIndex("by_list", (q) => q.eq("listId", list._id))
        .collect();
      allCards.push(...cards);
    }

    // Sort cards by position within each list
    const sortedCards = allCards.sort((a, b) => a.position - b.position);

    return {
      board,
      lists: sortedLists,
      cards: sortedCards,
    };
  },
});
