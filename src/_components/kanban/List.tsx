import { Button } from "@/_components/ui/button";
import { Ellipsis } from "lucide-react";
import { ScrollArea } from "@/_components/ui/scroll-area";

export function List() {
  return (
    <li className="flex flex-col gap-2 bg-card rounded-lg p-2 w-xs max-h-full border overflow-hidden">
      <div className="flex justify-between items-center gap-2">
        <h2 className="truncate">List Title</h2>
        <Button variant="ghost" className="shrink-0">
          <Ellipsis />
        </Button>
      </div>
      <ul className="list-none overflow-y-auto">
        <li>Card 1</li>
        <li>Card 2</li>
        <li>Card 3</li>
        <li>Card 1</li>
        <li>Card 2</li>
        <li>Card 3</li>
        <li>Card 1</li>
        <li>Card 2</li>
        <li>Card 3</li>
        <li>Card 1</li>
        <li>Card 2</li>
        <li>Card 3</li>
        <li>Card 1</li>
        <li>Card 2</li>
        <li>Card 3</li>
        <li>Card 1</li>
        <li>Card 2</li>
        <li>Card 3</li>
        <li>Card 1</li>
        <li>Card 2</li>
        <li>Card 3</li>
        <li>Card 1</li>
        <li>Card 2</li>
        <li>Card 3</li>
        <li>Card 1</li>
        <li>Card 2</li>
        <li>Card 3</li>
        <li>Card 1</li>
        <li>Card 2</li>
        <li>Card 3</li>
        <li>Card 1</li>
        <li>Card 2</li>
        <li>Card 3</li>
        <li>Card 1</li>
        <li>Card 2</li>
        <li>Card 3</li>
        <li>Card 1</li>
        <li>Card 2</li>
        <li>Card 3</li>
        <li>Card 1</li>
        <li>Card 2</li>
        <li>Card 3</li>
      </ul>
      <div>
        <Button variant="ghost" className="w-full">
          + Add card
        </Button>
      </div>
    </li>
  );
}
