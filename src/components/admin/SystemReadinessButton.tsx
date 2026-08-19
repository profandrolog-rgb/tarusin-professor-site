import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runSystemReadinessCheck, type ReadinessReport } from "@/lib/systemReadiness";

interface Props {
  className?: string;
  size?: "sm" | "default";
  variant?: "outline" | "secondary" | "ghost";
  label?: string;
}

/** Кнопка «Проверить систему»: результат показывается прямо на странице. */
export function SystemReadinessButton({
  className,
  size = "sm",
  variant = "outline",
  label = "Проверить систему",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<ReadinessReport | null>(null);

  const run = async () => {
    setBusy(true);
    setReport(null);
    try {
      setReport(await runSystemReadinessCheck());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <Button type="button" size={size} variant={variant} onClick={run} disabled={busy}>
        {busy ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4 mr-2" />
        )}
        {busy ? "Проверяю…" : label}
      </Button>

      {report && (
        <div className="mt-3 rounded-lg border bg-card p-3 text-sm space-y-2">
          <div className="flex items-center gap-2 font-medium">
            {report.ok ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Система готова к работе</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span>Система не готова — есть проблемы</span>
              </>
            )}
            <span className="ml-auto text-xs text-muted-foreground">{report.finishedAt}</span>
          </div>

          <ul className="space-y-1">
            {report.checks.map((c, i) => (
              <li key={`${c.name}-${i}`} className="flex items-start gap-2 text-xs">
                {c.ok ? (
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" />
                )}
                <span className="flex-1">
                  <span className={c.ok ? "" : "font-medium text-destructive"}>{c.name}</span>
                  {c.detail && <span className="text-muted-foreground"> — {c.detail}</span>}
                </span>
                {typeof c.ms === "number" && (
                  <span className="text-muted-foreground shrink-0">{(c.ms / 1000).toFixed(1)} с</span>
                )}
              </li>
            ))}
          </ul>

          {!report.ok && (
            <p className="text-xs text-muted-foreground">
              Что делать: если не прошёл вход — войдите заново; если связь с сервером или ИИ —
              подождите минуту и нажмите проверку ещё раз, черновик протокола хранится локально.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
