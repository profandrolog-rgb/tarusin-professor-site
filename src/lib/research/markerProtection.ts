// Блок 4: защита маркеров источников [M#] и меток галерей [[GALLERY: ...]] при консилиуме и правках.
//
// Живут в контенте обзора и не должны быть удалены моделями-ревьюерами, арбитром или переписывателем,
// а также при HTML↔markdown конвертации. Здесь — инвентаризация, автовосстановление, сверка перед применением.

export const MARKER_RE = /\[M\d+\]/g;
export const GALLERY_MARKER_RE = /\[\[GALLERY:\s*caption\s*=\s*["'“”]([^"'“”]*)["'“”]\s*((?:\|[^\]]*)?)\]\]/g;

export function countMarkers(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  if (!text) return out;
  for (const m of text.matchAll(MARKER_RE)) {
    out[m[0]] = (out[m[0]] || 0) + 1;
  }
  return out;
}

export function listMarkers(text: string): string[] {
  return Object.keys(countMarkers(text)).sort((a, b) => {
    const na = parseInt(a.slice(2, -1), 10);
    const nb = parseInt(b.slice(2, -1), 10);
    return na - nb;
  });
}

export function maxMarkerNumber(text: string): number {
  let max = 0;
  for (const m of (text || "").matchAll(MARKER_RE)) {
    const n = parseInt(m[0].slice(2, -1), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

export function listGalleryCaptions(text: string): string[] {
  const captions: string[] = [];
  const re = new RegExp(GALLERY_MARKER_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text || "")) !== null) {
    captions.push(m[1] || "");
  }
  return captions;
}

/** Разница множеств маркеров: что было в before и пропало в after. */
export function markerDiff(before: string, after: string): {
  lost: string[];
  duplicated: string[];
  before: Record<string, number>;
  after: Record<string, number>;
} {
  const b = countMarkers(before);
  const a = countMarkers(after);
  const lost: string[] = [];
  const duplicated: string[] = [];
  for (const key of Object.keys(b)) {
    if (!a[key]) lost.push(key);
  }
  // Дубли, которых стало больше, — тоже подозрительно.
  for (const key of Object.keys(a)) {
    if (a[key] > (b[key] || 0)) duplicated.push(key);
  }
  return { lost, duplicated, before: b, after: a };
}

/** Разница множеств меток галерей — блочные, восстанавливаются автоматически. */
export function galleryDiff(before: string, after: string): { lost: string[]; kept: string[] } {
  const before_ = listGalleryCaptions(before);
  const after_ = new Set(listGalleryCaptions(after));
  const lost = before_.filter((c) => !after_.has(c));
  return { lost, kept: Array.from(after_) };
}

/**
 * Автовосстановление маркеров [M#] в предложении-правке.
 * Если original содержал маркеры, а suggested — нет, дописывает потерянные маркеры в конец suggested.
 * Возвращает исправленный текст и список восстановленных маркеров.
 */
export function restoreLostMarkersInSuggestion(original: string, suggested: string): {
  fixed: string;
  restored: string[];
} {
  const before = listMarkers(original);
  const afterSet = new Set(listMarkers(suggested));
  const restored = before.filter((m) => !afterSet.has(m));
  if (restored.length === 0) return { fixed: suggested, restored: [] };
  const tail = restored.join(" ");
  // Аккуратно дописываем перед закрывающей пунктуацией, если она в конце.
  const s = suggested.trimEnd();
  const punct = /([.!?»"”]+)$/.exec(s);
  const fixed = punct
    ? s.slice(0, -punct[0].length) + " " + tail + punct[0]
    : s + " " + tail;
  return { fixed, restored };
}

/**
 * Восстановление блочных меток галерей: если после правки часть меток пропала — дописать их в исходное место
 * (в конец соответствующего абзаца). Простая эвристика: дописать пропавшие метки в конец файла.
 */
export function restoreLostGalleryMarkers(before: string, after: string): {
  fixed: string;
  restored: string[];
} {
  const beforeMap = new Map<string, string>();
  const reFull = new RegExp(GALLERY_MARKER_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = reFull.exec(before || "")) !== null) {
    beforeMap.set(m[1] || "", m[0]);
  }
  const afterCaptions = new Set(listGalleryCaptions(after));
  const restored: string[] = [];
  let fixed = after;
  for (const [caption, marker] of beforeMap.entries()) {
    if (!afterCaptions.has(caption)) {
      fixed = `${fixed.trimEnd()}\n\n${marker}\n`;
      restored.push(caption || "(без подписи)");
    }
  }
  return { fixed, restored };
}

export const MARKER_PROTECTION_PROMPT_BLOCK = `
ЖЁСТКИЙ ЗАПРЕТ НА ИЗМЕНЕНИЕ ТЕХНИЧЕСКИХ МЕТОК:

1. Маркеры источников вида [M1], [M2], [M17] — это внутренняя разметка провенанса. Их НЕЛЬЗЯ:
   - удалять
   - переписывать (менять номер)
   - переносить в другое место
   - объединять с соседними
   - помещать внутрь кавычек, скобок, тегов
   Каждый маркер должен остаться в исходном предложении, ровно так же, как в оригинале.

2. Блочные метки галерей вида [[GALLERY: caption="..."]] — это плейсхолдеры изображений. Их НЕЛЬЗЯ:
   - удалять
   - переносить в другой раздел
   - переписывать подпись
   Оставляй их ровно там, где стояли.

3. Если в результате твоей правки исходный маркер пропал — правка считается ошибочной и будет отклонена.

4. В JSON-выводе (edits) поле "suggested" ОБЯЗАНО содержать все маркеры [M#], которые были в поле "original".
`;
