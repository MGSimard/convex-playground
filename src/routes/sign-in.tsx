import { createFileRoute } from "@tanstack/react-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";

export const Route = createFileRoute("/sign-in")({
  component: RouteComponent,
});

function RouteComponent() {
  const { signIn, signOut } = useAuthActions();

  const { data, isPending, error } = useQuery(convexQuery(api.authActions.currentUser, {}));
  console.log(data);

  return (
    <div>
      <div>
        <h2>CURRENT USER</h2>
      </div>
      <div>
        <h2>AUTH ACTIONS</h2>
        <AuthLoading>Auth is Loading...</AuthLoading>
        <Authenticated>
          <button onClick={() => void signOut()}>Sign out</button>
        </Authenticated>
        <Unauthenticated>
          <button onClick={() => void signIn("github")}>Sign in with GitHub</button>
        </Unauthenticated>
      </div>
    </div>
  );
}
