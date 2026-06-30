import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Пути, которые НЕ нужно пре-рендерить: приватные разделы, SPA-страницы,
// динамические ссылки и английская ветка. Это резко сокращает работу SSG
// на Timeweb и не влияет на публичные SEO-страницы русского сайта.
const isExcludedFromSsg = (pathName: string) =>
  pathName === "/auth" ||
  pathName === "/portal" ||
  pathName === "/admin" ||
  pathName.startsWith("/admin/") ||
  pathName === "/cabinet" ||
  pathName.startsWith("/cabinet/") ||
  pathName.startsWith("/p/") ||
  pathName === "/en" ||
  pathName.startsWith("/en/");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  ssr: {
    // CJS-only packages that the SSG worker imports must be bundled,
    // otherwise Node ESM fails on named imports like `saveAs` from `file-saver`.
    noExternal: ["file-saver"],
  },
  // Поле читается плагином vite-react-ssg
  ssgOptions: {
    entry: "src/main.tsx",
    formatting: "none",
    dirStyle: "nested",
    script: "async",
    concurrency: 5,
    mock: true,
    includedRoutes(paths: string[]) {
      return paths.filter((p) => !isExcludedFromSsg(p));
    },
  },
}));
