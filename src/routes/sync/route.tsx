import { createFileRoute, Outlet, redirect, useParams, useNavigate } from "@tanstack/react-router";
import { BoardCombobox } from "@/_components/kanban/Combobox";
import { AddBoard } from "@/_components/kanban/AddBoard";
import { RenameBoardDialog } from "@/_components/kanban/RenameBoardDialog";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/_components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/_components/ui/tooltip";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/_components/ui/alert-dialog";
import { PencilIcon, Trash2Icon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { createBoardSlug } from "@/_lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/sync")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(convexQuery(api.auth.currentUserData, {}));
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    if (!user) throw redirect({ to: "/" });
  },
  loader: () => ({ crumb: "Sync" }),
});

function RouteComponent() {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const currentShortId = params.boardId;
  const currentBoardName = params.boardName;
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  // Query to get current user data for permission checking
  const { data: currentUser } = useQuery(convexQuery(api.auth.currentUserData, {}));


  // Query to get board data when viewing a specific board
  const { data: boardData } = useQuery(
    convexQuery(api.boards.getBoardWithListsAndCards, currentShortId ? { shortId: currentShortId } : "skip")
  );

  // Mutation to remove board
  const { mutate: removeBoard, isPending: isDeleting } = useMutation({
    mutationFn: useConvexMutation(api.boards.removeBoard),
  });

  // Check if user has admin permissions for rename functionality
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "owner";

  // Show edit button when viewing a specific board (for all users)
  const showEditButton = !!currentShortId && !!(boardData as any)?.board;

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

  const handleDeleteBoard = () => {
    if (!boardData?.board) return;

    removeBoard(
      { boardId: boardData.board._id },
      {
        onSuccess: () => {
          toast.success("SUCCESS: Board deleted.");
          setDeleteOpen(false);
          // Navigate back to boards list after successful deletion
          void navigate({ to: "/sync" });
        },
        onError: (error) => {
          toast.error(`ERROR: Failed to delete board: ${error.message}`);
        },
      }
    );
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
          isAdmin ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRenameOpen(true)}
              aria-label="Rename board"
              className="ml-2">
              <PencilIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-disabled
                    aria-label="Rename board (requires admin role)"
                    className="ml-2 cursor-not-allowed opacity-50">
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                }></TooltipTrigger>
              <TooltipContent>Requires admin role</TooltipContent>
            </Tooltip>
          )
        )}
        {showEditButton && (
          isAdmin ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete board"
              className="ml-2">
              <Trash2Icon className="h-4 w-4" />
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-disabled
                    aria-label="Delete board (requires admin role)"
                    className="ml-2 cursor-not-allowed opacity-50">
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                }></TooltipTrigger>
              <TooltipContent>Requires admin role</TooltipContent>
            </Tooltip>
          )
        )}
      </header>
      <Outlet />
      {showEditButton && boardData?.board && isAdmin && (
        <RenameBoardDialog
          boardId={boardData.board._id}
          currentName={boardData.board.name}
          open={renameOpen}
          onOpenChange={setRenameOpen}
          onSuccess={handleRenameSuccess}
        />
      )}
      {showEditButton && boardData?.board && isAdmin && (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the board and all its contents, including lists
                and cards.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                onClick={handleDeleteBoard}
                className="grid place-items-center"
                disabled={isDeleting}
                variant="destructive">
                <Loader2Icon
                  className={`col-start-1 row-start-1 animate-spin${isDeleting ? " visible" : " invisible"}`}
                />
                <span className={`col-start-1 row-start-1${isDeleting ? " invisible" : " visible"}`}>Delete Board</span>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
