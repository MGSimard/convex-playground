import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sync/")({
  component: RouteComponent,
  loader: () => ({ crumb: "Sync" }),
});

// SYNC PLAN (Kanban boards)
// Boards: 1 Row, infinite columns, horizontal scroll on overflow
// Lists (Columns): Draggable, Header title (click to rename), table options button, Cards, + Add Card (footer)
// Add card, copy list, move list, move all cards
// Cards (Rows): Draggable, Edit, Embed preview, text, links (Title -> Desc -> Full link)
// Adding a card from bottom shows the input at bottom of the list
// Adding a card from top right control shows input at top of the list
// Card attribution, labels, move, start date & due date, reminders

function RouteComponent() {
  return <div className="flex-grow w-full h-full p-6">Hello "/sync/"!</div>;
}
