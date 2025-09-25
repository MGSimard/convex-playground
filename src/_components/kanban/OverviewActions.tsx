import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { EllipsisVerticalIcon, Loader2Icon, PencilIcon, StarIcon, Trash2Icon, UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { RenameBoardDialog } from "./RenameBoardDialog";
import type { Id } from "../../../convex/_generated/dataModel";

import { Button } from "@/_components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/_components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/_components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/_components/ui/tooltip";

export function OverviewActions({ boardId, boardName }: { boardId: Id<"boards">; boardName: string }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const queryClient = useQueryClient();

  // Query to get current user data for permission checking
  const { data: currentUser } = useQuery(convexQuery(api.auth.currentUserData, {}));

  // Query to check if board is favorited
  const { data: isFavorited = false } = useQuery({
    ...convexQuery(api.boards.isFavorited, { boardId }),
    initialData: false,
  });

  // Mutation to toggle favorite status
  const { mutate: toggleFavorite } = useMutation({
    mutationFn: useConvexMutation(api.boards.toggleFavorite),
  });

  // Mutation to remove board
  const { mutate: removeBoard, isPending: isDeleting } = useMutation({
    mutationFn: useConvexMutation(api.boards.removeBoard),
  });

  const handleToggleFavorite = () => {
    toggleFavorite(
      { boardId },
      {
        onSuccess: (result) => {
          toast.success(
            result.isFavorited ? "SUCCESS: Board added to favorites." : "SUCCESS: Board removed from favorites."
          );
        },
        onError: (error) => {
          toast.error(`ERROR: Failed to update favorite: ${error.message}`);
        },
      }
    );
  };

  const handleDeleteBoard = (boardId: Id<"boards">) => {
    removeBoard(
      { boardId },
      {
        onSuccess: () => {
          toast.success("SUCCESS: Board deleted.");
          setDeleteOpen(false);
        },
        onError: (error) => {
          toast.error(`ERROR: Failed to delete board: ${error.message}`);
        },
      }
    );
  };

  // Check if user has admin permissions for rename functionality
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "owner";

  return (
    <>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="View actions" className="shrink-0 absolute top-3 right-3">
              <EllipsisVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel className="text-sm text-muted-foreground">Board Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleToggleFavorite}>
              <StarIcon className={isFavorited ? "text-foreground fill-foreground" : ""} />
              {isFavorited ? "Unfavorite" : "Favorite"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isAdmin ? (
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <PencilIcon className="h-4 w-4" />
                Rename
              </DropdownMenuItem>
            ) : (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <DropdownMenuItem aria-disabled className="cursor-not-allowed opacity-50">
                      <PencilIcon className="h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                  }></TooltipTrigger>
                <TooltipContent>Requires admin role</TooltipContent>
              </Tooltip>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <UsersIcon className="h-4 w-4" />
              Permissions (WIP)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {isAdmin ? (
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem variant="destructive">
                    <Trash2Icon className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              ) : (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <DropdownMenuItem aria-disabled className="cursor-not-allowed opacity-50">
                        <Trash2Icon className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    }></TooltipTrigger>
                  <TooltipContent>Requires admin role</TooltipContent>
                </Tooltip>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
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
              onClick={() => handleDeleteBoard(boardId)}
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
      <RenameBoardDialog boardId={boardId} currentName={boardName} open={renameOpen} onOpenChange={setRenameOpen} />
    </>
  );
}
