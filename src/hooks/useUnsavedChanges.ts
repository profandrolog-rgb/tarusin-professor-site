import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Unified "unsaved changes" guard (same behaviour as visit protocols):
 * - isDirty compares the current snapshot with the last loaded/saved one;
 * - browser warns on tab close / reload while dirty;
 * - a local draft is kept in localStorage while dirty and offered for restore.
 */
export function useUnsavedChanges<T>({ key, data, ready }: { key: string; data: T; ready: boolean }) {
  const storageKey = `unsaved_${key}`;
  const serialized = JSON.stringify(data);
  const baselineRef = useRef<string | null>(null);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ data: T; savedAt: number } | null>(null);

  // Capture baseline once data is loaded; check for a stored draft.
  useEffect(() => {
    if (!ready || baselineRef.current !== null) return;
    baselineRef.current = serialized;
    setBaseline(serialized);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && JSON.stringify(parsed.data) !== serialized) setDraft(parsed);
        else localStorage.removeItem(storageKey);
      }
    } catch { /* ignore */ }
  }, [ready, serialized, storageKey]);

  // Reset when switching to another record.
  useEffect(() => () => { baselineRef.current = null; }, [storageKey]);

  const isDirty = baseline !== null && serialized !== baseline;
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  // Persist draft while dirty (debounced).
  useEffect(() => {
    if (!isDirty) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify({ data: JSON.parse(serialized), savedAt: Date.now() })); } catch { /* quota */ }
    }, 800);
    return () => clearTimeout(t);
  }, [isDirty, serialized, storageKey]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        try { localStorage.setItem(storageKey, JSON.stringify({ data: JSON.parse(serialized), savedAt: Date.now() })); } catch { /* */ }
        e.preventDefault(); e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [serialized, storageKey]);

  /** Call after a successful save. */
  const markSaved = useCallback(() => {
    baselineRef.current = serialized;
    setBaseline(serialized);
    setDraft(null);
    try { localStorage.removeItem(storageKey); } catch { /* */ }
  }, [serialized, storageKey]);

  const discardDraft = useCallback(() => {
    setDraft(null);
    try { localStorage.removeItem(storageKey); } catch { /* */ }
  }, [storageKey]);

  const confirmLeave = useCallback((msg = "Есть несохранённые изменения. Уйти без сохранения?") => {
    return !dirtyRef.current || window.confirm(msg);
  }, []);

  return { isDirty, draft, discardDraft, markSaved, confirmLeave };
}
