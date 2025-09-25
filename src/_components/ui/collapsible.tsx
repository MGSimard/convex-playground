import * as React from "react";
import { Collapsible as BaseCollapsible } from "@base-ui-components/react/collapsible";

import { cn } from "@/_lib/utils";

function Collapsible({ ...props }: BaseCollapsible.Root.Props) {
  return <BaseCollapsible.Root {...props} />;
}

function CollapsibleTrigger({ ...props }: BaseCollapsible.Trigger.Props) {
  return <BaseCollapsible.Trigger {...props} />;
}

function CollapsibleContent({ className, ...props }: BaseCollapsible.Panel.Props) {
  return (
    <BaseCollapsible.Panel
      className={cn(
        "h-[var(--collapsible-panel-height)] overflow-hidden text-sm transition-all duration-200 data-ending-style:h-0 data-starting-style:h-0",
        className
      )}
      {...props}
    />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
