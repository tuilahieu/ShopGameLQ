import { Children, forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "./utils";

function optionValue(option) {
  return String(option?.props?.value ?? "");
}

function nextEnabled(options, start, direction) {
  if (!options.length) return -1;
  let index = start;
  for (let count = 0; count < options.length; count += 1) {
    index = (index + direction + options.length) % options.length;
    if (!options[index]?.props?.disabled) return index;
  }
  return start;
}

export const Select = forwardRef(function Select({
  id,
  name,
  value: valueProp,
  defaultValue,
  onChange,
  className,
  children,
  disabled = false,
  required = false,
  placeholder,
  ...props
}, ref) {
  const generatedId = useId();
  const triggerId = id || `ui-select-${generatedId.replace(/:/g, "")}`;
  const listboxId = `${triggerId}-listbox`;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const isControlled = valueProp !== undefined;
  const value = String(isControlled ? valueProp ?? "" : internalValue);
  const options = useMemo(() => Children.toArray(children).filter((child) => child?.type), [children]);
  const selectedIndex = options.findIndex((option) => optionValue(option) === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  useImperativeHandle(ref, () => triggerRef.current);

  useEffect(() => {
    function handleOutsidePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const index = selectedIndex >= 0 ? selectedIndex : 0;
    setActiveIndex(index);
    window.requestAnimationFrame(() => optionRefs.current[index]?.focus());
  }, [open, selectedIndex]);

  function openMenu(preferredIndex = selectedIndex) {
    if (disabled || !options.length) return;
    setActiveIndex(preferredIndex >= 0 ? preferredIndex : 0);
    setOpen(true);
  }

  function selectOption(option, index) {
    if (option?.props?.disabled) return;
    const nextValue = optionValue(option);
    if (!isControlled) setInternalValue(nextValue);
    onChange?.({ target: { name, value: nextValue }, currentTarget: { name, value: nextValue } });
    setOpen(false);
    setActiveIndex(index);
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(event) {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(event.key === "ArrowDown" ? selectedIndex : nextEnabled(options, selectedIndex, -1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) setOpen(false);
      else openMenu();
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  function handleOptionKeyDown(event, index) {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      const next = nextEnabled(options, index, 1);
      setActiveIndex(next);
      optionRefs.current[next]?.focus();
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      const next = nextEnabled(options, index, -1);
      setActiveIndex(next);
      optionRefs.current[next]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : options.length - 1;
      setActiveIndex(next);
      optionRefs.current[next]?.focus();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectOption(options[index], index);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  return (
    <div ref={rootRef} className="ui-select-root">
      {name && <input type="hidden" name={name} value={value} readOnly />}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className={cn("ui-select", "ui-select-trigger", open && "is-open", className)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-required={required || undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        {...props}
      >
        <span className={!selectedOption ? "ui-select-placeholder" : undefined}>{selectedOption?.props?.children ?? placeholder ?? "Chọn một mục"}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div id={listboxId} className="ui-select-menu" role="listbox" aria-labelledby={triggerId}>
          {options.map((option, index) => {
            const optionValueString = optionValue(option);
            const selected = optionValueString === value;
            return (
              <button
                key={option.key || `${optionValueString}-${index}`}
                ref={(element) => { optionRefs.current[index] = element; }}
                type="button"
                className="ui-select-option"
                role="option"
                aria-selected={selected}
                disabled={option.props.disabled}
                tabIndex={index === activeIndex ? 0 : -1}
                onClick={() => selectOption(option, index)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
              >
                <span>{option.props.children}</span>
                {selected && <Check size={15} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
