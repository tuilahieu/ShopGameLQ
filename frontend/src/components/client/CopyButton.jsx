import { Check, Copy } from "lucide-react";

export default function CopyButton({ value, field, copiedField, onCopy, label, size = 15 }) {
  return (
    <button
      type="button"
      onClick={() => onCopy(value, field)}
      className="copy-badge"
      aria-label={label}
    >
      {copiedField === field
        ? <Check size={size} aria-hidden="true" />
        : <Copy size={size} aria-hidden="true" />}
    </button>
  );
}
