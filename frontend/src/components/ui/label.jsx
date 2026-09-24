import { forwardRef } from "react";
import { cn } from "./utils";

export const Label = forwardRef(function Label({ className, ...props }, ref) {
  return <label ref={ref} className={cn("ui-label", className)} {...props} />;
});
