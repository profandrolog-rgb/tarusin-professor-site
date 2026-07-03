// Глобальный стор для отслеживания ЛЮБЫХ AI-операций в приложении.
// Используется индикатором AiActivityDock — наглядно показывает пользователю,
// что происходит, сколько это длится, и что именно упало при отказе.

import { useSyncExternalStore } from "react";

export type AiPhase = "start" | "progress" | "done" | "error";

export interface AiTask {
  id: string;
  label: string;
  endpoint?: string;
  startedAt: number;
  endedAt?: number;
  phase: AiPhase;
  bytes?: number;
  detail?: string;
  error?: string;
}

const tasks = new Map<string, AiTask>();
const listeners = new Set<() => void>();
let snapshot: AiTask[] = [];

const rebuild = () => {
  snapshot = Array.from(tasks.values()).sort((a, b) => b.startedAt - a.startedAt);
  listeners.forEach((l) => {
    try { l(); } catch { /* noop */ }
  });
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

export function useAiActivity(): AiTask[] {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
}

let idCounter = 0;
const nextId = () => `ai_${Date.now().toString(36)}_${(++idCounter).toString(36)}`;

// Метки эндпоинтов → человекочитаемые названия (RU)
const ENDPOINT_LABELS: Array<[RegExp, string]> = [
  [/ai-chat/i, "AI-чат"],
  [/generate-image/i, "Генерация изображения"],
  [/edit-image/i, "Редактирование изображения"],
  [/transcribe/i, "Расшифровка речи"],
  [/pubmed-fulltext/i, "PubMed: полный текст"],
  [/pubmed/i, "PubMed поиск"],
  [/illustrate/i, "Иллюстрация"],
  [/translate/i, "Перевод"],
  [/analyze|analysis/i, "AI-анализ"],
  [/embed/i, "Векторизация"],
  [/parse-pdf|pdf-parse|ocr/i, "Разбор PDF/OCR"],
  [/dictate|dictation/i, "Диктовка"],
  [/repertory/i, "Репертори AI"],
  [/metabolic/i, "Метаболич. карта"],
  [/smoke/i, "Smoke-проверка"],
];

export function labelForEndpoint(endpoint: string): string {
  for (const [rx, name] of ENDPOINT_LABELS) if (rx.test(endpoint)) return name;
  // Достаём имя функции из /functions/v1/<name>
  const m = endpoint.match(/functions\/v1\/([^/?#]+)/);
  if (m) return `AI · ${m[1]}`;
  return "AI-операция";
}

export function startAiTask(input: { label?: string; endpoint?: string; id?: string }): {
  id: string;
  progress: (detail: string, bytes?: number) => void;
  success: (detail?: string) => void;
  fail: (error: string) => void;
} {
  const id = input.id || nextId();
  const label = input.label || (input.endpoint ? labelForEndpoint(input.endpoint) : "AI-операция");
  const task: AiTask = {
    id,
    label,
    endpoint: input.endpoint,
    startedAt: Date.now(),
    phase: "start",
    detail: "Отправляю запрос…",
  };
  tasks.set(id, task);
  rebuild();
  return {
    id,
    progress: (detail, bytes) => {
      const t = tasks.get(id);
      if (!t || t.phase === "done" || t.phase === "error") return;
      t.phase = "progress";
      t.detail = detail;
      if (typeof bytes === "number") t.bytes = bytes;
      rebuild();
    },
    success: (detail) => {
      const t = tasks.get(id);
      if (!t) return;
      t.phase = "done";
      t.endedAt = Date.now();
      t.detail = detail || "Готово";
      rebuild();
      // авто-очистка через 5с
      setTimeout(() => {
        const cur = tasks.get(id);
        if (cur && cur.phase === "done") { tasks.delete(id); rebuild(); }
      }, 5000);
    },
    fail: (error) => {
      const t = tasks.get(id);
      if (!t) return;
      t.phase = "error";
      t.endedAt = Date.now();
      t.error = error;
      t.detail = error;
      rebuild();
      // Ошибки не убираем автоматически — пусть пользователь увидит и закроет.
    },
  };
}

export function dismissAiTask(id: string) {
  tasks.delete(id);
  rebuild();
}

export function clearFinishedAiTasks() {
  for (const [id, t] of tasks) {
    if (t.phase === "done" || t.phase === "error") tasks.delete(id);
  }
  rebuild();
}
