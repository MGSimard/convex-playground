// SWAPPED ORIGINAL DESTRUCTURING OF RADIX TOOLTIP FOR BASE UI TOOLTIP
// RADIX TOOLTIP HAS HORRIBLE UNADDRESSED PERFORMANCE ISSUES
import * as React from "react";
import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip";
import { cn } from "@/_lib/utils";

function TooltipProvider({ children, ...props }: React.ComponentProps<typeof BaseTooltip.Provider>) {
  return (
    <BaseTooltip.Provider data-slot="tooltip-provider" {...props}>
      {children}
    </BaseTooltip.Provider>
  );
}

function Tooltip({ delay = 0, hoverable = false, ...props }: React.ComponentProps<typeof BaseTooltip.Root>) {
  return <BaseTooltip.Root data-slot="tooltip" delay={delay} hoverable={hoverable} {...props} />;
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof BaseTooltip.Trigger>) {
  return <BaseTooltip.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 8,
  side = "top",
  align = "center",
  children,
  ...props
}: React.ComponentProps<typeof BaseTooltip.Popup> & {
  sideOffset?: number;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner side={side} align={align} sideOffset={sideOffset} positionMethod="fixed" className="z-50">
        <BaseTooltip.Popup
          data-slot="tooltip-content"
          className={cn("bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs", className)}
          {...props}>
          {children}
          <BaseTooltip.Arrow className="text-primary data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
            <ArrowSvg />
          </BaseTooltip.Arrow>
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}

function ArrowSvg(props: React.ComponentProps<"svg">) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-primary"
      />
    </svg>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
