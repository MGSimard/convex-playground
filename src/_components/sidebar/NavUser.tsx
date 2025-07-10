import { Ellipsis, LifeBuoy, LogIn, LogOut, Settings2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/_components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/_components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/_components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { data: user, isPending, error } = useQuery(convexQuery(api.authActions.currentUser, {}));
  const { signIn, signOut } = useAuthActions();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {isPending && "Pending"}
        <AuthLoading>Auth is Loading...</AuthLoading>
        <Unauthenticated>
          <SidebarMenuButton onClick={() => void signIn("github")}>
            <LogIn />
            Sign in
          </SidebarMenuButton>
        </Unauthenticated>
        <Authenticated>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.image} alt="User avatar" />
                  <AvatarFallback className="rounded-lg">{user?.name?.charAt(0) ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name ?? "Unknown"}</span>
                  <span className="truncate text-xs">{user?.email ?? "Unknown@email.com"}</span>
                </div>
                <Ellipsis className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.image} alt="User avatar" />
                    <AvatarFallback className="rounded-lg">{user?.name?.charAt(0) ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.name ?? "Unknown"}</span>
                    <span className="truncate text-xs">{user?.email ?? "Unknown@email.com"}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings2 />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LifeBuoy />
                Help Center
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void signOut()}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Authenticated>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
