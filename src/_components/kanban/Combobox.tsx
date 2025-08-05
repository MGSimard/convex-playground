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

  const boardsMap = new Map(boards.map((board) => [board.shortId, board]));
  const currentBoard = currentShortId ? boardsMap.get(currentShortId) : undefined;

  const handleBoardSelect = (shortId: string) => {
    const board = boardsMap.get(shortId);
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
          <h1 className={cn("truncate", !currentBoard && "text-muted-foreground")}>
            {currentBoard ? currentBoard.name : "Select board..."}
          </h1>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search boards..." />
          <CommandList>
            <CommandEmpty>
              <span className="text-sm text-muted-foreground">
                {isPending ? "Fetching boards..." : "No boards found."}
              </span>
            </CommandEmpty>
            {boards.length > 0 && (
              <CommandGroup className="overflow-hidden">
                {boards.map((board) => (
                  <CommandItem key={board._id} value={board.name} onSelect={() => handleBoardSelect(board.shortId)}>
                    <span className="truncate">{board.name}</span>
                    <CheckIcon
                      className={cn("ml-auto h-4 w-4 opacity-0", currentShortId === board.shortId && "opacity-100")}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
