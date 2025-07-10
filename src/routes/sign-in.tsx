import { createFileRoute } from "@tanstack/react-router";
import { useAuthActions } from "@convex-dev/auth/react";

export const Route = createFileRoute("/sign-in")({
  component: RouteComponent,
});

function RouteComponent() {
  const { signIn } = useAuthActions();
  return <button onClick={() => void signIn("github")}>Sign in with GitHub</button>;
}
