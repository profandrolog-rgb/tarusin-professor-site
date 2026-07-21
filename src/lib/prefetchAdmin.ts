/**
 * Прогрев чанков админ-страниц — ОСТОРОЖНЫЙ.
 *
 * Раньше здесь запускалось 12 параллельных динамических импортов сразу
 * после входа в /admin. На preview-домене это забивало HTTP/2-канал и
 * реально замедляло вход в админку и клики по разделам.
 *
 * Теперь прогрев:
 *  1) стартует только через 4 секунды после mount (не мешает первому рендеру),
 *  2) грузит по ОДНОМУ чанку за раз через requestIdleCallback,
 *  3) полностью отключается при `?noprefetch=1` или при экономии трафика
 *     (`navigator.connection.saveData` / медленные сети 2G/3G).
 */
const loaders: Array<() => Promise<unknown>> = [
  () => import("@/pages/AdminPatients"),
  () => import("@/pages/AdminPatientCards"),
  () => import("@/pages/AdminPatientVisits"),
  () => import("@/pages/AdminPatientVisitDetail"),
  () => import("@/pages/AdminPrescriptions"),
  () => import("@/pages/AdminConsultations"),
];

let warmed = false;

function shouldSkipWarmup(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (new URLSearchParams(window.location.search).get("noprefetch") === "1") return true;
    const conn = (navigator as any).connection;
    if (conn?.saveData) return true;
    if (conn?.effectiveType && /(^|-)2g$|3g/.test(conn.effectiveType)) return true;
  } catch {}
  return false;
}

export function warmAdminChunks() {
  // Отключено: автопрогрев админ-чанков мешал интерактивности после входа.
  // Чанки должны грузиться только по реальному клику пользователя.
  return;
  if (warmed) return;
  if (shouldSkipWarmup()) return;
  warmed = true;

  const idle: (cb: () => void) => void =
    (window as any).requestIdleCallback
      ? (cb) => (window as any).requestIdleCallback(cb, { timeout: 6000 })
      : (cb) => window.setTimeout(cb, 800);

  const runNext = (i: number) => {
    if (i >= loaders.length) return;
    idle(() => {
      loaders[i]()
        .catch(() => {})
        .finally(() => {
          // пауза между чанками, чтобы не мешать интерактивным запросам
          window.setTimeout(() => runNext(i + 1), 600);
        });
    });
  };

  window.setTimeout(() => runNext(0), 4000);
}
