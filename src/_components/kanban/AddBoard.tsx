import { Loader2Icon, PlusIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Label } from "@/_components/ui/label";
import { Input } from "@/_components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/_components/ui/dialog";
import { Button } from "@/_components/ui/button";
import { cn } from "@/_lib/utils";

export function AddBoard() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: useConvexMutation(api.boards.addBoard),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString().trim();
    if (name) {
      mutate(
        { name },
        {
          onSuccess: (result, variables) => {
            toast.success("SUCCESS: Board created.");
            setOpen(false);
            const formattedBoardName = variables.name.toLowerCase().replace(/\s+/g, "-");
            navigate({ to: `/sync/${result.shortId}/${formattedBoardName}` });
          },
          onError: (error) => {
            toast.error(`ERROR: Failed to create board: ${error.message}`);
          },
        }
      );
    } else {
      toast.error("ERROR: Board name cannot be empty.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="icon" aria-label="Create new board" />}>
        <PlusIcon className="h-4 w-4" />
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Board Creation</DialogTitle>
            <DialogDescription>Create a new board to organize your tasks.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Label htmlFor="name-1">Board Name</Label>
            <Input id="name-1" name="name" placeholder="e.g. 'My Board'" required />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" className="grid place-items-center" disabled={isPending}>
              <Loader2Icon
                className={cn("col-start-1 row-start-1 animate-spin", isPending ? "visible" : "invisible")}
              />
              <span className={cn("col-start-1 row-start-1", isPending ? "invisible" : "visible")}>Create board</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
