type DiagnosticLevel = "info" | "warn" | "error";

interface DiagnosticEntry {
  at: string;
  bootId: string;
  level: DiagnosticLevel;
  event: string;
  path: string;
  detail?: unknown;
}

const STORAGE_KEY = "tarusin:runtime-diagnostics";
const MAX_ENTRIES = 160;

function safeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (value instanceof Event) return { type: value.type };
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

export function installRuntimeDiagnostics() {
  if (typeof window === "undefined" || window.__runtimeDiagnosticsInstalled) return;
  window.__runtimeDiagnosticsInstalled = true;

  const bootId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const write = (event: string, detail?: unknown, level: DiagnosticLevel = "info") => {
    const entry: DiagnosticEntry = {
      at: new Date().toISOString(),
      bootId,
      level,
      event,
      path: `${location.pathname}${location.search}${location.hash}`,
      detail: safeValue(detail),
    };

    try {
      const previous = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
      const entries = Array.isArray(previous) ? previous : [];
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...entries, entry].slice(-MAX_ENTRIES)));
    } catch {
      // Console telemetry remains available when storage is blocked.
    }

    const logger = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
    logger(`[runtime:${event}]`, entry);
  };

  window.__runtimeDiagnostics = {
    read: () => {
      try {
        return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]") as DiagnosticEntry[];
      } catch {
        return [];
      }
    },
    clear: () => sessionStorage.removeItem(STORAGE_KEY),
    record: write,
  };

  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  write("boot", {
    navigationType: navigation?.type,
    referrer: document.referrer,
    visibility: document.visibilityState,
  });

  window.addEventListener("error", (event) => {
    write("window-error", {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      error: event.error,
    }, "error");
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    write("unhandled-rejection", event.reason, "error");
  });

  window.addEventListener("beforeunload", () => write("beforeunload"));
  window.addEventListener("pagehide", (event) => write("pagehide", { persisted: event.persisted }));
  window.addEventListener("pageshow", (event) => write("pageshow", { persisted: event.persisted }));
  document.addEventListener("visibilitychange", () => write("visibility", document.visibilityState));

  let lastInteractionAt = 0;
  const recordInteraction = (event: Event) => {
    const now = Date.now();
    if (now - lastInteractionAt < 400) return;
    lastInteractionAt = now;
    const element = event.target instanceof Element ? event.target : null;
    const targetDescription = element
      ? `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${element.getAttribute("aria-label") ? `[aria-label=${element.getAttribute("aria-label")}]` : ""}`
      : undefined;
    write(`interaction:${event.type}`, { target: targetDescription, x: window.scrollX, y: window.scrollY });
  };
  window.addEventListener("click", recordInteraction, true);
  window.addEventListener("pointerdown", recordInteraction, true);
  window.addEventListener("wheel", recordInteraction, { capture: true, passive: true });
  window.addEventListener("scroll", recordInteraction, { capture: true, passive: true });

  // Do not wrap pushState/replaceState here. The embedded Preview Bridge also
  // observes the History API to synchronize its iframe URL; replacing these
  // methods can detach the viewer during client-side navigation.
  window.addEventListener("popstate", () => write("history:popstate"));

  if (import.meta.hot) {
    import.meta.hot.on("vite:beforeUpdate", (payload) => write("hmr:beforeUpdate", payload));
    import.meta.hot.on("vite:afterUpdate", (payload) => write("hmr:afterUpdate", payload));
    import.meta.hot.on("vite:beforeFullReload", (payload) => write("hmr:beforeFullReload", payload, "warn"));
    import.meta.hot.on("vite:error", (payload) => write("hmr:error", payload, "error"));
    import.meta.hot.on("vite:invalidate", (payload) => write("hmr:invalidate", payload, "warn"));
  }
}

declare global {
  interface Window {
    __runtimeDiagnosticsInstalled?: boolean;
    __runtimeDiagnostics?: {
      read: () => DiagnosticEntry[];
      clear: () => void;
      record: (event: string, detail?: unknown, level?: DiagnosticLevel) => void;
    };
  }
}