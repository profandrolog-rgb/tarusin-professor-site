import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DictWord {
  id: string;
  word: string;
  note: string | null;
  created_at: string;
  added_by: string | null;
}

const listeners = new Set<(w: Set<string>) => void>();
let cache: Set<string> | null = null;
let loading = false;

async function fetchAll(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("spellcheck_dictionary")
    .select("word")
    .limit(10000);
  if (error) throw error;
  const s = new Set<string>((data || []).map((r: any) => String(r.word || "").toLowerCase()));
  cache = s;
  listeners.forEach((cb) => cb(s));
  return s;
}

export function useSpellcheckDictionary() {
  const [words, setWords] = useState<Set<string>>(() => cache ?? new Set());

  useEffect(() => {
    const cb = (s: Set<string>) => setWords(new Set(s));
    listeners.add(cb);
    if (!cache && !loading) {
      loading = true;
      fetchAll().finally(() => { loading = false; });
    } else if (cache) {
      setWords(new Set(cache));
    }
    return () => { listeners.delete(cb); };
  }, []);

  const has = useCallback((w: string) => words.has(w.toLowerCase()), [words]);

  const add = useCallback(async (word: string, note?: string) => {
    const clean = word.trim();
    if (!clean) return false;
    const { error } = await supabase
      .from("spellcheck_dictionary")
      .insert({ word: clean, note: note ?? null });
    if (error) {
      if ((error as any).code === "23505") {
        // уже есть — считаем успехом
      } else {
        toast.error(error.message || "Не удалось добавить в словарь");
        return false;
      }
    }
    await fetchAll();
    return true;
  }, []);

  const remove = useCallback(async (word: string) => {
    const clean = word.trim().toLowerCase();
    if (!clean) return false;
    const { error } = await supabase
      .from("spellcheck_dictionary")
      .delete()
      .filter("word", "ilike", clean);
    if (error) {
      toast.error(error.message || "Не удалось удалить из словаря");
      return false;
    }
    await fetchAll();
    return true;
  }, []);

  const removeById = useCallback(async (id: string) => {
    const { error } = await supabase.from("spellcheck_dictionary").delete().eq("id", id);
    if (error) {
      toast.error(error.message || "Не удалось удалить");
      return false;
    }
    await fetchAll();
    return true;
  }, []);

  const reload = useCallback(() => fetchAll(), []);

  return { words, has, add, remove, removeById, reload };
}
