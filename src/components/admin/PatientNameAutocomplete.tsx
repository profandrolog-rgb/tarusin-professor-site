import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, User } from "lucide-react";

export interface PatientSuggestionPick {
  patient_name: string;
  patient_birth_date: string;
  diagnosis: string;
}

interface Suggestion {
  key: string;
  patient_id?: string;
  name: string;
  birth_date: string;
  history_number?: string | null;
  hasProtocol: boolean;
  diagnosis: string;
}

function fio(p: {
  full_name?: string | null;
  last_name?: string | null;
  first_name?: string | null;
  patronymic?: string | null;
}) {
  if (p.full_name?.trim()) return p.full_name.trim();
  return [p.last_name, p.first_name, p.patronymic].filter(Boolean).join(" ").trim();
}

/**
 * Поле ФИО с автодополнением по базе пациентов и журналу операций.
 * Достаточно первых букв фамилии — подставляются ФИО, дата рождения и диагноз
 * (из последнего протокола осмотра, если он есть).
 */
export function PatientNameAutocomplete({
  value,
  onChange,
  onPick,
  placeholder = "Начните вводить фамилию…",
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (data: PatientSuggestionPick) => void;
  placeholder?: string;
}) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const skipRef = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    const term = value.trim();
    if (term.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const esc = term.replace(/[%,()]/g, " ");
        const [patientsRes, journalRes] = await Promise.all([
          supabase
            .from("patients")
            .select("id, full_name, last_name, first_name, patronymic, birth_date, history_number")
            .or(
              `full_name.ilike.%${esc}%,last_name.ilike.%${esc}%,first_name.ilike.%${esc}%,history_number.ilike.%${esc}%`,
            )
            .limit(10),
          supabase
            .from("operations_journal")
            .select("patient_name, patient_birth_date, diagnosis")
            .ilike("patient_name", `%${esc}%`)
            .order("operation_date", { ascending: false })
            .limit(10),
        ]);

        const patients = (patientsRes.data ?? []) as Array<{
          id: string;
          full_name: string | null;
          last_name: string | null;
          first_name: string | null;
          patronymic: string | null;
          birth_date: string | null;
          history_number: string | null;
        }>;

        // Последние визиты (протоколы) для найденных пациентов
        let visitsByPatient: Record<string, string> = {};
        if (patients.length > 0) {
          const { data: visits } = await supabase
            .from("patient_visits")
            .select("patient_id, diagnosis, visit_date")
            .in(
              "patient_id",
              patients.map((p) => p.id),
            )
            .order("visit_date", { ascending: false });
          for (const v of (visits ?? []) as Array<{ patient_id: string; diagnosis: string | null }>) {
            if (!visitsByPatient[v.patient_id]) {
              visitsByPatient[v.patient_id] = (v.diagnosis ?? "").trim();
            }
          }
        }

        const list: Suggestion[] = patients
          .map((p) => ({
            key: `p-${p.id}`,
            patient_id: p.id,
            name: fio(p) || "Без имени",
            birth_date: p.birth_date ?? "",
            history_number: p.history_number,
            hasProtocol: p.id in visitsByPatient,
            diagnosis: visitsByPatient[p.id] ?? "",
          }))
          .filter((s) => s.name !== "Без имени");

        const seen = new Set(list.map((s) => s.name.toLowerCase()));
        for (const j of (journalRes.data ?? []) as Array<{
          patient_name: string;
          patient_birth_date: string | null;
          diagnosis: string | null;
        }>) {
          const name = (j.patient_name ?? "").trim();
          if (!name || seen.has(name.toLowerCase())) continue;
          seen.add(name.toLowerCase());
          list.push({
            key: `j-${name}`,
            name,
            birth_date: j.patient_birth_date ?? "",
            hasProtocol: false,
            diagnosis: (j.diagnosis ?? "").trim(),
          });
        }

        setItems(list.slice(0, 12));
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [value]);

  const choose = (s: Suggestion) => {
    skipRef.current = true;
    setOpen(false);
    setItems([]);
    onPick({
      patient_name: s.name,
      patient_birth_date: s.birth_date,
      diagnosis: s.diagnosis,
    });
  };

  return (
    <div className="relative" ref={boxRef}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => items.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
      )}

      {open && items.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-md border bg-popover shadow-lg divide-y">
          {items.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => choose(s)}
              className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
            >
              <div className="text-sm font-medium flex items-center gap-1.5">
                {s.hasProtocol ? (
                  <FileText className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                {s.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {s.birth_date
                  ? new Date(s.birth_date).toLocaleDateString("ru-RU")
                  : "дата рождения не указана"}
                {s.history_number ? ` · № ${s.history_number}` : ""}
                {s.hasProtocol ? " · есть протокол осмотра" : ""}
              </div>
              {s.diagnosis && (
                <div className="text-xs text-muted-foreground/80 line-clamp-1">{s.diagnosis}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {open && !loading && items.length === 0 && value.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover px-3 py-2 text-xs text-muted-foreground shadow-lg">
          Совпадений не найдено — заполните вручную
        </div>
      )}
    </div>
  );
}
