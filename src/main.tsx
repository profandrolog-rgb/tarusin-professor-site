import React from "react";
import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./App";
import { installBackendFailover } from "./lib/backendFailover";
import "./i18n";
import "./index.css";

if (typeof window !== "undefined") {
  // Keep stale-chunk recovery completely outside the development module graph.
  // Importing it statically made Vite invalidate the preview entry during HMR,
  // even though its listeners were only installed in production.
  if (import.meta.env.PROD) {
    void import("./lib/chunkReload").then(({ installChunkReload }) => {
      installChunkReload();
    });
  }
  installBackendFailover();
}


// Suppress "useLayoutEffect does nothing on the server" warnings from third-party libs (Radix, TipTap и т.п.) во время SSG-рендеринга.
if (typeof window === "undefined") {
  // @ts-ignore
  React.useLayoutEffect = React.useEffect;
}

export const createRoot = ViteReactSSG({ routes });
