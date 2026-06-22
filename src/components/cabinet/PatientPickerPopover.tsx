import { useEffect, useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, UserX, History, Link2, X, Tv } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getActiveContext,
  getRecentContexts,
  subscribeActiveContext,
  type ActivePatientContext,
} from "@/lib/protocolBridge";

export type PatientSelection = { id: string | null; name: string | null };

type PatientRow = {
  id: string;
  full_name: string | null;
  last_name: string | null;
  first_name: string | null;
  birth_date: string | null;
};

function rowName(p: PatientRow): string {
  if (p.full_name && p.full_name.trim()) return p.full_name.trim();
  return [p.last_name, p.first_name].filter(Boolean).join(" ").trim() || "Без имени";
}

export function PatientPickerPopover({
  value,
  onChange,
  children,
  align = "start",
}: {
  value: PatientSelection;
  onChange: (sel: PatientSelection) => void;
  children: ReactNode;
  align?: "start" | "center" | "end";
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ActivePatientContext | null>(() => getActiveContext());
  const [recent, setRecent] = useState<ActivePatientContext[]>(() => getRecentContexts());
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PatientRow[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActive(getActiveContext());
    setRecent(getRecentContexts());
    const unsub = subscribeActiveContext((ctx) => {
      setActive(ctx);
      setRecent(getRecentContexts());
    });
    return unsub;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase
          .from("patients")
          .select("id, full_name, last_name, first_name, birth_date")
          .or(
            `full_name.ilike.%${term}%,last_name.ilike.%${term}%,first_name.ilike.%${term}%,history_number.ilike.%${term}%`,
          )
          .order("updated_at", { ascending: false })
          .limit(15);
        setResults(((data ?? []) as PatientRow[]));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, open]);

  const pick = (sel: PatientSelection) => {
    onChange(sel);
    setOpen(false);
    setQ("");
  };

  // Deduplicate recent (exclude active and current binding)
  const recentClean = recent.filter(
    (r) => r.patientId && r.patientId !== value.id && r.patientId !== active?.patientId,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-80 p-3 space-y-3">
        {/* Current binding */}
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Привязка чата</div>
          {value.id ? (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-primary/10">
              <span className="text-sm inline-flex items-center gap-1.5 min-w-0">
                <User className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate font-medium">{value.name}</span>
              </span>
              <button
                onClick={() => pick({ id: null, name: null })}
                className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-0.5"
                title="Отвязать пациента от чата"
              >
                <X className="w-3 h-3" /> отвязать
              </button>
            </div>
          ) : (
            <div className="px-2 py-1.5 rounded-md border border-dashed text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <UserX className="w-3.5 h-3.5" /> Без привязки к пациенту
            </div>
          )}
        </div>

        {/* Active tab */}
        {active?.patientId && active.patientId !== value.id && (
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">
              <Tv className="w-3 h-3" /> Открыто в соседней вкладке
            </div>
            <button
              onClick={() => pick({ id: active.patientId!, name: active.patientName })}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-accent text-left"
            >
              <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-sm truncate flex-1">{active.patientName}</span>
              <span className="text-[10px] text-muted-foreground">привязать</span>
            </button>
          </div>
        )}

        {/* Recent */}
        {recentClean.length > 0 && (
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">
              <History className="w-3 h-3" /> Недавние
            </div>
            <div className="max-h-32 overflow-y-auto">
              {recentClean.slice(0, 6).map((r, i) => (
                <button
                  key={i}
                  onClick={() => pick({ id: r.patientId!, name: r.patientName })}
                  className="w-full text-left px-2 py-1 rounded-md hover:bg-accent text-sm truncate"
                >
                  {r.patientName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Поиск пациента</div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Фамилия, имя или № истории"
              className="pl-7 h-8 text-sm"
              autoFocus
            />
          </div>
          {q.trim().length >= 2 && (
            <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
              {searching && (
                <div className="px-2 py-2 text-xs text-muted-foreground">Поиск…</div>
              )}
              {!searching && results.length === 0 && (
                <div className="px-2 py-2 text-xs text-muted-foreground">Не найдено</div>
              )}
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pick({ id: p.id, name: rowName(p) })}
                  className="w-full text-left px-2 py-1.5 hover:bg-accent text-sm"
                >
                  <div className="truncate">{rowName(p)}</div>
                  {p.birth_date && (
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(p.birth_date).toLocaleDateString("ru-RU")}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {!value.id && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => setOpen(false)}
          >
            Закрыть — работать без пациента
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
