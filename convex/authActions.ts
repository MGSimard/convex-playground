import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

export const currentUser = query({
  args: {},
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
