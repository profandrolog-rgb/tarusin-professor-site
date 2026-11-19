import { extractProtocolSource, parseProtocolDocument, type ExtractedSource, type ParsedProtocol } from "./protocolImport";
import { MAX_DOCUMENT_BYTES, MAX_IMAGE_PIXELS, MIN_PAGE_TEXT, pageRanges, splitDocumentText } from "./documentAssessmentRules";

type Source = Parameters<typeof parseProtocolDocument>[0];
export interface DocumentPart {
  id: string;
  label: string;
  prepare: (signal: AbortSignal) => Promise<Source>;
}
export interface DocumentAssessment {
  reason: string;
  requiresFragmentation: boolean;
  parts: DocumentPart[];
  dispose: () => Promise<void>;
}

export function checkDocumentAbort(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Распознавание остановлено", "AbortError");
}

function textParts(text: string, name: string, prefix = ""): DocumentPart[] {
  return splitDocumentText(text).map((chunk, index) => ({
    id: crypto.randomUUID(),
    label: `${prefix}${prefix ? ", " : ""}часть ${index + 1}`,
    prepare: async (signal) => {
      checkDocumentAbort(signal);
      return { text: chunk, fileName: `${name} (${prefix}${prefix ? ", " : ""}часть ${index + 1})`, assessed: true };
    },
  }));
}

async function assessText(text: string, name: string): Promise<DocumentAssessment> {
  if (!text.trim()) throw new Error("В документе не найден текст");
  const parts = textParts(text, name);
  return { parts, requiresFragmentation: parts.length > 1, reason: `${text.length.toLocaleString("ru")} символов; ${parts.length} ч.`, dispose: async () => {} };
}

export async function assessDocument(file: File | null, pastedText: string, signal: AbortSignal): Promise<DocumentAssessment> {
  checkDocumentAbort(signal);
  if (!file) return assessText(pastedText, "Вставленный текст");
  if (file.size > MAX_DOCUMENT_BYTES) throw new Error("Файл больше 20 МБ");
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const isPdf = new TextDecoder().decode(header) === "%PDF-";
  checkDocumentAbort(signal);
  if (isPdf) {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
    const abort = () => { void task.destroy(); };
    signal.addEventListener("abort", abort, { once: true });
    try {
      const pdf = await task.promise;
      const texts: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        checkDocumentAbort(signal);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // Любое встроенное изображение: текстовый слой не считается полным.
        const ops = await page.getOperatorList();
        const hasImages = ops.fnArray.some((op) => [pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintInlineImageXObject, pdfjs.OPS.paintImageXObjectRepeat].includes(op));
        texts.push(hasImages ? "" : content.items.map((item) => "str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : "").join(""));
        page.cleanup();
      }
      const scanned = texts.some((text) => text.trim().length < MIN_PAGE_TEXT);
      const parts: DocumentPart[] = [];
      for (const range of pageRanges(texts.map((text) => text.trim().length))) {
        const label = `стр. ${range.start}–${range.end}`;
        if (!scanned) {
          const text = texts.slice(range.start - 1, range.end).map((value, i) => `\n[Страница ${range.start + i}]\n${value}`).join("");
          parts.push(...textParts(text, file.name, label));
        } else {
          parts.push({ id: crypto.randomUUID(), label, prepare: async (partSignal) => {
            checkDocumentAbort(partSignal);
            const { jsPDF } = await import("jspdf");
            let output: InstanceType<typeof jsPDF> | undefined;
            for (let i = range.start; i <= range.end; i++) {
              checkDocumentAbort(partSignal);
              const page = await pdf.getPage(i);
              const natural = page.getViewport({ scale: 1 });
              const viewport = page.getViewport({ scale: Math.min(2, 2200 / Math.max(natural.width, natural.height)) });
              const canvas = document.createElement("canvas");
              canvas.width = Math.ceil(viewport.width);
              canvas.height = Math.ceil(viewport.height);
              const context = canvas.getContext("2d");
              if (!context) throw new Error("Не удалось подготовить страницу PDF");
              const render = page.render({ canvasContext: context, canvas, viewport });
              const stopRender = () => render.cancel();
              partSignal.addEventListener("abort", stopRender, { once: true });
              try { await render.promise; } finally { partSignal.removeEventListener("abort", stopRender); }
              const orientation = canvas.width > canvas.height ? "landscape" : "portrait";
              if (!output) output = new jsPDF({ unit: "px", format: [canvas.width, canvas.height], orientation });
              else output.addPage([canvas.width, canvas.height], orientation);
              output.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, canvas.width, canvas.height);
              canvas.width = 0;
              canvas.height = 0;
              page.cleanup();
            }
            checkDocumentAbort(partSignal);
            if (!output) throw new Error("Пустой фрагмент PDF");
            const fragment = new File([output.output("blob")], `${file.name.replace(/\.pdf$/i, "")}_pages_${range.start}-${range.end}.pdf`, { type: "application/pdf" });
            const source = await extractProtocolSource(fragment);
            return { ...source, text: `Исходный документ: ${file.name}. Исходные страницы ${range.start}–${range.end}.`, assessed: true };
          } });
        }
      }
      if (pastedText.trim()) parts.push(...textParts(pastedText, "Дополнительный текст"));
      return { parts, requiresFragmentation: parts.length > 1, reason: `${pdf.numPages} стр.; ${scanned ? "скан или смешанный PDF" : "текстовый PDF"}; ${(file.size / 1024 / 1024).toFixed(2)} МБ; ${parts.length} ч.`, dispose: async () => { signal.removeEventListener("abort", abort); await task.destroy(); } };
    } catch (error) {
      signal.removeEventListener("abort", abort);
      await task.destroy();
      checkDocumentAbort(signal);
      throw new Error(error instanceof Error && error.name === "PasswordException" ? "PDF защищён паролем. Загрузите копию без пароля." : "Не удалось оценить PDF. Проверьте, что документ не повреждён.");
    }
  }
  if (file.type.startsWith("image/")) {
    const image = await createImageBitmap(file);
    try {
      checkDocumentAbort(signal);
      const strips = Math.ceil(image.width * image.height / MAX_IMAGE_PIXELS);
      const height = Math.max(1, Math.floor(MAX_IMAGE_PIXELS / image.width));
      const parts: DocumentPart[] = [];
      for (let y = 0; y < image.height; y += height) {
        const top = y;
        const sectionHeight = Math.min(height, image.height - y);
        parts.push({ id: crypto.randomUUID(), label: `изображение, часть ${parts.length + 1}`, prepare: async (partSignal) => {
          checkDocumentAbort(partSignal);
          const bitmap = await createImageBitmap(file);
          try {
            const canvas = document.createElement("canvas");
            canvas.width = bitmap.width;
            canvas.height = sectionHeight;
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Не удалось подготовить изображение");
            context.drawImage(bitmap, 0, top, bitmap.width, sectionHeight, 0, 0, bitmap.width, sectionHeight);
            const fileData = canvas.toDataURL("image/png");
            canvas.width = 0;
            canvas.height = 0;
            return { fileData, fileName: `${file.name} (строки ${top + 1}–${top + sectionHeight})`, assessed: true };
          } finally { bitmap.close(); }
        } });
      }
      if (pastedText.trim()) parts.push(...textParts(pastedText, "Дополнительный текст"));
      return { parts, requiresFragmentation: parts.length > 1, reason: `${image.width} × ${image.height}; ${(file.size / 1024 / 1024).toFixed(2)} МБ; ${strips} ч. изображения`, dispose: async () => {} };
    } finally { image.close(); }
  }
  const source: ExtractedSource = await extractProtocolSource(file);
  checkDocumentAbort(signal);
  if (!source.text) throw new Error("Не удалось оценить текст документа");
  return assessText([source.text, pastedText].filter(Boolean).join("\n\n"), file.name);
}

export async function recognizePart(part: DocumentPart, signal: AbortSignal): Promise<ParsedProtocol> {
  const source = await part.prepare(signal);
  checkDocumentAbort(signal);
  return parseProtocolDocument(source, signal);
}
