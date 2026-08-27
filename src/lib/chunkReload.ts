/**
 * Автовосстановление после деплоя.
 *
 * После публикации имена чанков меняются, а открытая вкладка держит старый
 * index.html и просит `/assets/DiseaseDetailPage-<oldhash>.js` — файла больше
 * нет, lazy-import падает с "Failed to fetch dynamically imported module"
 * и получается белый экран. Лечение — один принудительный reload,
 * чтобы браузер забрал свежий манифест.
 */
const FLAG = "chunk-reload-at";
const COOLDOWN_MS = 30_000;

const isChunkLoadError = (value: unknown): boolean => {
  const msg =
    typeof value === "string"
      ? value
      : value && typeof (value as any).message === "string"
        ? (value as any).message
        : "";
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(
    msg,
  );
};

function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(FLAG) || 0);
    if (Date.now() - last < COOLDOWN_MS) return; // не зацикливаемся
    sessionStorage.setItem(FLAG, String(Date.now()));
  } catch {
    /* приватный режим — просто перезагружаемся */
  }
  window.location.reload();
}

export function installChunkReload() {
  if (typeof window === "undefined") return;

  window.addEventListener("unhandledrejection", (e) => {
    if (isChunkLoadError(e.reason)) reloadOnce();
  });

  window.addEventListener("error", (e) => {
    if (isChunkLoadError(e.error) || isChunkLoadError(e.message)) reloadOnce();
  });
}
