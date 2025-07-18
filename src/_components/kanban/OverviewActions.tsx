import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useConvexMutation } from "@convex-dev/react-query";
import { Button } from "@/_components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/_components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "@/_components/ui/alert-dialog";
import { ArchiveIcon, EllipsisVerticalIcon, Loader2Icon, StarIcon, Trash2Icon, UsersIcon } from "lucide-react";
import { toast } from "sonner";

export function OverviewActions({ boardId }: { boardId: Id<"boards"> }) {
  const [deleteOpen, setDeleteOpen] = useState(false);

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
          toast.success("SUCCESS: Board deleted successfully.");
          setDeleteOpen(false);
        },
        onError: (error) => {
          toast.error(`ERROR: Failed to delete board: ${error.message}`);
        },
      }
    );
  };

  return (
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="View actions" className="shrink-0 absolute top-3 right-3">
            <EllipsisVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel className="text-sm text-muted-foreground">Board Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleToggleFavorite}>
            <StarIcon className={isFavorited ? "text-foreground fill-foreground" : ""} />
            {isFavorited ? "Unfavorite" : "Favorite"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UsersIcon className="h-4 w-4" />
            Permissions
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <ArchiveIcon className="h-4 w-4" />
              Archive
            </DropdownMenuItem>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="text-destructive hover:bg-destructive">
                <Trash2Icon className="h-4 w-4 text-inherit" />
                Delete
              </DropdownMenuItem>
            </AlertDialogTrigger>
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
            <Loader2Icon className={`col-start-1 row-start-1 animate-spin${isDeleting ? " visible" : " invisible"}`} />
            <span className={`col-start-1 row-start-1${isDeleting ? " invisible" : " visible"}`}>Delete Board</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
