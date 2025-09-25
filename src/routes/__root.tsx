import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@/_components/ThemeProvider";
import { TooltipProvider } from "@/_components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/_components/ui/sidebar";
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
      <TanStackDevtools
        config={{
          position: "bottom-left",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
          {
            name: "Tanstack Query",
            render: <ReactQueryDevtoolsPanel />,
          },
        ]}
      />
    </>
  ),
});
