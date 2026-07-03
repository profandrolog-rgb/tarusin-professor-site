import { useEffect, useState } from "react";
import { useAiActivity, dismissAiTask, clearFinishedAiTasks, type AiTask } from "@/lib/aiActivity";
import { X, Loader2, CheckCircle2, AlertTriangle, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** Наглядный ГЛОБАЛЬНЫЙ индикатор всех AI-операций.
 *  Всегда виден при активной задаче и остаётся видимым при ошибке,
 *  пока пользователь не закроет карточку. Работает в ЛЮБОМ AI-режиме. */
const AiActivityDock = () => {
  const tasks = useAiActivity();
  const [expanded, setExpanded] = useState(true);
  const [now, setNow] = useState(Date.now());

  const hasActive = tasks.some((t) => t.phase === "start" || t.phase === "progress");
  const hasError = tasks.some((t) => t.phase === "error");

  useEffect(() => {
    if (!hasActive) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [hasActive]);

  if (!tasks.length) return null;

  const iconFor = (t: AiTask) => {
    if (t.phase === "error") return <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />;
    if (t.phase === "done") return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
    return <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />;
  };

  const elapsed = (t: AiTask) => {
    const end = t.endedAt ?? now;
    return Math.max(0, Math.round((end - t.startedAt) / 1000));
  };

  return (
    <div
      className={cn(
        "fixed z-[70] pointer-events-auto",
        "bottom-4 right-4 w-[min(92vw,380px)]",
        "rounded-xl border shadow-lg backdrop-blur bg-background/95",
        hasError ? "border-destructive/50" : "border-border",
      )}
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium"
      >
        <Activity className={cn("w-4 h-4", hasActive ? "text-primary animate-pulse" : hasError ? "text-destructive" : "text-emerald-600")} />
        <span className="flex-1 text-left truncate">
          AI-операции · {tasks.length}
          {hasActive ? " · выполняется…" : hasError ? " · есть ошибки" : " · готово"}
        </span>
        {expanded ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronUp className="w-4 h-4 opacity-60" />}
      </button>

      {expanded && (
        <div className="max-h-[50vh] overflow-y-auto border-t divide-y">
          {tasks.map((t) => (
            <div key={t.id} className="px-3 py-2 flex items-start gap-2 text-sm">
              {iconFor(t)}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{t.label}</span>
                  <span className="ml-auto text-xs tabular-nums opacity-70">{elapsed(t)}s</span>
                </div>
                <div className={cn("text-xs mt-0.5 break-words", t.phase === "error" ? "text-destructive" : "opacity-75")}>
                  {t.detail || (t.phase === "start" ? "Отправляю запрос…" : "")}
                </div>
                {t.endpoint && (
                  <div className="text-[10px] mt-0.5 opacity-40 truncate" title={t.endpoint}>{t.endpoint}</div>
                )}
              </div>
              {(t.phase === "done" || t.phase === "error") && (
                <button
                  type="button"
                  onClick={() => dismissAiTask(t.id)}
                  className="opacity-60 hover:opacity-100 p-1 -m-1"
                  aria-label="Скрыть"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {tasks.some((t) => t.phase === "done" || t.phase === "error") && (
            <div className="px-3 py-1.5 flex justify-end">
              <button type="button" onClick={clearFinishedAiTasks} className="text-xs opacity-70 hover:opacity-100 underline">
                Очистить завершённые
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiActivityDock;
