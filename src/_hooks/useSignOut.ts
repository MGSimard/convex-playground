import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, useRouteContext } from "@tanstack/react-router";
import { toast } from "sonner";

/**
 * Custom hook for handling user sign out with proper cleanup
 * - Signs out from Convex auth
 * - Clears all query cache (only on successful sign-out)
 * - Navigates to homepage with history replacement
 * - Prevents navigation back to protected pages
 * - Provides honest user feedback via toasts
 */
export function useSignOut() {
  const { signOut } = useAuthActions();
  const router = useRouter();

  const { queryClient } = useRouteContext({
    from: "__root__",
    select: (context) => ({ queryClient: context.queryClient }),
  });

  const handleSignOut = async () => {
    try {
      await signOut();

      // Only proceed with cleanup if sign-out actually succeeded
      queryClient.clear();
      await router.navigate({
        to: "/",
        replace: true,
        resetScroll: true,
      });
      toast.success("SUCCESS: Signed out.");
    } catch (error: unknown) {
      console.error("ERROR: Sign out failed:", error instanceof Error ? error.message : "UNKNOWN ERROR.");
      toast.error("ERROR: Sign out failed.");
    }
  };

  return handleSignOut;
}
