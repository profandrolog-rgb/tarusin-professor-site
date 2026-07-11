import { useRef, useEffect } from "react";
function useHashOpen(prefix, ready, onOpen) {
  const lastHandled = useRef(null);
  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    const handle = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash || !hash.startsWith(`${prefix}-`)) return;
      const id = hash.slice(prefix.length + 1);
      if (!id || lastHandled.current === hash) return;
      lastHandled.current = hash;
      onOpen == null ? void 0 : onOpen(id);
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
export {
  useHashOpen as u
};
