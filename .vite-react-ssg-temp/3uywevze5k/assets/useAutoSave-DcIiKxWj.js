import { useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
const AUTO_SAVE_INTERVAL = 3 * 60 * 1e3;
function useAutoSave({ key, data, enabled = true }) {
  const storageKey = `autosave_${key}`;
  const lastSavedRef = useRef("");
  const save = useCallback(() => {
    const serialized = JSON.stringify(data);
    if (serialized !== lastSavedRef.current) {
      localStorage.setItem(storageKey, serialized);
      lastSavedRef.current = serialized;
      toast.success("Черновик сохранён", { duration: 1500, id: "autosave" });
    }
  }, [data, storageKey]);
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(save, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [save, enabled]);
  useEffect(() => {
    if (!enabled) return;
    return () => {
      const serialized = JSON.stringify(data);
      if (serialized !== lastSavedRef.current) {
        localStorage.setItem(storageKey, serialized);
      }
    };
  }, [data, storageKey, enabled]);
  useEffect(() => {
    if (!enabled) return;
    const handler = () => {
      localStorage.setItem(storageKey, JSON.stringify(data));
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [data, storageKey, enabled]);
  const loadDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch {
    }
    return null;
  }, [storageKey]);
  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    lastSavedRef.current = "";
  }, [storageKey]);
  const hasDraft = useCallback(() => {
    return !!localStorage.getItem(storageKey);
  }, [storageKey]);
  return { save, loadDraft, clearDraft, hasDraft };
}
export {
  useAutoSave as u
};
