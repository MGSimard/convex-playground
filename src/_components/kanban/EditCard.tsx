import { Button } from "@/_components/ui/button";
import type { Doc } from "../../../convex/_generated/dataModel";
import { SquarePen, Link, Eye, FileText } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/_components/ui/dialog";
import { cn } from "@/_lib/utils";
import { Textarea } from "@/_components/ui/textarea";
import { Label } from "@/_components/ui/label";

const TABS = [
  {
    label: "Content",
    icon: <FileText />,
  },
  {
    label: "Links",
    icon: <Link />,
  },
] as const;
type Tab = (typeof TABS)[number];

interface EditCardProps {
  card: Doc<"cards">;
}

export function EditCard({ card }: EditCardProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(TABS[0]);
  const [cardText, setCardText] = useState(card.content);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="bg-muted size-6 absolute top-1 right-1 z-10 invisible group-hover:visible transition-all duration-150">
          <SquarePen />
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 gap-0 flex h-[min(400px,calc(100dvh-32px))] max-w-[min(500px,calc(100dvw-32px))]">
        <nav className="shrink-0 border-r bg-sidebar p-2">
          <ul className="flex flex-col gap-2">
            {TABS.map((tab) => (
              <li key={tab.label}>
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab(tab)}
                  className={cn("size-8", activeTab?.label === tab.label && "bg-primary! text-primary-foreground!")}
                  aria-active={activeTab.label === tab.label}
                  aria-label={tab.label}>
                  {tab.icon}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex flex-col w-full overflow-hidden">
          <header className="shrink-0 p-4 border-b">
            <DialogTitle className="flex items-center gap-2">Edit Card</DialogTitle>
            <DialogDescription className="sr-only">Edit the card content and links.</DialogDescription>
          </header>
          <div className="grow flex flex-col gap-4 p-4 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent]">
            {activeTab.label === "Content" && <TabContent content={cardText} setCardText={setCardText} />}
            {activeTab.label === "Links" && <TabLinks />}
          </div>
          <div className="shrink-0 flex items-center justify-end gap-2 p-4 border-t">
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </div>
        </main>
      </DialogContent>
    </Dialog>
  );
}

interface TabContentProps {
  content: string;
  setCardText: Dispatch<SetStateAction<string>>;
}

function TabContent({ content, setCardText }: TabContentProps) {
  return (
    <>
      <Label htmlFor="card-content" className="text-xs text-muted-foreground">
        Describe the task, add notes, or provide detailed information.
      </Label>
      <Textarea
        id="card-content"
        value={content}
        onChange={(e) => setCardText(e.target.value)}
        placeholder="Enter card content..."
        className="min-h-[150px] resize-none [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent]"
        required
        minLength={1}
        autoFocus
      />
    </>
  );
}

function TabLinks() {
  return (
    <>
      <p className="text-xs text-muted-foreground mb-4">
        Add external resources, references, or related content to this card.
      </p>
    </>
  );
}
