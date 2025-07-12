import { Button } from "@/_components/ui/button";
import { Plus } from "lucide-react";

export function ListCreate() {
  return (
    <li className="bg-card rounded-lg w-64 max-h-full border overflow-hidden opacity-70 hover:opacity-100 transition-opacity">
      <Button variant="ghost" size="sm" className="text-muted-foreground w-full justify-start">
        <Plus /> Add new list
      </Button>
    </li>
  );
}
