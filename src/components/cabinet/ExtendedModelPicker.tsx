// Pick any OpenRouter model (search) — for one-off use beyond the curated list.
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";
import { useOpenRouterModels } from "@/hooks/useOpenRouterModels";
import { useVeniceModels } from "@/hooks/useVeniceModels";
import { getOpenRouterModelTags, formatPricePerMtok } from "@/config/aiModels";

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
  const { list: veniceList, loading: veniceLoading } = useVeniceModels();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("Все");

  const combined = useMemo(() => {
    // Venice сверху, чтобы было заметно
    return [...veniceList, ...list];
  }, [list, veniceList]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = needle
      ? combined.filter((m) =>
          m.id.toLowerCase().includes(needle) ||
          (m.name || "").toLowerCase().includes(needle),
        )
      : combined;
    return category === "Все" ? base : base.filter((m) => !m.id.startsWith("venice/") && getOpenRouterModelTags(m).includes(category));
  }, [combined, q, category]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Расширенный выбор модели</DialogTitle>
          <DialogDescription>
            OpenRouter: {list.length || "—"} · Venice (без цензуры): {veniceList.length || "—"}.
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
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Категория моделей"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["Все", "Instruct", "Abliterated", "Uncensored"].map((tag) => (
              <SelectItem key={tag} value={tag}>{tag === "Все" ? "Все модели" : `OpenRouter · ${tag} (${list.filter((m) => getOpenRouterModelTags(m).includes(tag)).length})`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                          <div className="text-sm font-medium truncate flex items-center gap-1.5">
                            {m.id.startsWith("venice/") && (
                              <span className="text-[9px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                                Venice · 🌶
                              </span>
                            )}
                            {!m.id.startsWith("venice/") && getOpenRouterModelTags(m).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                            <span className="truncate">{m.name || m.id}</span>
                          </div>
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
