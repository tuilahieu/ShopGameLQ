import { forwardRef } from "react";
import { cn } from "./utils";

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn("ui-textarea", className)} {...props} />;
});
