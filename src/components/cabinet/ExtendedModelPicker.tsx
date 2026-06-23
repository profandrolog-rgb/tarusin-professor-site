// Pick any OpenRouter model (search) — for one-off use beyond the curated list.
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";
import { useOpenRouterModels } from "@/hooks/useOpenRouterModels";
import { useVeniceModels } from "@/hooks/useVeniceModels";
import { formatPricePerMtok } from "@/config/aiModels";

export function ExtendedModelPicker({
  open,
  onOpenChange,
  onPick,
  currentId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (id: string) => void;
  currentId?: string;
}) {
  const { list, loading, error } = useOpenRouterModels();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = needle
      ? list.filter((m) =>
          m.id.toLowerCase().includes(needle) ||
          (m.name || "").toLowerCase().includes(needle),
        )
      : list;
    return base.slice(0, 400);
  }, [list, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Расширенный выбор модели</DialogTitle>
          <DialogDescription>
            Поиск по живому списку OpenRouter ({list.length || "—"} моделей).
            Выбранная модель применится только к этому диалогу.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="например, claude, qwen3, gemini-3, deepseek…"
            className="pl-8"
          />
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Загружаем список моделей…
          </div>
        ) : error ? (
          <div className="text-sm text-destructive py-3">Не удалось загрузить список: {error}</div>
        ) : (
          <ScrollArea className="h-[420px] rounded-md border border-border">
            <ul className="divide-y divide-border">
              {filtered.map((m) => {
                const inP = formatPricePerMtok(m.pricing?.prompt);
                const outP = formatPricePerMtok(m.pricing?.completion);
                const isCurrent = m.id === currentId;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => { onPick(m.id); onOpenChange(false); }}
                      className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${isCurrent ? "bg-accent/50" : ""}`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{m.name || m.id}</div>
                          <div className="text-[11px] font-mono text-muted-foreground truncate">{m.id}</div>
                        </div>
                        <div className="text-[10px] text-muted-foreground text-right shrink-0">
                          {m.context_length ? `${m.context_length.toLocaleString("ru-RU")} ctx` : ""}
                          {(inP || outP) && <div>{inP ?? "—"} / {outP ?? "—"}</div>}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">Ничего не найдено</li>
              )}
            </ul>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
