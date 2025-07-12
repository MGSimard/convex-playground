import { Button } from "@/_components/ui/button";
import { Ellipsis, Plus } from "lucide-react";

// <ul mx-1 px-1> makes the scrollbar position look better than px-2
export function List() {
  return (
    <li className="flex flex-col gap-2 bg-card rounded-lg w-64 max-h-full border overflow-hidden py-2">
      <div className="flex justify-between items-center gap-2 px-2">
        <h2 className="truncate font-medium text-muted-foreground">List Title</h2>
        <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7 text-muted-foreground">
          <Ellipsis />
        </Button>
      </div>
      <ul className="flex flex-col px-1 mx-1 gap-2 list-none overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent] [&>*]:text-sm [&>*]:text-muted-foreground [&>*]:bg-muted [&>*]:rounded-md [&>*]:px-3 [&>*]:py-1.5">
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
      <div className="px-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground w-full justify-start">
          <Plus /> Add card
        </Button>
      </div>
    </li>
  );
}
