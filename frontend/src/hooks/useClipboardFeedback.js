import { useCallback, useEffect, useRef, useState } from "react";

export default function useClipboardFeedback(duration = 2000) {
  const [copiedField, setCopiedField] = useState("");
  const resetTimersRef = useRef([]);

  const copy = useCallback((text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    resetTimersRef.current.push(window.setTimeout(() => setCopiedField(""), duration));
  }, [duration]);

  useEffect(() => () => resetTimersRef.current.forEach(window.clearTimeout), []);

  return { copiedField, copy };
}
