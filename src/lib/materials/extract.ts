// Единая точка входа: определяет по MIME и запускает соответствующий экстрактор.

import type { ExtractionResult } from "./types";
export type { ExtractedImage, ExtractedTable, ExtractionResult } from "./types";

export async function extractFromFile(
  file: File,
  reviewId: string,
): Promise<ExtractionResult> {
  const name = file.name.toLowerCase();
  const mime = file.type || "";

  const isDocx = mime.includes("wordprocessingml") || name.endsWith(".docx");
  const isPptx = mime.includes("presentationml") || name.endsWith(".pptx");
  const isPdf = mime === "application/pdf" || name.endsWith(".pdf");

  try {
    if (isDocx) {
      const { extractDocx } = await import("./extractDocx");
      return await extractDocx(file, reviewId);
    }
    if (isPptx) {
      const { extractPptx } = await import("./extractPptx");
      return await extractPptx(file, reviewId);
    }
    if (isPdf) {
      const { extractPdf } = await import("./extractPdf");
      return await extractPdf(file, reviewId);
    }
  } catch (e) {
    console.warn("[extractFromFile] failed:", (e as Error).message);
  }
  return { images: [], tables: [] };
}
