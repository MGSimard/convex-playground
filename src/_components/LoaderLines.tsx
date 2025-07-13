import { cn } from "@/_lib/utils";

export function LoaderLines({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="loader-blocks"
      className={cn(
        "grid grid-cols-3 gap-2 size-24 [&>*]:bg-muted [&>*]:rounded-sm [&>*]:animate-pulse [&>*]:[animation-duration:1.5s] [&>*]:[animation-delay:calc(var(--i)*0.15s+sin(var(--i)*1rad)*0.3s)]",
        className
      )}
      {...props}>
      <span className="[--i:0]" />
      <span className="[--i:1]" />
      <span className="[--i:2]" />
    </div>
  );
}
