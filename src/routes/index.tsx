import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";

export const Route = createFileRoute("/")({
  component: PageDashboard,
});

function PageDashboard() {
  return (
    <div className="max-w-8xl w-full mx-auto flex flex-1 flex-col gap-4 p-6">
      <Authenticated>You are authenticated. (Show Content)</Authenticated>
      <Unauthenticated>You are not authenticated. (Show OAuth Sign In)</Unauthenticated>
    </div>
  );
}
