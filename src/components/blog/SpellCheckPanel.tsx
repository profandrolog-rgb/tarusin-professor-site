import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, SpellCheck as SpellCheckIcon, Loader2 } from "lucide-react";

export interface SpellIssue {
  fragment: string;
  correction: string;
  type?: string;
  explanation?: string;
}

interface Props {
  issues: SpellIssue[];
  loading: boolean;
  model?: string;
  onApply: (issue: SpellIssue) => void;
  onDismiss: (idx: number) => void;
  onApplyAll: () => void;
  onClose: () => void;
}

export default function SpellCheckPanel({ issues, loading, model, onApply, onDismiss, onApplyAll, onClose }: Props) {
  return (
    <div className="mt-3 border border-input rounded-md bg-muted/30">
      <div className="flex items-center justify-between px-3 py-2 border-b border-input">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SpellCheckIcon className="w-4 h-4" />
          Проверка орфографии
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          {!loading && <Badge variant="secondary" className="text-[10px]">{issues.length}</Badge>}
          {model && <span className="text-[10px] text-muted-foreground">· {model}</span>}
        </div>
        <div className="flex items-center gap-2">
          {!loading && issues.length > 1 && (
            <Button size="sm" variant="outline" className="h-7" onClick={onApplyAll}>Применить все</Button>
          )}
          <Button size="sm" variant="ghost" className="h-7" onClick={onClose}>Закрыть</Button>
        </div>
      </div>
      {!loading && issues.length === 0 && (
        <div className="p-4 text-sm text-muted-foreground text-center">Ошибок не найдено.</div>
      )}
      <div className="divide-y divide-input max-h-80 overflow-y-auto">
        {issues.map((iss, idx) => (
          <div key={idx} className="p-3 flex items-start gap-3">
            <div className="flex-1 min-w-0 space-y-1 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="line-through text-destructive">{iss.fragment}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-green-700 dark:text-green-400 font-medium">{iss.correction}</span>
                {iss.type && <Badge variant="outline" className="text-[10px]">{iss.type}</Badge>}
              </div>
              {iss.explanation && (
                <div className="text-xs text-muted-foreground">{iss.explanation}</div>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="outline" className="h-7" onClick={() => onApply(iss)} title="Применить">
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={() => onDismiss(idx)} title="Пропустить">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
