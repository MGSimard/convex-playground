import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

/**
 * Add a new card to a list.
 */
export const addCard = mutation({
  args: {
    listId: v.id("lists"),
    title: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
  },
  returns: v.id("cards"),
  handler: async (ctx, args) => {
    // Verify list exists
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }

    // Create the card
    const cardId = await ctx.db.insert("cards", {
      listId: args.listId,
      title: args.title,
      description: args.description,
      position: args.position,
    });

    // Update board activity
    await ctx.runMutation(api.boards.updateBoardActivity, {
      boardId: list.boardId,
    });

    return cardId;
  },
});

/**
 * Remove a card.
 */
export const removeCard = mutation({
  args: {
    cardId: v.id("cards"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    // Get the list to access board ID
    const list = await ctx.db.get(card.listId);
    if (!list) {
      throw new Error("List not found");
    }

    // Delete the card
    await ctx.db.delete(args.cardId);

    // Update board activity
    await ctx.runMutation(api.boards.updateBoardActivity, {
      boardId: list.boardId,
    });

    return null;
  },
});

/**
 * Update a card's title and/or description.
 */
export const updateCard = mutation({
  args: {
    cardId: v.id("cards"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    // Build update object
    const update: Record<string, any> = {};
    if (args.title !== undefined) {
      update.title = args.title;
    }
    if (args.description !== undefined) {
      update.description = args.description;
    }

    // Only update if there are changes
    if (Object.keys(update).length > 0) {
      await ctx.db.patch(args.cardId, update);

      // Get the list to access board ID
      const list = await ctx.db.get(card.listId);
      if (!list) {
        throw new Error("List not found");
      }

      // Update board activity
      await ctx.runMutation(api.boards.updateBoardActivity, {
        boardId: list.boardId,
      });
    }

    return null;
  },
});

/**
 * Move a card to another list (potentially different board).
 */
export const moveCard = mutation({
  args: {
    cardId: v.id("cards"),
    newListId: v.id("lists"),
    position: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    // Get current list
    const currentList = await ctx.db.get(card.listId);
    if (!currentList) {
      throw new Error("Current list not found");
    }

    // Get destination list
    const newList = await ctx.db.get(args.newListId);
    if (!newList) {
      throw new Error("Destination list not found");
    }

    // Update the card's list and position
    await ctx.db.patch(args.cardId, {
      listId: args.newListId,
      position: args.position,
    });

    // Update board activity
    await ctx.runMutation(api.boards.updateBoardActivity, {
      boardId: currentList.boardId,
    });

    // If moving to different board, update that board's activity too
    if (currentList.boardId !== newList.boardId) {
      await ctx.runMutation(api.boards.updateBoardActivity, {
        boardId: newList.boardId,
      });
    }

    return null;
  },
});

/**
 * Reorder cards within a list.
 */
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
    // Verify list exists
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }

    // Update positions for all cards
    for (const update of args.cardUpdates) {
      const card = await ctx.db.get(update.cardId);
      if (!card) {
        throw new Error(`Card ${update.cardId} not found`);
      }
      if (card.listId !== args.listId) {
        throw new Error(`Card ${update.cardId} does not belong to list ${args.listId}`);
      }

      await ctx.db.patch(update.cardId, {
        position: update.position,
      });
    }

    // Update board activity
    await ctx.runMutation(api.boards.updateBoardActivity, {
      boardId: list.boardId,
    });

    return null;
  },
});

/**
 * Get all cards for a list, ordered by position.
 */
export const getCards = query({
  args: {
    listId: v.id("lists"),
  },
  returns: v.array(
    v.object({
      _id: v.id("cards"),
      _creationTime: v.number(),
      listId: v.id("lists"),
      title: v.string(),
      description: v.optional(v.string()),
      position: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();

    // Sort by position (client-side since we can't index on position directly)
    return cards.sort((a, b) => a.position - b.position);
  },
});

/**
 * Get a specific card by ID.
 */
export const getCard = query({
  args: {
    cardId: v.id("cards"),
  },
  returns: v.union(
    v.object({
      _id: v.id("cards"),
      _creationTime: v.number(),
      listId: v.id("lists"),
      title: v.string(),
      description: v.optional(v.string()),
      position: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    return card || null;
  },
});

/**
 * Get all cards for a board (across all lists).
 */
export const getCardsByBoard = query({
  args: {
    boardId: v.id("boards"),
  },
  returns: v.array(
    v.object({
      _id: v.id("cards"),
      _creationTime: v.number(),
      listId: v.id("lists"),
      title: v.string(),
      description: v.optional(v.string()),
      position: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // First get all lists for the board
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();

    // Then get all cards for those lists
    const allCards: Array<Doc<"cards">> = [];

    for (const list of lists) {
      const cards = await ctx.db
        .query("cards")
        .withIndex("by_list", (q) => q.eq("listId", list._id))
        .collect();
      allCards.push(...cards);
    }

    return allCards;
  },
});
