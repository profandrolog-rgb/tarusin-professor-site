// Компактная история правок: полный снапшот каждые SNAPSHOT_EVERY шагов
// или перед оркестратором; между ними — unified-diff patch.
// Откат: находим ближайший предшествующий снапшот и применяем последующие patch-и.

import { createPatch, applyPatch } from 'diff';

export const SNAPSHOT_EVERY = 5;

export interface RefinementEntry {
  id: string;
  action: string;
  prompt?: string;
  diff_summary?: string;
  /** Полный снапшот содержимого ДО этой правки (если это опорная точка). */
  snapshot_content?: string;
  /** unified-diff patch: снапшот-до → снапшот-после (если snapshot_content не хранится). */
  patch?: string;
  /** Признак "опорная точка" — снапшот всегда сохранён. */
  is_snapshot?: boolean;
  created_at: string;
  /** Пометка перед оркестратором — всегда с полным снапшотом. */
  is_pre_orchestrate?: boolean;
}

export function makeEntry(params: {
  action: string;
  prompt?: string;
  diff_summary?: string;
  before: string;
  after: string;
  historyLength: number;
  preOrchestrate?: boolean;
}): RefinementEntry {
  const { action, prompt, diff_summary, before, after, historyLength, preOrchestrate } = params;
  const isSnapshot = preOrchestrate || historyLength % SNAPSHOT_EVERY === 0;
  const base: RefinementEntry = {
    id: crypto.randomUUID(),
    action,
    prompt,
    diff_summary,
    created_at: new Date().toISOString(),
    is_snapshot: isSnapshot,
    is_pre_orchestrate: preOrchestrate,
  };
  if (isSnapshot) {
    base.snapshot_content = before;
  } else {
    base.patch = createPatch('review', before, after, '', '');
  }
  return base;
}

/**
 * Восстанавливает состояние ДО указанной записи (для отката).
 * Стратегия: находим ближайший предшествующий snapshot; берём его snapshot_content;
 * последовательно применяем patch-и записей до (не включая) targetIndex — это даст
 * состояние ДО записи с targetIndex.
 */
export function restoreBefore(history: RefinementEntry[], targetIndex: number): string | null {
  if (targetIndex < 0 || targetIndex >= history.length) return null;
  // Если у самой записи есть snapshot_content — это и есть состояние ДО.
  if (history[targetIndex].snapshot_content != null) {
    return history[targetIndex].snapshot_content!;
  }
  // Ищем ближайший назад snapshot.
  let anchor = -1;
  for (let i = targetIndex - 1; i >= 0; i--) {
    if (history[i].snapshot_content != null) { anchor = i; break; }
  }
  if (anchor < 0) return null;
  let current = history[anchor].snapshot_content!;
  // Применяем patch записей от anchor+1 до targetIndex-1 включительно
  // (каждая patch переводит состояние ДО записи → состояние ДО следующей записи, т.е. ПОСЛЕ этой).
  for (let i = anchor; i < targetIndex; i++) {
    const e = history[i];
    if (i === anchor) continue; // anchor.snapshot_content уже есть — это состояние ДО anchor; нужно применить patch anchor
    if (e.patch) {
      const applied = applyPatch(current, e.patch);
      if (typeof applied === 'string') current = applied;
    } else if (e.snapshot_content != null) {
      // защёлкиваемся на следующий snapshot
      current = e.snapshot_content;
    }
  }
  // Отдельно применяем patch anchor'а, если у anchor тоже был "before→after" patch (не должно быть — snapshot взаимоисключён с patch, но на всякий).
  return current;
}
