import React from "react";
import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./App";
import { installBackendFailover } from "./lib/backendFailover";
import { installChunkReload } from "./lib/chunkReload";
import "./i18n";
import "./index.css";

if (typeof window !== "undefined") {
  // The stale production-chunk recovery must never run in Vite's live preview.
  // During HMR a module can be temporarily unavailable while its graph is being
  // replaced; treating that as a deployed stale chunk reloads the preview iframe
  // and can leave the editor disconnected instead of showing its normal refresh.
  if (import.meta.env.PROD) installChunkReload();
  installBackendFailover();
}


// Suppress "useLayoutEffect does nothing on the server" warnings from third-party libs (Radix, TipTap и т.п.) во время SSG-рендеринга.
if (typeof window === "undefined") {
  // @ts-ignore
  React.useLayoutEffect = React.useEffect;
}

export const createRoot = ViteReactSSG({ routes });
