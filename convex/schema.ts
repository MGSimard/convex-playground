import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),

  // Board management schema
  boards: defineTable({
    name: v.string(),
    updatedTime: v.number(),
  }).index("by_updated_time", ["updatedTime"]),

  lists: defineTable({
    boardId: v.id("boards"),
    name: v.string(),
    position: v.number(),
  }).index("by_board", ["boardId"]),

  cards: defineTable({
    listId: v.id("lists"),
    title: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
  }).index("by_list", ["listId"]),
});
