import { useCallback, useEffect, useRef, useState } from "react";

type SaveStatus = "idle" | "saving" | "saved";

export function useSaveFeedback(resetAfterMs = 1600) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<number | null>(null);

  function clearResetTimer() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  useEffect(() => {
    return () => clearResetTimer();
  }, []);

  const startSaving = useCallback(() => {
    clearResetTimer();
    setStatus("saving");
  }, []);

  const markSaved = useCallback(() => {
    clearResetTimer();
    setStatus("saved");

    timeoutRef.current = window.setTimeout(() => {
      setStatus("idle");
      timeoutRef.current = null;
    }, resetAfterMs);
  }, [resetAfterMs]);

  const reset = useCallback(() => {
    clearResetTimer();
    setStatus("idle");
  }, []);

  return {
    status,
    isSaving: status === "saving",
    startSaving,
    markSaved,
    reset,
  };
}
