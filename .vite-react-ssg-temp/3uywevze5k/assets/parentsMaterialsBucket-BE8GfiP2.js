import { s as supabase } from "../main.mjs";
const PARENTS_MEDIA_BUCKET = "disease-media";
const PARENTS_MEDIA_PREFIX = "parents";
const PARENTS_HANDOUTS_PREFIX = "parents/handouts";
const PARENTS_OG_PREFIX = "parents/og";
const MAX_PDF_SIZE = 20 * 1024 * 1024;
function parentsMediaPublicUrl(path) {
  if (!path) return null;
  return supabase.storage.from(PARENTS_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
async function uploadTo(prefix, file, forcedBasename) {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const base = (forcedBasename == null ? void 0 : forcedBasename.replace(/[^a-z0-9-_]/gi, "-")) || crypto.randomUUID();
  const path = `${prefix}/${base}.${ext}`;
  const { error } = await supabase.storage.from(PARENTS_MEDIA_BUCKET).upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}
async function uploadParentsMedia(file) {
  return uploadTo(PARENTS_MEDIA_PREFIX, file);
}
async function uploadParentsOgImage(file) {
  return uploadTo(PARENTS_OG_PREFIX, file);
}
async function uploadParentsHandoutPdf(file, slug) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Загрузить можно только PDF-файл");
  }
  if (file.size > MAX_PDF_SIZE) {
    throw new Error(`Файл больше 20 МБ (${(file.size / 1024 / 1024).toFixed(1)} МБ)`);
  }
  const path = await uploadTo(PARENTS_HANDOUTS_PREFIX, file, slug);
  return { path, size: file.size };
}
async function deleteParentsMedia(path) {
  if (!path) return;
  await supabase.storage.from(PARENTS_MEDIA_BUCKET).remove([path]);
}
function resolveMaterialPreview(m) {
  if (m.image_path) return parentsMediaPublicUrl(m.image_path);
  return m.image_url || null;
}
function slugify(input) {
  const map = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya"
  };
  return input.toLowerCase().split("").map((c) => map[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 80);
}
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}
function pagesLabel(n) {
  if (!n || n <= 0) return "";
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return `${n} страниц`;
  if (last === 1) return `${n} страница`;
  if (last >= 2 && last <= 4) return `${n} страницы`;
  return `${n} страниц`;
}
export {
  parentsMediaPublicUrl as a,
  uploadParentsOgImage as b,
  uploadParentsHandoutPdf as c,
  deleteParentsMedia as d,
  formatBytes as f,
  pagesLabel as p,
  resolveMaterialPreview as r,
  slugify as s,
  uploadParentsMedia as u
};
