import { cn } from "./utils";

export function Skeleton({ className, ...props }) {
  return <span className={cn("ui-skeleton", className)} aria-hidden="true" {...props} />;
}
