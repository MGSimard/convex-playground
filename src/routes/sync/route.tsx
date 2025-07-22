import { createFileRoute, Outlet, redirect, useParams, useNavigate } from "@tanstack/react-router";
import { BoardCombobox } from "@/_components/kanban/Combobox";
import { AddBoard } from "@/_components/kanban/AddBoard";
import { RenameBoardDialog } from "@/_components/kanban/RenameBoardDialog";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/_components/ui/button";
import { PencilIcon } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/sync")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(convexQuery(api.auth.currentUserData, {}));
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    if (!user) throw redirect({ to: "/" });
  },
  loader: () => ({ crumb: "Sync" }),
});

// Utility function to create URL-safe slugs from board names
function createBoardSlug(boardName: string): string {
  return boardName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

function RouteComponent() {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const currentShortId = params.boardId;
  const currentBoardName = params.boardName;
  const [renameOpen, setRenameOpen] = useState(false);
  const queryClient = useQueryClient();

  // Query to get current user data for permission checking
  const { data: currentUser } = useQuery(convexQuery(api.auth.currentUserData, {}));


  // Query to get board data when viewing a specific board
  const { data: boardData } = useQuery(
    convexQuery(api.boards.getBoardWithListsAndCards, currentShortId ? { shortId: currentShortId } : "skip")
  );

  // Check if user has admin permissions for rename functionality
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "owner";

  // Only show edit button when viewing a specific board and user has admin permissions
  const showEditButton = !!currentShortId && !!(boardData as any)?.board && isAdmin;

  const handleRenameSuccess = () => {
    // Invalidate board data queries to refresh the UI
    if (currentShortId) {
      void queryClient.invalidateQueries({
        queryKey: convexQuery(api.boards.getBoardWithListsAndCards, { shortId: currentShortId }).queryKey,
      });
    }
    // Also invalidate board list queries in case the name appears elsewhere
    void queryClient.invalidateQueries({
      queryKey: convexQuery(api.boards.getBoards, {}).queryKey,
    });
  };

  // Check if URL needs updating when board data changes (reactive approach)
  if ((boardData as any)?.board && currentShortId && currentBoardName) {
    const currentBoardNameFromData = (boardData as any).board.name;
    const expectedSlug = createBoardSlug(currentBoardNameFromData);

    // If URL slug doesn't match current board name, update it
    if (currentBoardName !== expectedSlug) {
      void navigate({
        to: "/sync/$boardId/$boardName",
        params: {
          boardId: currentShortId,
          boardName: expectedSlug,
        },
        replace: true,
      });
    }
  }

  return (
    <>
      <header className="shrink-0 flex items-center h-[var(--subHeader-height)] px-6 border-b">
        <BoardCombobox currentShortId={currentShortId} />
        <AddBoard />
        {showEditButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRenameOpen(true)}
            aria-label="Rename board"
            className="ml-2">
            <PencilIcon className="h-4 w-4" />
          </Button>
        )}
      </header>
      <Outlet />
      {showEditButton && boardData?.board && (
        <RenameBoardDialog
          boardId={boardData.board._id}
          currentName={boardData.board.name}
          open={renameOpen}
          onOpenChange={setRenameOpen}
          onSuccess={handleRenameSuccess}
        />
      )}
    </>
  );
}
