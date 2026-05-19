import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./App";
import "./i18n";
import "./index.css";

// Список путей, которые НЕ нужно пре-рендерить (приватные/админ-страницы).
// vite-react-ssg по умолчанию пытается пререндерить все статические пути из routes;
// фильтруем по опции includedRoutes.
const EXCLUDED_FROM_SSG = new Set([
  "/auth",
  "/portal",
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
]);

export const createRoot = ViteReactSSG(
  { routes },
  undefined,
  {
    rootContainer: "#root",
    includedRoutes(paths) {
      return paths.filter((p) => !EXCLUDED_FROM_SSG.has(p));
    },
  },
);
