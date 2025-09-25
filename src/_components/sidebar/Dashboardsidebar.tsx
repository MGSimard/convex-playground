import { NavMain } from "./NavMain";
import { NavAdmin } from "./NavAdmin";
import { NavUser } from "./NavUser";
import { NAV_LINKS } from "./NavLinks";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/_components/ui/sidebar";

export function DashboardSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <NavAdmin items={NAV_LINKS.admin} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={NAV_LINKS.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
