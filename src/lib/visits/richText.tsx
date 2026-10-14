import React from "react";

/** Шаблонная «рыба» без значений (прочерки, одни буквы-обозначения). */
export function isTemplateStub(text: unknown): boolean {
  if (typeof text !== "string") return false;
  const t = text.trim();
  if (!t) return true;
  // убираем обозначения показателей и прочерки — если не осталось цифр/слов, это пустой шаблон
  const rest = t
    .replace(/\b(G|P|Ma|Ax|F|L|Me|Start|Pub|Er|Ej|Ejage|Mst|Mast|MastFR|Mst\s*fr|Sx|Sxage|SxFR|Sx\s*fr|Prev|Part|fr)\b/gi, "")
    .replace(/(половая\s+(формула|конституция)|возраст)/gi, "")
    .replace(/[\s\-–—−:;.,/()]+/g, "");
  return rest.length === 0;
}

/** Есть ли в объекте хотя бы одно содержательное значение. */
export function hasAnyValue(obj: unknown): boolean {
  if (obj === null || obj === undefined || obj === "" || obj === false) return false;
  if (typeof obj === "number") return obj !== 0;
  if (typeof obj === "string") return obj.trim() !== "";
  if (Array.isArray(obj)) return obj.some(hasAnyValue);
  if (typeof obj === "object") return Object.values(obj as Record<string, unknown>).some(hasAnyValue);
  return true;
}

/** Рендер **жирного**, *курсива* и <u>подчёркнутого</u> текста. */
export function RichText({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  const re = /\*\*([\s\S]+?)\*\*|<u>([\s\S]+?)<\/u>|\*([^*\n]+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={i++}><RichText text={m[1]} /></strong>);
    else if (m[2] !== undefined) out.push(<u key={i++}><RichText text={m[2]} /></u>);
    else out.push(<em key={i++}>{m[3]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/** Ctrl/Cmd + B / I / U в текстовых полях: обрамляет выделенный текст разметкой. */
export function handleFormatHotkey(e: React.KeyboardEvent<HTMLElement>) {
  if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
  const code = e.code;
  const wrap = code === "KeyB" ? ["**", "**"] : code === "KeyI" ? ["*", "*"] : code === "KeyU" ? ["<u>", "</u>"] : null;
  if (!wrap) return;
  const el = e.target as HTMLTextAreaElement | HTMLInputElement;
  if (!(el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && el.type === "text"))) return;
  const s = el.selectionStart ?? 0;
  const en = el.selectionEnd ?? 0;
  if (s === en) return;
  e.preventDefault();
  const v = el.value;
  const next = v.slice(0, s) + wrap[0] + v.slice(s, en) + wrap[1] + v.slice(en);
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, next);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.setSelectionRange(s + wrap[0].length, en + wrap[0].length);
}
