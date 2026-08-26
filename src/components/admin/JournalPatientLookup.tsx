import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, UserCheck } from "lucide-react";

export interface JournalPatientPick {
  patient_name: string;
  patient_birth_date: string;
  diagnosis: string;
}

interface PatientRow {
  id: string;
  full_name: string;
  last_name: string | null;
  first_name: string | null;
  patronymic: string | null;
  birth_date: string | null;
  history_number: string | null;
}

function displayName(p: PatientRow) {
  if (p.full_name?.trim()) return p.full_name.trim();
  return [p.last_name, p.first_name, p.patronymic].filter(Boolean).join(" ").trim() || "Без имени";
}

/**
 * Поиск пациента в базе консультаций по фамилии/ФИО/№ истории
 * с подстановкой ФИО, даты рождения и диагноза (из последнего визита).
 */
export function JournalPatientLookup({ onPick }: { onPick: (data: JournalPatientPick) => void }) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setRows([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const escaped = term.replace(/[%,]/g, " ");
        const { data } = await supabase
          .from("patients")
          .select("id, full_name, last_name, first_name, patronymic, birth_date, history_number")
          .or(
            `full_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%,first_name.ilike.%${escaped}%,history_number.ilike.%${escaped}%`,
          )
          .order("updated_at", { ascending: false })
          .limit(12);
        setRows((data ?? []) as PatientRow[]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const pick = async (p: PatientRow) => {
    let diagnosis = "";
    const { data: visits } = await supabase
      .from("patient_visits")
      .select("diagnosis, visit_date")
      .eq("patient_id", p.id)
      .not("diagnosis", "is", null)
      .order("visit_date", { ascending: false })
      .limit(1);
    diagnosis = (visits?.[0]?.diagnosis as string | undefined)?.trim() || "";

    const name = displayName(p);
    setPicked(name);
    setQuery("");
    setRows([]);
    onPick({
      patient_name: name,
      patient_birth_date: p.birth_date ?? "",
      diagnosis,
    });
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        Поиск в базе пациентов
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Фамилия, ФИО или № истории (минимум 2 символа)"
          className="pl-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {rows.length > 0 && (
        <div className="max-h-52 overflow-y-auto rounded-md border bg-background divide-y">
          {rows.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => pick(p)}
              className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
            >
              <div className="text-sm font-medium">{displayName(p)}</div>
              <div className="text-xs text-muted-foreground">
                {p.birth_date ? new Date(p.birth_date).toLocaleDateString("ru-RU") : "дата рождения не указана"}
                {p.history_number ? ` · № ${p.history_number}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && query.trim().length >= 2 && rows.length === 0 && (
        <p className="text-xs text-muted-foreground">Пациент не найден</p>
      )}

      {picked && (
        <p className="text-xs text-primary inline-flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5" /> Данные подставлены: {picked}
        </p>
      )}
    </div>
  );
}
