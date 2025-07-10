import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/_components/ThemeProvider";
import { TooltipProvider } from "@/_components/ui/tooltip";
import { SidebarProvider } from "@/_components/ui/sidebar";
import { SidebarInset } from "@/_components/ui/sidebar";
import { Breadcrumbs } from "@/_components/sidebar/Breadcrumbs";
import { DashboardSidebar } from "@/_components/sidebar/DashboardSidebar";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <SidebarProvider>
            <DashboardSidebar />
            <SidebarInset>
              <Breadcrumbs />
              <Outlet />
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools buttonPosition="bottom-right" />
    </>
  ),
});
