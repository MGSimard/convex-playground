import { Id } from "../_generated/dataModel";
import { QueryCtx, MutationCtx } from "../_generated/server";

// Derive role types from VALID_ROLES, represents permission levels
export type Role = (typeof VALID_ROLES)[keyof typeof VALID_ROLES];

// VALID ROLES IN ORDER OF INCREASING PRIVILEGES
export const VALID_ROLES = {
  BANNED: "banned", // Forced to "/" displaying banned screen
  APPLICANT: "applicant", // Forced to "/" displaying awaiting approval screen
  MEMBER: "member", // Can view and modify data
  ADMIN: "admin", // Has full access
} as const;

// ROLE HIERARCHY
// Higher numbers represent more privileges
// Allows for easy comparison of role levels using simple numeric comparison
const roleHierarchy: Record<Role, number> = {
  banned: 0,
  applicant: 1,
  member: 2,
  admin: 3,
};

// CHECK PERMISSIONS
// ctx: Convex context (works with both Query and Mutation contexts)
// userId: The ID of the user to check permissions for
// requiredRole: The minimum role level required for the operation
// Returns true if the user has sufficient permissions, false otherwise
// EXAMPLE USAGE:
// const canMember = await checkPermission(ctx, userId, "member");
// if (!canMember) throw new Error("Insufficient permissions");
export async function checkPermission(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  requiredRole: Role
): Promise<boolean> {
  const user = await ctx.db.get(userId);

  // If the user doesn't exist, or the role is not valid, return false
  // This handles cases where:
  // 1. The user ID is invalid or the user was deleted
  // 2. The user object doesn't have a role field
  // 3. The user's role is not one of the valid roles
  if (!user || !user.role || !(user.role in roleHierarchy)) return false;

  // Compare the user's role level against the required role level
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}
