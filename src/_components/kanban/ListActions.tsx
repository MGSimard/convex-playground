import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { EllipsisIcon, Loader2Icon, PlusIcon, MoveIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

export function ListActions({ listId }: { listId: Id<"lists"> }) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { mutate: removeList, isPending } = useMutation({
    mutationFn: useConvexMutation(api.lists.removeList),
  });

  const handleDeleteList = (listId: Id<"lists">) => {
    removeList(
      { listId },
      {
        onSuccess: () => {
          toast.success("List deleted successfully!");
          setDeleteOpen(false);
        },
        onError: (error) => {
          toast.error(`Failed to delete list: ${error.message}`);
        },
      }
    );
  };

  return (
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="View list actions"
            className="shrink-0 h-7 w-7 text-muted-foreground">
            <EllipsisIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel className="text-sm text-muted-foreground">List Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <PlusIcon className="h-4 w-4" />
            Add Card
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <MoveIcon className="h-4 w-4" />
            Move list
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
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
            This action cannot be undone. This will permanently delete the list and all its cards.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            onClick={() => handleDeleteList(listId)}
            className="grid place-items-center"
            disabled={isPending}
            variant="destructive">
            <Loader2Icon className={`col-start-1 row-start-1 animate-spin${isPending ? " visible" : " invisible"}`} />
            <span className={`col-start-1 row-start-1${isPending ? " invisible" : " visible"}`}>Delete List</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
