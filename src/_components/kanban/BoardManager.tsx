import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/_components/ui/card";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function BoardManager() {
  const { data: boards, isPending } = useQuery(convexQuery(api.boards.getBoards, {}));

  const { mutate: removeBoard } = useMutation({
    mutationFn: useConvexMutation(api.boards.removeBoard),
  });

  const handleDeleteBoard = (boardId: Id<"boards">) => {
    if (confirm("Are you sure you want to delete this board?")) {
      removeBoard({ boardId });
    }
  };

  // NEW PLAN
  // Sort boards by updatedTime
  // Show boards in an autofill grid (left to right, top to bottom)
  // Show board name, last modification (updatedTime), delete button
  // Alert confirm (shadcn) on delete attempt

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Board Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Board List */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Existing Boards</h3>
          {isPending ? (
            <div className="text-sm text-muted-foreground">Loading boards...</div>
          ) : boards?.length === 0 ? (
            <div className="text-sm text-muted-foreground">No boards yet. Create your first board!</div>
          ) : (
            <div className="space-y-2">
              {boards?.map((board) => (
                <div key={board._id} className="flex items-center justify-between p-2 border rounded-md">
                  <span className="truncate flex-1">{board.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBoard(board._id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
