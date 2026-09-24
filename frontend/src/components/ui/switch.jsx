import { cn } from "./utils";

export function Switch({ checked, onChange, id, className, disabled = false, ...props }) {
  return (
    <label className={cn("ui-switch", disabled && "is-disabled", className)} htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} disabled={disabled} {...props} />
      <span aria-hidden="true" />
    </label>
  );
}
