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
import { Toaster } from "@/_components/ui/sonner";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  loader: () => ({ crumb: "Dashboard" }),
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
          <Toaster richColors toastOptions={{ style: { borderRadius: "0" } }} />
        </TooltipProvider>
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools buttonPosition="bottom-right" />
    </>
  ),
});
