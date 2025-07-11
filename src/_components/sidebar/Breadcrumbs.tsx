import { Fragment, useState } from "react";
import { Link, useMatches, isMatch } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbSeparator,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbEllipsis,
} from "@/_components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/_components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/_components/ui/drawer";
import { Button } from "@/_components/ui/button";
import { useMediaQuery } from "@/_hooks/useMediaQuery";
import { ToggleTheme } from "@/_components/ToggleTheme";
import { SidebarTrigger } from "@/_components/ui/sidebar";
import { Separator } from "@/_components/ui/separator";

export function Breadcrumbs() {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const matches = useMatches();
  if (matches.some((match) => match.status === "pending")) return null;

  const segments = matches.filter((match) => isMatch(match, "loaderData.crumb"));
  const currentSegment = segments.pop();
  const ITEMS_TO_DISPLAY = 3;

  return (
    <header className="flex h-[var(--header-height)] px-6 shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator orientation="vertical" className="mr-1.5 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {segments.length > ITEMS_TO_DISPLAY - 1 ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild className="max-w-20 truncate md:max-w-none">
                    <Link to={segments[0]!.fullPath}>{segments[0]?.loaderData?.crumb}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isDesktop ? (
                    <DropdownMenu open={open} onOpenChange={setOpen}>
                      <DropdownMenuTrigger className="flex items-center gap-1" aria-label="Toggle menu">
                        <BreadcrumbEllipsis className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {segments.slice(1).map((segment, index) => (
                          <DropdownMenuItem key={index}>
                            <Link to={segment.fullPath ?? "#"}>{segment.loaderData?.crumb}</Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Drawer open={open} onOpenChange={setOpen}>
                      <DrawerTrigger aria-label="Toggle Menu">
                        <BreadcrumbEllipsis className="h-4 w-4" />
                      </DrawerTrigger>
                      <DrawerContent>
                        <DrawerHeader className="text-left">
                          <DrawerTitle>Navigate to</DrawerTitle>
                          <DrawerDescription>Select a page to navigate to.</DrawerDescription>
                        </DrawerHeader>
                        <div className="grid gap-1 px-4">
                          {segments.slice(1).map((segment) => (
                            <Link key={segment.index} to={segment.fullPath ?? "#"} className="py-1 text-sm">
                              {segment.loaderData?.crumb}
                            </Link>
                          ))}
                        </div>
                        <DrawerFooter className="pt-4">
                          <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                  )}
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            ) : (
              segments.map((segment) => (
                <Fragment key={segment.index}>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild className="max-w-20 truncate md:max-w-none">
                      <Link to={segment.fullPath}>{segment.loaderData?.crumb}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </Fragment>
              ))
            )}
            {currentSegment && (
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-20 truncate md:max-w-none">
                  {currentSegment?.loaderData?.crumb}
                </BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <ToggleTheme />
    </header>
  );
}
