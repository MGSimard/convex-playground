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
      url: "/",
      icon: Gauge,
      activeExact: true,
    },
    {
      title: "Hive",
      url: "/hive",
      icon: MessageSquareText,
    },
    {
      title: "Sync",
      url: "/sync",
      icon: Columns3,
    },
    {
      title: "Cortex",
      url: "/cortex",
      icon: NotepadText,
    },
    {
      title: "Trace",
      url: "/trace",
      icon: PencilRuler,
    },
  ],
};
