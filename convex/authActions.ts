import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { v } from "convex/values";

export const currentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      phone: v.optional(v.string()),
      phoneVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

export const currentSession = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("authSessions"),
      _creationTime: v.number(),
      userId: v.id("users"),
      expirationTime: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const sessionId = await getAuthSessionId(ctx);
    if (sessionId === null) {
      return null;
    }
    return await ctx.db.get(sessionId);
  },
});

/**
 * Helper function to get the authenticated user ID.
 * Throws an error if the user is not authenticated.
 */
export async function requireAuth(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("ERROR: UNAUTHORIZED.");
  }
  return userId;
}
