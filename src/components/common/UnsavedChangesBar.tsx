import { Button } from "@/components/ui/button";

interface Props {
  isDirty: boolean;
  draftSavedAt?: number | null;
  onRestore?: () => void;
  onDiscard?: () => void;
}

/** Status line + draft-restore banner, matching visit protocols. */
export function UnsavedChangesBar({ isDirty, draftSavedAt, onRestore, onDiscard }: Props) {
  return (
    <div className="space-y-2 mb-3">
      {draftSavedAt && onRestore && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-accent bg-accent/20 px-3 py-2 text-sm">
          <span>Найден несохранённый черновик от {new Date(draftSavedAt).toLocaleString("ru-RU")}. Восстановить?</span>
          <Button size="sm" onClick={onRestore}>Восстановить</Button>
          <Button size="sm" variant="ghost" onClick={onDiscard}>Удалить черновик</Button>
        </div>
      )}
      <div className={`text-xs ${isDirty ? "text-destructive font-medium" : "text-muted-foreground"}`}>
        {isDirty ? "● Есть несохранённые изменения (Ctrl+S)" : "Всё сохранено"}
      </div>
    </div>
  );
}
