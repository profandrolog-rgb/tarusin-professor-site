import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus, BookOpen, Search, Loader2 } from "lucide-react";
import { useSpellcheckDictionary, type DictWord } from "@/hooks/useSpellcheckDictionary";

export default function AdminSpellcheckDictionary() {
  const dict = useSpellcheckDictionary();
  const [rows, setRows] = useState<DictWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [newWord, setNewWord] = useState("");
  const [newNote, setNewNote] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("spellcheck_dictionary")
      .select("id, word, note, created_at, added_by")
      .order("created_at", { ascending: false })
      .limit(5000);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setRows((data || []) as DictWord[]);
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.word.toLowerCase().includes(s) || (r.note || "").toLowerCase().includes(s));
  }, [rows, q]);

  const add = async () => {
    const w = newWord.trim();
    if (!w) return;
    setAdding(true);
    const ok = await dict.add(w, newNote.trim() || undefined);
    setAdding(false);
    if (ok) {
      setNewWord(""); setNewNote("");
      await load();
      toast.success("Добавлено");
    }
  };

  const del = async (id: string) => {
    const ok = await dict.removeById(id);
    if (ok) { setRows((prev) => prev.filter((r) => r.id !== id)); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        <h1 className="text-xl font-semibold">Словарь орфографии</h1>
        <span className="text-sm text-muted-foreground">— общий для всех обзоров и статей</span>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Новое слово"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void add(); }}
            className="sm:max-w-[220px]"
          />
          <Input
            placeholder="Примечание (необязательно)"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void add(); }}
          />
          <Button onClick={add} disabled={adding || !newWord.trim()}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span className="ml-1">Добавить</span>
          </Button>
        </div>
      </Card>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Поиск по словарю" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <Card>
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Загрузка…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Ничего не найдено</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.word}</div>
                  {r.note && <div className="text-xs text-muted-foreground truncate">{r.note}</div>}
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {new Date(r.created_at).toLocaleDateString("ru-RU")}
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => void del(r.id)} title="Удалить">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
          Всего: {filtered.length}{q ? ` из ${rows.length}` : ""}
        </div>
      </Card>
    </div>
  );
}
