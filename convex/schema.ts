import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Replace default users table to add roles, must be optional because OAuth providers don't return a role
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.float64()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.float64()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(v.union(v.literal("applicant"), v.literal("member"), v.literal("admin"), v.literal("owner"))), // Optional because OAuth providers don't return a role
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  /* BOARD MANAGEMENT SCHEMAS */
  boards: defineTable({
    shortId: v.string(),
    name: v.string(),
    createdBy: v.id("users"),
    lastModifiedTime: v.number(),
    lastModifiedBy: v.id("users"),
  })
    .index("by_last_modified", ["lastModifiedTime"])
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
  /**/
});
