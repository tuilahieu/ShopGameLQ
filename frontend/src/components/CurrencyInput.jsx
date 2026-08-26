import { useEffect, useRef, useState } from "react";

function formatVietnameseNumber(val) {
  if (val === null || val === undefined || val === "") return "";
  const digits = String(val).replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
}

/**
 * Currency/Number Input component that formats numbers into thousands separator (e.g. 1.000.000)
 * 0.5s (500ms) after typing stops or on blur, while preserving raw numeric value in form state.
 */
export default function CurrencyInput({
  value,
  onChange,
  onBlur,
  debounceMs = 500,
  placeholder = "VD: 50.000",
  className = "",
  style,
  id,
  name,
  disabled,
  required,
  autoFocus,
  ...props
}) {
  const [displayValue, setDisplayValue] = useState(() => formatVietnameseNumber(value));
  const timerRef = useRef(null);
  const isTypingRef = useRef(false);

  // Synchronize when value changes externally from parent (e.g. form load/reset)
  useEffect(() => {
    if (!isTypingRef.current) {
      setDisplayValue(formatVietnameseNumber(value));
    }
  }, [value]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleChange(e) {
    const rawInput = e.target.value;
    const rawDigits = rawInput.replace(/\D/g, "");

    isTypingRef.current = true;
    setDisplayValue(rawInput);

    // Provide synthetic event so standard `(e) => set("key", e.target.value)` works seamlessly
    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: name || e.target.name,
          value: rawDigits,
          rawValue: rawDigits ? Number(rawDigits) : 0,
        },
      };
      onChange(syntheticEvent);
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!rawDigits) {
      setDisplayValue("");
      isTypingRef.current = false;
      return;
    }

    timerRef.current = setTimeout(() => {
      setDisplayValue(formatVietnameseNumber(rawDigits));
      isTypingRef.current = false;
    }, debounceMs);
  }

  function handleBlur(e) {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const rawDigits = displayValue.replace(/\D/g, "");
    setDisplayValue(formatVietnameseNumber(rawDigits));
    isTypingRef.current = false;

    if (onBlur) {
      onBlur(e);
    }
  }

  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      id={id}
      name={name}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      style={style}
      disabled={disabled}
      required={required}
      autoFocus={autoFocus}
      autoComplete="off"
    />
  );
}
