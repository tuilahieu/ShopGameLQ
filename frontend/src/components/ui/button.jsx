import { cn } from "./utils";

const variants = {
  default: "ui-button-default",
  outline: "ui-button-outline",
  secondary: "ui-button-secondary",
  ghost: "ui-button-ghost",
  destructive: "ui-button-destructive",
};

const sizes = {
  default: "ui-button-default-size",
  sm: "ui-button-sm",
  lg: "ui-button-lg",
  icon: "ui-button-icon",
};

export function Button({ className, variant = "default", size = "default", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={cn("ui-button", variants[variant] || variants.default, sizes[size] || sizes.default, className)}
      {...props}
    />
  );
}
