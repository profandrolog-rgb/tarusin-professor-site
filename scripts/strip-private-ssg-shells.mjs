/**
 * Приватные разделы (/admin, /cabinet, /auth, /portal, /p/, /en) не должны
 * пре-рендериться: их содержимое зависит от сессии пользователя.
 *
 * vite-react-ssg всё равно записывает для них HTML-оболочку и ставит на
 * контейнер метку data-server-rendered="true". Из-за этой метки клиент
 * выбирает режим гидратации (оживления готовой разметки) и падает с
 * React #418/#423 — вместо страницы показывается экран ошибки.
 *
 * Скрипт снимает метку и очищает контейнер, чтобы приватные страницы
 * запускались обычным способом (createRoot). Публичные страницы не трогаются.
 */
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const DIST = path.resolve(process.cwd(), "dist");

const isPrivatePath = (pathName) =>
  pathName === "/auth" ||
  pathName === "/portal" ||
  pathName === "/admin" ||
  pathName.startsWith("/admin/") ||
  pathName === "/cabinet" ||
  pathName.startsWith("/cabinet/") ||
  pathName.startsWith("/p/") ||
  pathName === "/en" ||
  pathName.startsWith("/en/") ||
  pathName.startsWith("/.lovable/");

async function collectIndexHtml(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets") continue;
      await collectIndexHtml(full, out);
    } else if (entry.name === "index.html") {
      out.push(full);
    }
  }
  return out;
}

const ROOT_TAG_RE = /<div id="root"[^>]*>[\s\S]*?<\/div>\s*(?=<script|<\/body)/i;

async function main() {
  try {
    await stat(DIST);
  } catch {
    console.log("[strip-private-ssg-shells] dist не найден, пропускаю");
    return;
  }

  const files = await collectIndexHtml(DIST);
  let changed = 0;

  for (const file of files) {
    const rel = path.relative(DIST, file).split(path.sep).slice(0, -1).join("/");
    const routePath = "/" + rel;
    if (!rel || !isPrivatePath(routePath)) continue;

    const html = await readFile(file, "utf-8");
    if (!html.includes('data-server-rendered="true"')) continue;

    const next = html.replace(ROOT_TAG_RE, '<div id="root"></div>');
    if (next === html) {
      console.warn(`[strip-private-ssg-shells] не удалось обработать ${routePath}`);
      continue;
    }
    await writeFile(file, next, "utf-8");
    changed += 1;
  }

  console.log(`[strip-private-ssg-shells] очищено оболочек: ${changed} из ${files.length}`);
}

main().catch((error) => {
  console.error("[strip-private-ssg-shells] ошибка:", error);
  process.exitCode = 1;
});
