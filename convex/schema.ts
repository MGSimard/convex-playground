import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Board management schema
  boards: defineTable({
    name: v.string(),
    shortId: v.string(),
    updatedTime: v.number(),
  })
    .index("by_updated_time", ["updatedTime"])
    .index("by_short_id", ["shortId"]),
  lists: defineTable({
    boardId: v.id("boards"),
    name: v.string(),
    position: v.number(),
  }).index("by_board", ["boardId"]),
  cards: defineTable({
    listId: v.id("lists"),
    content: v.string(),
    position: v.number(),
  }).index("by_list", ["listId"]),
});
