import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Публичные пути, которые НЕ нужно пре-рендерить (приватные/админ-страницы).
// Список держим в синхроне с src/App.tsx.
const EXCLUDED_FROM_SSG = new Set([
  "/auth",
  "/portal",
  "/cabinet",
  "/admin",
  "/admin/requests",
  "/admin/certificates",
  "/admin/prescriptions",
  "/admin/questions",
  "/admin/operations-journal",
  "/admin/disease-articles",
  "/admin/patient-cards",
  "/admin/consultations",
  "/admin/self-check",
  "/admin/system-settings",
]);

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
  // Поле читается плагином vite-react-ssg
  ssgOptions: {
    entry: "src/main.tsx",
    formatting: "none",
    dirStyle: "nested",
    script: "async",
    concurrency: 5,
    mock: true,
    includedRoutes(paths: string[]) {
      return paths.filter((p) => !EXCLUDED_FROM_SSG.has(p));
    },
  },
}));
