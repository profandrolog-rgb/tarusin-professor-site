import React from "react";
import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./App";
import { installBackendFailover } from "./lib/backendFailover";
import "./i18n";
import "./index.css";

if (typeof window !== "undefined") {
  installBackendFailover();
}


// Suppress "useLayoutEffect does nothing on the server" warnings from third-party libs (Radix, TipTap и т.п.) во время SSG-рендеринга.
if (typeof window === "undefined") {
  // @ts-ignore
  React.useLayoutEffect = React.useEffect;
}

export const createRoot = ViteReactSSG({ routes });
