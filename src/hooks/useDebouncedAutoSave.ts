import { useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

interface Options<T> {
  /** Current draft value; when it changes and differs from last saved, save is scheduled */
  value: T;
  /** Compare with server value to know if a change actually happened */
  serverValue: T;
  /** Function that persists the value; must return true on success */
  onSave: (value: T) => Promise<boolean>;
  /** Debounce in ms (default 1500) */
  delay?: number;
  /** Disable saving (e.g. auth loading) */
  enabled?: boolean;
}

/**
 * Debounced autosave hook.
 * - Detects changes to `value` vs. `serverValue`.
 * - Waits `delay` ms of idle typing, then saves.
 * - Flushes on window blur / visibility change / unmount / beforeunload.
 */
export function useDebouncedAutoSave<T>({
  value,
  serverValue,
  onSave,
  delay = 1500,
  enabled = true,
}: Options<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValueRef = useRef<T>(value);
  const savedSerializedRef = useRef<string>(JSON.stringify(serverValue));
  const savingRef = useRef(false);
  const pendingRef = useRef(false);

  // Track latest value for out-of-band flush.
  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  // Refresh baseline when server value changes (e.g. after reload).
  useEffect(() => {
    savedSerializedRef.current = JSON.stringify(serverValue);
  }, [serverValue]);

  const doSave = async (val: T) => {
    if (savingRef.current) {
      pendingRef.current = true;
      return;
    }
    savingRef.current = true;
    setStatus("saving");
    try {
      const ok = await onSave(val);
      if (ok) {
        savedSerializedRef.current = JSON.stringify(val);
        setStatus("saved");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      savingRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        // A newer value arrived while saving — save it too.
        void doSave(latestValueRef.current);
      }
    }
  };

  // Schedule debounced save when value differs from last saved.
  useEffect(() => {
    if (!enabled) return;
    const serialized = JSON.stringify(value);
    if (serialized === savedSerializedRef.current) {
      if (status === "pending") setStatus("saved");
      return;
    }
    setStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void doSave(latestValueRef.current);
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, enabled, delay]);

  // Flush on tab hide / blur / unload / unmount.
  useEffect(() => {
    if (!enabled) return;
    const flush = () => {
      const serialized = JSON.stringify(latestValueRef.current);
      if (serialized !== savedSerializedRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        void doSave(latestValueRef.current);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("blur", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush(); // unmount flush
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { status };
}
