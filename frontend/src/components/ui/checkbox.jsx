import { forwardRef, useEffect, useRef } from "react";
import { cn } from "./utils";

export const Checkbox = forwardRef(function Checkbox({ className, indeterminate = false, ...props }, ref) {
  const localRef = useRef(null);
  const inputRef = ref || localRef;

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate, inputRef]);

  return <input ref={inputRef} type="checkbox" className={cn("ui-checkbox", className)} {...props} />;
});
