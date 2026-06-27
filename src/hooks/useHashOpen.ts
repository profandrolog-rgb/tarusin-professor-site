import { useEffect, useRef } from "react";

/**
 * Opens a specific item on a list page when the URL hash matches `${prefix}-${id}`.
 * - Waits for `ready` (e.g. data loaded) before acting.
 * - Calls `onOpen(id)` so the page can expand/select the item.
 * - Scrolls the element with `id={`${prefix}-${id}`}` into view and adds a brief highlight.
 *
 * Re-runs when the hash changes so users can navigate between materials without reloads.
 */
export function useHashOpen(prefix: string, ready: boolean, onOpen?: (id: string) => void) {
  const lastHandled = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;

    const handle = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash || !hash.startsWith(`${prefix}-`)) return;
      const id = hash.slice(prefix.length + 1);
      if (!id || lastHandled.current === hash) return;
      lastHandled.current = hash;

      onOpen?.(id);

      // Give state a tick to expand the item before scrolling.
      setTimeout(() => {
        const el = document.getElementById(`${prefix}-${id}`);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("ring-2", "ring-primary", "ring-offset-2", "transition-shadow");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 2400);
      }, 120);
    };

    handle();
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, [prefix, ready, onOpen]);
}
