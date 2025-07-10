import { Building, Columns3, Gauge, MessageSquareText, NotepadText, PencilRuler, Users } from "lucide-react";

export const NAV_LINKS = {
  admin: [
    {
      title: "General",
      url: "/organization-settings",
      icon: Building,
      activeExact: true,
    },
    {
      title: "Team",
      url: "/organization-settings/team",
      icon: Users,
    },
  ],
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: Gauge,
      activeExact: true,
    },
    {
      title: "Hive",
      url: "/dashboard/hive",
      icon: MessageSquareText,
    },
    {
      title: "Sync",
      url: "/dashboard/sync",
      icon: Columns3,
    },
    {
      title: "Cortex",
      url: "/dashboard/cortex",
      icon: NotepadText,
    },
    {
      title: "Excalidraw",
      url: "/dashboard/excalidraw",
      icon: PencilRuler,
    },
  ],
};
