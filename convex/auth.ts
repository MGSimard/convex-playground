import { convexAuth, getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { VALID_ROLES } from "./lib/permissions";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub],
  // https://labs.convex.dev/auth/advanced#writing-additional-data-during-authentication
  callbacks: {
    // SET DEFAULT ROLE FOR NEW USERS
    // ctx: Convex context for database operations
    // args: Contains userId and flags for new/existing users
    async afterUserCreatedOrUpdated(ctx, args) {
      // Skip if existing user
      if (args.existingUserId) return;
      // For new users, set default role to APPLICANT
      await ctx.db.patch(args.userId, {
        role: VALID_ROLES.APPLICANT,
      });
    },
  },
});

// CLIENT-SIDE AUTHENTICATION CHECK
// const currentUserData = useQuery(api.auth.currentUserData);
// if (!currentUserData) return <SignInButton />;
// FOR US:
// const { data: user } = useQuery(convexQuery(api.auth.currentUserData, {})); <- We do this since we have TanStack Router
// if (!currentUserData) go away;
export const currentUserData = query({
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
      role: v.optional(v.union(v.literal("applicant"), v.literal("member"), v.literal("admin"), v.literal("owner"))),
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

// CLIENT-SIDE SESSION CHECK
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

// TODO: Mutation for admins to update a user's role (below admin)
