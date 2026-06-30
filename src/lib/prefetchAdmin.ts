/**
 * Прогрев чанков админ-страниц.
 *
 * Все админ-страницы лениво подгружаются (см. App.tsx) — это держит
 * первичный бандл лёгким для пациентов. Но когда профессор уже
 * залогинен и попал в /admin, тыкать «ничего не происходит» нельзя.
 * Поэтому на /admin мы запускаем фоновый прогрев самых ходовых чанков
 * через requestIdleCallback, чтобы клик по карточке открывал страницу
 * мгновенно (чанк уже в кэше браузера).
 */
const loaders: Array<() => Promise<unknown>> = [
  () => import("@/pages/AdminPatients"),
  () => import("@/pages/AdminPatientCards"),
  () => import("@/pages/AdminPatientVisits"),
  () => import("@/pages/AdminPatientVisitDetail"),
  () => import("@/pages/AdminPatientVisitNew"),
  () => import("@/pages/AdminPrescriptions"),
  () => import("@/pages/TreatmentPlans"),
  () => import("@/pages/TreatmentPlanEditor"),
  () => import("@/pages/AdminConsultations"),
  () => import("@/pages/AdminDiseaseArticles"),
  () => import("@/pages/AdminArticleOrchestrator"),
  () => import("@/pages/Cabinet"),
];

let warmed = false;

export function warmAdminChunks() {
  if (warmed || typeof window === "undefined") return;
  warmed = true;

  const idle =
    (window as any).requestIdleCallback ||
    ((cb: () => void) => window.setTimeout(cb, 400));

  loaders.forEach((load, i) => {
    idle(
      () => {
        // глотаем ошибки: chunk просто не прогрелся, пользователь
        // догрузит его при клике через обычный Suspense.
        void load().catch(() => {});
      },
      { timeout: 2000 + i * 150 },
    );
  });
}
