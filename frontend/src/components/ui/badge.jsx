import { cn } from "./utils";

const variants = {
  default: "ui-badge-default",
  secondary: "ui-badge-secondary",
  success: "ui-badge-success",
  warning: "ui-badge-warning",
  destructive: "ui-badge-destructive",
  outline: "ui-badge-outline",
};

export function Badge({ className, variant = "default", ...props }) {
  return <span className={cn("ui-badge", variants[variant] || variants.default, className)} {...props} />;
}
