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

// ВАЖНО: захардкоженные значения перекрывают любые build-env, выставленные
// на стороне хостинга (например, старую VITE_SUPABASE_URL=https://api.tarusin.pro
// в панели Timeweb), из-за которой продакшн-клиент бил в несуществующий домен
// и получал "Failed to fetch" на /auth. Меняются только вручную.
const SUPABASE_URL_FORCED = "https://bpbwkizvvythqotcyfii.supabase.co";
const SUPABASE_ANON_FORCED =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYndraXp2dnl0aHFvdGN5ZmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1Njc2MTQsImV4cCI6MjA4NTE0MzYxNH0.iv_pLSj27wOMUmfY0HOJ91bPm1u-b4wjiScYrP03bww";
const SUPABASE_PROJECT_ID_FORCED = "bpbwkizvvythqotcyfii";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(SUPABASE_URL_FORCED),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(SUPABASE_ANON_FORCED),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(SUPABASE_PROJECT_ID_FORCED),
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
