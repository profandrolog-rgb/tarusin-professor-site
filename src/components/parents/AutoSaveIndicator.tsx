import { Check, Loader2, CloudUpload, AlertCircle, Circle } from "lucide-react";
import type { AutoSaveStatus } from "@/hooks/useDebouncedAutoSave";
import { cn } from "@/lib/utils";

const AutoSaveIndicator = ({ status, className }: { status: AutoSaveStatus; className?: string }) => {
  const map: Record<AutoSaveStatus, { icon: React.ReactNode; text: string; color: string }> = {
    idle: { icon: <Circle className="w-3.5 h-3.5" />, text: "Готово", color: "text-muted-foreground" },
    pending: { icon: <CloudUpload className="w-3.5 h-3.5" />, text: "Ожидание…", color: "text-muted-foreground" },
    saving: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, text: "Сохраняется…", color: "text-primary" },
    saved: { icon: <Check className="w-3.5 h-3.5" />, text: "Сохранено", color: "text-emerald-600 dark:text-emerald-500" },
    error: { icon: <AlertCircle className="w-3.5 h-3.5" />, text: "Ошибка сохранения", color: "text-destructive" },
  };
  const s = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", s.color, className)} aria-live="polite">
      {s.icon}
      {s.text}
    </span>
  );
};

export default AutoSaveIndicator;
