// Извлечение изображений и таблиц из DOCX (ZIP-архив).

import JSZip from "jszip";
import mammoth from "mammoth";
import TurndownService from "turndown";
// @ts-ignore - у turndown-plugin-gfm нет типов
import { tables as gfmTables } from "turndown-plugin-gfm";
import type { ExtractionResult } from "./types";
import { shouldKeepImage } from "./filterImage";
import { uploadExtracted } from "./uploadExtracted";

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
};

export async function extractDocx(
  file: File,
  reviewId: string,
): Promise<ExtractionResult> {
  const buf = await file.arrayBuffer();
  const result: ExtractionResult = { images: [], tables: [] };

  // 1) Изображения из word/media/
  try {
    const zip = await JSZip.loadAsync(buf);
    let idx = 0;
    const entries = Object.entries(zip.files).filter(([n]) => /^word\/media\//i.test(n));
    for (const [name, entry] of entries) {
      if (entry.dir) continue;
      const ext = (name.split(".").pop() || "").toLowerCase();
      const mime = MIME_BY_EXT[ext];
      if (!mime) continue;
      const bytes = await entry.async("uint8array");
      const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)], { type: mime });
      const { keep, w, h } = await shouldKeepImage(blob);
      if (!keep) continue;
      idx += 1;
      const ext2 = ext === "jpeg" ? "jpg" : ext;
      try {
        const uploaded = await uploadExtracted(reviewId, file.name, idx, ext2, blob);
        result.images.push({
          objectKey: uploaded.objectKey,
          originalFile: file.name,
          index: idx,
          width: w, height: h,
          mime,
        });
      } catch (e) {
        console.warn("[extractDocx] upload failed:", (e as Error).message);
      }
    }
  } catch (e) {
    console.warn("[extractDocx] images failed:", (e as Error).message);
  }

  // 2) Таблицы через mammoth → HTML → turndown (GFM)
  try {
    const conv = await mammoth.convertToHtml({ arrayBuffer: buf });
    const html = conv.value || "";
    // Найти каждую <table> и превратить её в markdown
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const tables = Array.from(doc.querySelectorAll("table"));
    const td = new TurndownService({ headingStyle: "atx" });
    td.use(gfmTables);
    tables.forEach((tbl, i) => {
      const outerHTML = tbl.outerHTML;
      const md = td.turndown(outerHTML);
      result.tables.push({
        html: outerHTML,
        markdown: md,
        sourceFile: file.name,
        index: i + 1,
      });
    });
  } catch (e) {
    console.warn("[extractDocx] tables failed:", (e as Error).message);
  }

  return result;
}
