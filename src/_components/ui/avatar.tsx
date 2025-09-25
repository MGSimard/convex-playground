import * as React from "react";
import { Avatar as AvatarBase } from "@base-ui-components/react/avatar";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/_lib/utils";

const avatarVariants = cva("relative flex shrink-0 overflow-hidden rounded-full", {
  variants: {
    size: {
      sm: "size-8 text-sm",
      md: "size-10",
      lg: "size-12 text-lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

function Avatar({
  className,
  size,
  ...props
}: React.ComponentProps<typeof AvatarBase.Root> & VariantProps<typeof avatarVariants>) {
  return <AvatarBase.Root className={cn(avatarVariants({ size }), className)} {...props} />;
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarBase.Image>) {
  return <AvatarBase.Image className={cn("size-full object-cover", className)} {...props} />;
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarBase.Fallback>) {
  return (
    <AvatarBase.Fallback
      className={cn("bg-muted flex size-full items-center justify-center rounded-full select-none", className)}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
