import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/_components/ui/sidebar";
import { NavMain } from "./NavMain";
import { NavAdmin } from "./NavAdmin";
import { NavUser } from "./NavUser";
import {
  Activity,
  AppWindowMac,
  AudioWaveform,
  Blocks,
  Building,
  ChartNoAxesColumnIncreasing,
  Command,
  CreditCard,
  GalleryVerticalEnd,
  Gauge,
  Key,
  KeySquare,
  Settings,
  ShieldCheck,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { TeamSwitcher } from "./NavTeamSwitcher";

const NAV_LINKS = {
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Pro",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Pro",
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
      title: "Link Two",
      url: "/dashboard/link-two",
      icon: Activity,
    },
    {
      title: "Link Three",
      url: "/dashboard/link-three",
      icon: Target,
    },
    {
      title: "Link Four",
      url: "/dashboard/link-four",
      icon: ChartNoAxesColumnIncreasing,
    },
    {
      title: "Link Five",
      url: "/dashboard/link-five",
      icon: ShieldCheck,
    },
    {
      title: "The Thing",
      url: "/dashboard/The Thing",
      icon: AppWindowMac,
    },
  ],
  admin: [
    {
      title: "General",
      url: "/dashboard/organization-settings",
      icon: Building,
      activeExact: true,
    },
    {
      title: "Team",
      url: "/dashboard/organization-settings/team",
      icon: Users,
    },
    {
      title: "Billing",
      url: "/dashboard/organization-settings/billing",
      icon: CreditCard,
    },
    {
      title: "Integrations",
      url: "/dashboard/organization-settings/integrations",
      icon: Blocks,
    },
    {
      title: "API Keys",
      url: "/dashboard/organization-settings/api-keys",
      icon: KeySquare,
    },
  ],
};

export function DashboardSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher teams={NAV_LINKS.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={NAV_LINKS.navMain} />
        <NavAdmin items={NAV_LINKS.admin} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
