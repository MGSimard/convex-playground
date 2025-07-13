import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/_lib/utils";
import { Button } from "@/_components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/_components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/_components/ui/popover";
import { api } from "../../../convex/_generated/api";

interface BoardComboboxProps {
  currentShortId?: string;
}

export function BoardCombobox({ currentShortId }: BoardComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const { data: boards, isPending } = useQuery({
    ...convexQuery(api.boards.getBoards, {}),
    initialData: [],
  });

  const currentBoard = boards.find((board) => board.shortId === currentShortId);

  const handleBoardSelect = (shortId: string) => {
    const board = boards.find((b) => b.shortId === shortId);
    if (board) {
      const boardName = board.name.toLowerCase().replace(/\s+/g, "-");
      navigate({ to: `/sync/${shortId}/${boardName}` });
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between overflow-hidden">
          <h1 className={`truncate${currentBoard ? "" : " text-muted-foreground"}`}>
            {currentBoard ? currentBoard.name : "Select board..."}
          </h1>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search boards..." />
          <CommandList>
            <CommandEmpty>No board found.</CommandEmpty>
            <CommandGroup className="overflow-hidden">
              {isPending ? (
                <div className="p-2 text-sm text-muted-foreground">Loading boards...</div>
              ) : (
                boards.map((board) => (
                  <CommandItem
                    key={board._id}
                    value={board.name.toLowerCase()}
                    onSelect={() => handleBoardSelect(board.shortId)}>
                    <span className="truncate">{board.name}</span>
                    <CheckIcon
                      className={cn("ml-auto h-4 w-4", currentShortId === board.shortId ? "opacity-100" : "opacity-0")}
                    />
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
