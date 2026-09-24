import { useCallback, useRef } from "react";

export default function useLatestRequest() {
  const sequenceRef = useRef(0);
  const beginRequest = useCallback(() => ++sequenceRef.current, []);
  const isLatestRequest = useCallback((sequence) => sequence === sequenceRef.current, []);

  return { beginRequest, isLatestRequest };
}
