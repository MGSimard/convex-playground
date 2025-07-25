import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { checkPermission } from "./lib/permissions";

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("ERROR: Unauthenticated.");

    const isMemberPlus = await checkPermission(ctx, userId, "member");
    if (!isMemberPlus) throw new Error("ERROR: Unauthorized.");

    const trimmedName = args.name.trim();
    if (!trimmedName) {
      throw new Error("ERROR: Board name cannot be empty.");
    }

    // Generate shortId (collision probability: ~1 in 2.8 trillion)
    const shortId = Math.random().toString(36).substring(2, 10);

    const id = await ctx.db.insert("boards", {
      shortId: shortId,
      name: trimmedName,
      createdBy: userId,
      lastModifiedTime: Date.now(),
      lastModifiedBy: userId,
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("ERROR: Unauthenticated.");

    // TODO: Allow board owner to remove?
    const isAdminPlus = await checkPermission(ctx, userId, "admin");
    if (!isAdminPlus) throw new Error("ERROR: Unauthorized.");

    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error(`ERROR: Board ${args.boardId} not found.`);
    }
    await ctx.db.delete(args.boardId);
    return null;
  },
});

/**
 * Calculate activity status based on lastModifiedTime
 */
function calculateActivityStatus(lastModifiedTime: number, creationTime: number): string {
  try {
    const now = Date.now();
    const timeToUse = lastModifiedTime || creationTime;
    const daysDiff = Math.floor((now - timeToUse) / (1000 * 60 * 60 * 24));

    if (daysDiff < 7) {
      return "Recent";
    } else if (daysDiff <= 30) {
      return `${daysDiff} days ago`;
    } else {
      return "Inactive";
    }
  } catch (error) {
    return "Activity: -";
  }
}

/**
 * Fetch all boards for Combobox & grid list, ordered by most recent activity.
 * Favorited boards appear first, followed by unfavorited boards.
 * Both groups are sorted by lastModifiedTime (most recent first).
 */
export const getBoards = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("boards"),
      _creationTime: v.number(),
      shortId: v.string(),
      name: v.string(),
      createdBy: v.id("users"),
      createdByName: v.optional(v.string()),
      lastModifiedTime: v.number(),
      lastModifiedBy: v.id("users"),
      lastModifiedByName: v.optional(v.string()),
      isFavorited: v.boolean(),
      listsCount: v.number(),
      cardsCount: v.number(),
      activityStatus: v.string(),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("ERROR: Unauthenticated.");

    const isMemberPlus = await checkPermission(ctx, userId, "member");
    if (!isMemberPlus) throw new Error("ERROR: Unauthorized.");

    const boards = await ctx.db.query("boards").withIndex("by_last_modified").order("desc").collect();

    // Get all user's favorites in one query for efficiency
    const userFavorites = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_board", (q) => q.eq("userId", userId))
      .collect();

    const favoritedBoardIds = new Set(userFavorites.map((fav) => fav.boardId));

    // Batch fetch all lists for all boards to avoid N+1 queries
    const boardIds = boards.map((board) => board._id);
    const allLists = await ctx.db.query("lists").collect();
    const listsByBoard = new Map<string, any[]>();

    // Group lists by board ID
    for (const list of allLists) {
      if (boardIds.includes(list.boardId)) {
        if (!listsByBoard.has(list.boardId)) {
          listsByBoard.set(list.boardId, []);
        }
        listsByBoard.get(list.boardId)!.push(list);
      }
    }

    // Batch fetch all cards for all lists to avoid N+1 queries
    const allListIds = allLists.map((list) => list._id);
    const allCards = await ctx.db.query("cards").collect();
    const cardsByList = new Map<string, any[]>();

    // Group cards by list ID
    for (const card of allCards) {
      if (allListIds.includes(card.listId)) {
        if (!cardsByList.has(card.listId)) {
          cardsByList.set(card.listId, []);
        }
        cardsByList.get(card.listId)!.push(card);
      }
    }

    // Enrich boards with user names, favorite status, and statistics
    const enrichedBoards = [];
    for (const board of boards) {
      const createdByUser = await ctx.db.get(board.createdBy);
      const lastModifiedByUser = await ctx.db.get(board.lastModifiedBy);

      // Calculate statistics with fallback values
      let listsCount = 0;
      let cardsCount = 0;
      let activityStatus = "Activity: -";

      try {
        // Get lists for this board
        const boardLists = listsByBoard.get(board._id) || [];
        listsCount = boardLists.length;

        // Count cards across all lists for this board
        for (const list of boardLists) {
          const listCards = cardsByList.get(list._id) || [];
          cardsCount += listCards.length;
        }

        // Calculate activity status
        activityStatus = calculateActivityStatus(board.lastModifiedTime, board._creationTime);
      } catch (error) {
        // Use fallback values if calculation fails
        listsCount = 0;
        cardsCount = 0;
        activityStatus = "Activity: -";
      }

      enrichedBoards.push({
        ...board,
        createdByName: createdByUser?.name,
        lastModifiedByName: lastModifiedByUser?.name,
        isFavorited: favoritedBoardIds.has(board._id),
        listsCount,
        cardsCount,
        activityStatus,
      });
    }

    // Separate favorited and unfavorited boards
    const favoritedBoards = enrichedBoards.filter((board) => board.isFavorited);
    const unfavoritedBoards = enrichedBoards.filter((board) => !board.isFavorited);

    // Both groups are already sorted by lastModifiedTime DESC from the initial query
    // Return favorited boards first, then unfavorited
    return [...favoritedBoards, ...unfavoritedBoards];
  },
});

/**
 * Update the board's activity time (call this whenever there's activity on the board).
 * Internal mutation - only called from other server functions.
 */
export const updateBoardActivity = internalMutation({
  args: {
    boardId: v.id("boards"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.boardId, {
      lastModifiedTime: now,
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("ERROR: Unauthenticated.");

    const isAdminPlus = await checkPermission(ctx, userId, "admin");
    if (!isAdminPlus) throw new Error("ERROR: Unauthorized.");

    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error(`ERROR: Board ${args.boardId} not found.`);
    }

    const now = Date.now();
    await ctx.db.patch(args.boardId, {
      name: args.newName,
      lastModifiedTime: now,
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
        shortId: v.string(),
        name: v.string(),
        createdBy: v.id("users"),
        lastModifiedTime: v.number(),
        lastModifiedBy: v.id("users"),
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
          links: v.optional(
            v.array(
              v.object({
                id: v.string(),
                url: v.string(),
                title: v.optional(v.string()),
              })
            )
          ),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("ERROR: Unauthenticated.");

    const isMemberPlus = await checkPermission(ctx, userId, "member");
    if (!isMemberPlus) throw new Error("ERROR: Unauthorized.");

    const board = await ctx.db
      .query("boards")
      .withIndex("by_short_id", (q) => q.eq("shortId", args.shortId))
      .unique();

    if (!board) {
      throw new Error(`ERROR: Board ${args.shortId} not found.`);
    }

    const lists = await ctx.db
      .query("lists")
      .withIndex("by_board", (q) => q.eq("boardId", board._id))
      .collect();

    const sortedLists = lists.sort((a, b) => a.position - b.position);

    const allCards = [];
    for (const list of sortedLists) {
      const cards = await ctx.db
        .query("cards")
        .withIndex("by_list", (q) => q.eq("listId", list._id))
        .collect();
      allCards.push(...cards);
    }

    const sortedCards = allCards.sort((a, b) => a.position - b.position);

    return {
      board,
      lists: sortedLists,
      cards: sortedCards,
    };
  },
});

/**
 * Toggle favorite status for a board.
 */
export const toggleFavorite = mutation({
  args: {
    boardId: v.id("boards"),
  },
  returns: v.object({
    isFavorited: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("ERROR: Unauthenticated.");

    const isMemberPlus = await checkPermission(ctx, userId, "member");
    if (!isMemberPlus) throw new Error("ERROR: Unauthorized.");

    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error(`ERROR: Board ${args.boardId} not found.`);
    }

    const existingFavorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_board", (q) => q.eq("userId", userId).eq("boardId", args.boardId))
      .unique();

    if (existingFavorite) {
      await ctx.db.delete(existingFavorite._id);
      return { isFavorited: false };
    } else {
      await ctx.db.insert("favorites", {
        userId,
        boardId: args.boardId,
      });
      return { isFavorited: true };
    }
  },
});

/**
 * Check if a board is favorited by the current user.
 */
export const isFavorited = query({
  args: {
    boardId: v.id("boards"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_board", (q) => q.eq("userId", userId).eq("boardId", args.boardId))
      .unique();

    return favorite !== null;
  },
});

/**
 * Get all favorite boards for the current user.
 */
export const getFavoriteBoards = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("boards"),
      _creationTime: v.number(),
      shortId: v.string(),
      name: v.string(),
      createdBy: v.id("users"),
      createdByName: v.optional(v.string()),
      lastModifiedTime: v.number(),
      lastModifiedBy: v.id("users"),
      lastModifiedByName: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("ERROR: Unauthenticated.");

    const isMemberPlus = await checkPermission(ctx, userId, "member");
    if (!isMemberPlus) throw new Error("ERROR: Unauthorized.");

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_board", (q) => q.eq("userId", userId))
      .collect();

    const favoriteBoards = [];
    for (const favorite of favorites) {
      const board = await ctx.db.get(favorite.boardId);
      if (board) {
        const createdByUser = await ctx.db.get(board.createdBy);
        const lastModifiedByUser = await ctx.db.get(board.lastModifiedBy);

        favoriteBoards.push({
          ...board,
          createdByName: createdByUser?.name,
          lastModifiedByName: lastModifiedByUser?.name,
        });
      }
    }

    // Sort by last modified time, most recent first
    return favoriteBoards.sort((a, b) => b.lastModifiedTime - a.lastModifiedTime);
  },
});
