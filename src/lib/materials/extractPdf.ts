// Извлечение растровых изображений из PDF постранично через pdfjs-dist.
// Таблицы из PDF на клиенте не извлекаем — их разбирает Gemini по промпту.

import type { ExtractionResult } from "./types";
import { shouldKeepImage } from "./filterImage";
import { uploadExtracted } from "./uploadExtracted";

async function loadPdfjs() {
  // @ts-ignore - у pdfjs-dist v6 стабильные типы, но для Vite удобнее динамика
  const pdfjs: any = await import("pdfjs-dist");
  // @ts-ignore
  const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}

export async function extractPdf(
  file: File,
  reviewId: string,
  opts?: { maxImages?: number },
): Promise<ExtractionResult> {
  const result: ExtractionResult = { images: [], tables: [] };
  const maxImages = opts?.maxImages ?? 40;

  try {
    const pdfjs = await loadPdfjs();
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    let idx = 0;

    for (let pageNum = 1; pageNum <= pdf.numPages && idx < maxImages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const ops = await page.getOperatorList();
      const OPS = pdfjs.OPS;
      const imgOps = new Set([OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageXObjectRepeat]);

      for (let i = 0; i < ops.fnArray.length && idx < maxImages; i++) {
        if (!imgOps.has(ops.fnArray[i])) continue;
        const argName = ops.argsArray[i]?.[0];
        if (!argName || typeof argName !== "string") continue;
        try {
          const img: any = await new Promise((resolve, reject) => {
            let done = false;
            const timer = setTimeout(() => { if (!done) reject(new Error("timeout")); }, 5000);
            page.objs.get(argName, (obj: any) => {
              done = true; clearTimeout(timer); resolve(obj);
            });
          });
          if (!img?.data || !img.width || !img.height) continue;
          if (img.width < 200 || img.height < 200) continue;

          // Растеризуем в canvas → blob (JPEG для компактности).
          const canvas = document.createElement("canvas");
          canvas.width = img.width; canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          const rgba = new Uint8ClampedArray(img.width * img.height * 4);
          const src = img.data as Uint8ClampedArray | Uint8Array;
          const kind = img.kind; // 1=gray, 2=RGB, 3=RGBA
          if (kind === 1) {
            for (let p = 0, q = 0; p < src.length; p++, q += 4) {
              rgba[q] = rgba[q + 1] = rgba[q + 2] = src[p]; rgba[q + 3] = 255;
            }
          } else if (kind === 3) {
            rgba.set(src);
          } else {
            // default RGB
            for (let p = 0, q = 0; p < src.length; p += 3, q += 4) {
              rgba[q] = src[p]; rgba[q + 1] = src[p + 1]; rgba[q + 2] = src[p + 2]; rgba[q + 3] = 255;
            }
          }
          const imageData = new ImageData(rgba, img.width, img.height);
          ctx.putImageData(imageData, 0, 0);
          const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.9));
          if (!blob) continue;

          const { keep, w, h } = await shouldKeepImage(blob);
          if (!keep) continue;
          idx += 1;
          const uploaded = await uploadExtracted(reviewId, file.name, idx, "jpg", blob);
          result.images.push({
            objectKey: uploaded.objectKey,
            originalFile: file.name,
            pageOrSlide: pageNum,
            index: idx,
            width: w, height: h,
            mime: "image/jpeg",
          });
        } catch (e) {
          // тихо пропускаем непонятные объекты
        }
      }
    }
  } catch (e) {
    console.warn("[extractPdf] failed:", (e as Error).message);
  }

  return result;
}
