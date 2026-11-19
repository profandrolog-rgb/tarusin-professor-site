export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
export const MAX_PART_CHARS = 15_000;
export const MAX_SCAN_PAGES = 3;
export const MAX_TEXT_PAGES = 6;
export const MIN_PAGE_TEXT = 100;
export const MAX_IMAGE_PIXELS = 12_000_000;

export interface PageRange { start: number; end: number }

export function pageRanges(lengths: number[]): PageRange[] {
  if (!lengths.length) throw new Error("В PDF нет страниц");
  const scanned = lengths.some((length) => length < MIN_PAGE_TEXT);
  const limit = scanned ? MAX_SCAN_PAGES : MAX_TEXT_PAGES;
  const ranges: PageRange[] = [];
  let start = 1;
  let chars = 0;
  for (let i = 0; i < lengths.length; i++) {
    if (i + 1 > start && (i + 1 - start >= limit || (!scanned && chars + lengths[i] > MAX_PART_CHARS))) {
      ranges.push({ start, end: i });
      start = i + 1;
      chars = 0;
    }
    chars += lengths[i];
  }
  ranges.push({ start, end: lengths.length });
  return ranges;
}

/** Сохраняет каждый символ, включая разделители и длинные абзацы. */
export function splitDocumentText(text: string): string[] {
  const parts: string[] = [];
  let offset = 0;
  while (offset < text.length) {
    let end = Math.min(offset + MAX_PART_CHARS, text.length);
    if (end < text.length) {
      const paragraph = text.lastIndexOf("\n", end - 1);
      if (paragraph > offset + MAX_PART_CHARS / 2) end = paragraph + 1;
      const code = text.charCodeAt(end - 1);
      if (code >= 0xd800 && code <= 0xdbff) end--;
    }
    parts.push(text.slice(offset, end));
    offset = end;
  }
  return parts;
}
