import { Ellipsis, LifeBuoy, LogIn, LogOut, Settings2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useAuthActions } from "@convex-dev/auth/react";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/_components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/_components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/_components/ui/avatar";
import { Skeleton } from "@/_components/ui/skeleton";
import { useSignOut } from "@/_hooks/useSignOut";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { data: user } = useQuery(convexQuery(api.auth.currentUserData, {}));
  const { signIn } = useAuthActions();
  const handleSignOut = useSignOut();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <AuthLoading>
          <NavUserSkeleton />
        </AuthLoading>
        <Unauthenticated>
          <SidebarMenuButton onClick={() => void signIn("github")}>
            <LogIn />
            Sign in
          </SidebarMenuButton>
        </Unauthenticated>
        <Authenticated>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                />
              }>
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.image} alt="User avatar" />
                <AvatarFallback className="rounded-lg">{user?.name?.charAt(0) ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name ?? "Unknown"}</span>
                <span className="truncate text-xs">{user?.email ?? "Unknown@email.com"}</span>
              </div>
              <Ellipsis className="ml-auto size-4" />
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
              <DropdownMenuItem onClick={handleSignOut}>
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

function NavUserSkeleton() {
  return (
    <SidebarMenuButton size="lg" disabled>
      <Skeleton className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground shrink-0">
        . . .
      </Skeleton>
      <div className="grid flex-1 text-left text-sm leading-tight text-muted-foreground">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-3 w-20 rounded-md" />
      </div>
      <Ellipsis className="ml-auto size-4 text-muted-foreground" />
    </SidebarMenuButton>
  );
}
