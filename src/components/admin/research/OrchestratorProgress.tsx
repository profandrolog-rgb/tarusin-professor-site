import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, RotateCw, CheckCircle2, XCircle, Search, PenTool, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type OrchestratorStatus =
  | undefined
  | "queued"
  | "searching"
  | "writing"
  | "fact_checking"
  | "done"
  | "error"
  | "interrupted";

export interface StepTimers {
  searching?: { startedAt?: number; finishedAt?: number };
  writing?: { startedAt?: number; finishedAt?: number };
  fact_checking?: { startedAt?: number; finishedAt?: number };
}

interface Props {
  status: OrchestratorStatus;
  lastStep?: string;
  error?: string;
  timers: StepTimers;
  hasExistingContent?: boolean;
  onRetryAll: () => void;
  modelsUsed?: Partial<Record<keyof StepTimers, string>>;
}

const STEPS: Array<{
  key: keyof StepTimers;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "searching", label: "Поиск литературы", icon: Search },
  { key: "writing", label: "Написание обзора", icon: PenTool },
  { key: "fact_checking", label: "Проверка источников", icon: ShieldCheck },
];

function stepState(
  stepKey: keyof StepTimers,
  status: OrchestratorStatus,
): "queued" | "active" | "done" | "error" {
  const order: (keyof StepTimers)[] = ["searching", "writing", "fact_checking"];
  const currentIdx = status ? order.indexOf(status as any) : -1;
  const idx = order.indexOf(stepKey);
  if (status === "done") return "done";
  if (status === "error" || status === "interrupted") {
    if (idx < currentIdx) return "done";
    if (idx === currentIdx) return "error";
    return "queued";
  }
  if (currentIdx === -1) return "queued";
  if (idx < currentIdx) return "done";
  if (idx === currentIdx) return "active";
  return "queued";
}

function formatSec(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} с`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m} мин ${rem.toString().padStart(2, "0")} с`;
}

export default function OrchestratorProgress({ status, lastStep, error, timers, hasExistingContent, onRetryAll }: Props) {
  const [tick, setTick] = useState(0);
  const hasActive = status === "searching" || status === "writing" || status === "fact_checking";

  useEffect(() => {
    if (!hasActive) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [hasActive]);

  const doneCount = STEPS.filter((s) => stepState(s.key, status) === "done").length;
  const percent = status === "done" ? 100 : Math.round((doneCount / STEPS.length) * 100);

  const anyStarted = !!status;
  const isFailed = status === "error" || status === "interrupted";

  return (
    <Card className="no-print">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Прогресс обзора</span>
          <div className="flex items-center gap-2">
            {isFailed && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="w-3 h-3" /> {status === "interrupted" ? "Прервано" : "Ошибка"}
              </Badge>
            )}
            {status === "done" && (
              <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                <CheckCircle2 className="w-3 h-3" /> Готово
              </Badge>
            )}
            {hasActive && (
              <Badge variant="secondary" className="gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Идёт работа
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!anyStarted && hasExistingContent && (
          <p className="text-sm text-muted-foreground">Обзор создан ранее, детали прогона не сохранены.</p>
        )}
        {!anyStarted && !hasExistingContent && (
          <p className="text-sm text-muted-foreground">Оркестратор ещё не запускался. Нажмите «Отправить в оркестратор (3 звонка)».</p>
        )}

        {STEPS.map((step, i) => {
          const st = stepState(step.key, status);
          const t = timers[step.key];
          let elapsedMs = 0;
          if (t?.startedAt) {
            elapsedMs = (t.finishedAt ?? (st === "active" ? Date.now() : t.startedAt)) - t.startedAt;
            // touch tick to re-render each second while active
            if (st === "active") void tick;
          }
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
                  st === "done"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : st === "active"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : st === "error"
                        ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
                        : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {st === "active" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : st === "done" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : st === "error" ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {i + 1}. {step.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {elapsedMs > 0 && (
                      <span className="text-xs text-muted-foreground tabular-nums">{formatSec(elapsedMs)}</span>
                    )}
                    {st === "active" && (
                      <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/40">
                        Анализирует
                      </Badge>
                    )}
                    {st === "queued" && anyStarted && (
                      <Badge variant="outline" className="text-muted-foreground">В очереди</Badge>
                    )}
                    {st === "done" && (
                      <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/40">
                        Готово
                      </Badge>
                    )}
                    {st === "error" && (
                      <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-500/40">
                        Ошибка
                      </Badge>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={onRetryAll}
                            disabled={hasActive}
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p className="text-xs">Повторить (перезапускает весь оркестратор)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                {st === "error" && error && (i === STEPS.findIndex((s) => stepState(s.key, status) === "error")) && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 line-clamp-2">{error}</p>
                )}
              </div>
            </div>
          );
        })}

        <Progress value={percent} className="h-1.5 mt-2" />
        {lastStep && anyStarted && (
          <p className="text-xs text-muted-foreground">Текущий шаг: <span className="font-mono">{lastStep}</span></p>
        )}
      </CardContent>
    </Card>
  );
}
