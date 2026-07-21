// Извлечение изображений (и best-effort таблиц) из PPTX.

import JSZip from "jszip";
import type { ExtractionResult } from "./types";
import { shouldKeepImage } from "./filterImage";
import { uploadExtracted } from "./uploadExtracted";

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
};

export async function extractPptx(
  file: File,
  reviewId: string,
): Promise<ExtractionResult> {
  const buf = await file.arrayBuffer();
  const result: ExtractionResult = { images: [], tables: [] };

  try {
    const zip = await JSZip.loadAsync(buf);

    // Изображения
    const media = Object.entries(zip.files).filter(([n]) => /^ppt\/media\//i.test(n));
    let idx = 0;
    for (const [name, entry] of media) {
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
        console.warn("[extractPptx] upload failed:", (e as Error).message);
      }
    }

    // Best-effort: таблицы из слайдов (a:tbl). Не роняем разбор при ошибках.
    try {
      const slides = Object.entries(zip.files)
        .filter(([n]) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
      let tblIdx = 0;
      for (const [slideName, entry] of slides) {
        const slideNum = Number((slideName.match(/slide(\d+)/)?.[1] || "0"));
        const xml = await entry.async("string");
        const tblMatches = xml.match(/<a:tbl[\s\S]*?<\/a:tbl>/g) || [];
        for (const t of tblMatches) {
          const rows = t.match(/<a:tr[\s\S]*?<\/a:tr>/g) || [];
          const cells: string[][] = rows.map((r) => {
            const tcs = r.match(/<a:tc[\s\S]*?<\/a:tc>/g) || [];
            return tcs.map((c) => {
              const txt = (c.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [])
                .map((m) => m.replace(/<[^>]+>/g, "")).join(" ").trim();
              return txt || " ";
            });
          });
          if (!cells.length) continue;
          const cols = Math.max(...cells.map((r) => r.length));
          const md = [
            "| " + cells[0].concat(Array(cols - cells[0].length).fill(" ")).join(" | ") + " |",
            "| " + Array(cols).fill("---").join(" | ") + " |",
            ...cells.slice(1).map((r) => "| " + r.concat(Array(cols - r.length).fill(" ")).join(" | ") + " |"),
          ].join("\n");
          const html = "<table>" + cells.map((r, i) => {
            const cell = i === 0 ? "th" : "td";
            return "<tr>" + r.map((c) => `<${cell}>${c.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</${cell}>`).join("") + "</tr>";
          }).join("") + "</table>";
          tblIdx += 1;
          result.tables.push({
            html, markdown: md,
            sourceFile: file.name,
            pageOrSlide: slideNum || undefined,
            index: tblIdx,
          });
        }
      }
    } catch (e) {
      console.warn("[extractPptx] tables best-effort failed:", (e as Error).message);
    }
  } catch (e) {
    console.warn("[extractPptx] failed:", (e as Error).message);
  }

  return result;
}
