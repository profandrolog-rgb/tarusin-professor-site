import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Plus, X, Brain, Stethoscope, Activity, FlaskConical, FileText, Loader2, ExternalLink, Camera, Link2,
} from "lucide-react";
import { toast } from "sonner";

interface Patient { id: string; full_name: string; birth_date: string | null; history_number: string | null; }
interface PatientLink { patient_id: string; patient: Patient | null; }
interface Attachment {
  id: string;
  note_id: string;
  patient_id: string | null;
  kind: "ai_run" | "treatment_plan" | "ultrasound" | "visit" | "lab" | "consultation" | "prescription";
  ref_id: string | null;
  mode: "live" | "snapshot";
  title: string;
  summary: string | null;
  snapshot: any;
  position: number;
}

const KIND_META: Record<Attachment["kind"], { label: string; icon: any; color: string }> = {
  ai_run:         { label: "Рассуждение ИИ",  icon: Brain,        color: "text-purple-600" },
  treatment_plan: { label: "Схема лечения",   icon: Stethoscope,  color: "text-emerald-600" },
  ultrasound:     { label: "УЗИ",             icon: Activity,     color: "text-blue-600" },
  visit:          { label: "Визит",           icon: FileText,     color: "text-orange-600" },
  lab:            { label: "Анализы",         icon: FlaskConical, color: "text-pink-600" },
  consultation:   { label: "Консультация",    icon: FileText,     color: "text-indigo-600" },
  prescription:   { label: "Рецепт",          icon: FileText,     color: "text-teal-600" },
};

export function VaultContextPanel({ noteId }: { noteId: string }) {
  const [patients, setPatients] = useState<PatientLink[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [attachPicker, setAttachPicker] = useState<{ kind: Attachment["kind"]; patientId: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: links }, { data: atts }] = await Promise.all([
      supabase
        .from("vault_note_patients")
        .select("patient_id, patient:patients(id, full_name, birth_date, history_number)")
        .eq("note_id", noteId),
      supabase
        .from("vault_note_attachments")
        .select("*")
        .eq("note_id", noteId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);
    setPatients((links as any) ?? []);
    setAttachments((atts as any) ?? []);
    setLoading(false);
  }, [noteId]);

  useEffect(() => { if (noteId) load(); }, [noteId, load]);

  async function attachPatient(p: Patient) {
    const { error } = await supabase
      .from("vault_note_patients")
      .insert({ note_id: noteId, patient_id: p.id });
    if (error && !error.message.includes("duplicate")) {
      toast.error("Не удалось привязать: " + error.message);
      return;
    }
    toast.success(`Привязан: ${p.full_name}`);
    setPickerOpen(false);
    load();
  }

  async function detachPatient(patientId: string) {
    await supabase.from("vault_note_patients").delete().eq("note_id", noteId).eq("patient_id", patientId);
    load();
  }

  async function removeAttachment(id: string) {
    await supabase.from("vault_note_attachments").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-4">
      {/* === Patients === */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />Пациенты ({patients.length})</span>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setPickerOpen(true)}>
            <Plus className="w-3 h-3 mr-0.5" />Привязать
          </Button>
        </div>
        {patients.length === 0 ? (
          <div className="text-[11px] text-muted-foreground italic">Заметка не привязана</div>
        ) : (
          <div className="space-y-1">
            {patients.map((pl) => pl.patient && (
              <div key={pl.patient_id} className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50 text-xs group">
                <Link to={`/admin/patients/${pl.patient_id}`} className="flex-1 hover:underline truncate text-primary">
                  👤 {pl.patient.full_name}
                </Link>
                <button onClick={() => detachPatient(pl.patient_id)}
                  className="opacity-0 group-hover:opacity-100 text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === Attach data buttons === */}
      {patients.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Добавить в заметку</div>
          <div className="grid grid-cols-2 gap-1">
            {(["ai_run","treatment_plan","ultrasound","visit","lab","prescription"] as const).map((k) => {
              const meta = KIND_META[k];
              const Icon = meta.icon;
              return (
                <Button key={k} size="sm" variant="outline" className="h-7 text-[11px] justify-start gap-1"
                  onClick={() => setAttachPicker({ kind: k, patientId: patients[0].patient_id })}>
                  <Icon className={`w-3 h-3 ${meta.color}`} />{meta.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* === Attachments === */}
      {attachments.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
            Вложения ({attachments.length})
          </div>
          <div className="space-y-1.5">
            {attachments.map((a) => {
              const meta = KIND_META[a.kind];
              const Icon = meta.icon;
              return (
                <div key={a.id} className="border rounded p-2 text-xs group bg-card">
                  <div className="flex items-start gap-1.5">
                    <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${meta.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{a.title}</div>
                      {a.summary && <div className="text-[10px] text-muted-foreground line-clamp-2">{a.summary}</div>}
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-[9px] h-4">
                          {a.mode === "live" ? <><Link2 className="w-2.5 h-2.5 mr-0.5"/>живая</> : <><Camera className="w-2.5 h-2.5 mr-0.5"/>снимок</>}
                        </Badge>
                        {a.mode === "live" && a.ref_id && (
                          <AttachmentLink kind={a.kind} refId={a.ref_id} patientId={a.patient_id} />
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeAttachment(a.id)}
                      className="opacity-0 group-hover:opacity-100 text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PatientPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={attachPatient}
        excludeIds={patients.map(p => p.patient_id)} />

      {attachPicker && (
        <AttachmentPicker
          noteId={noteId}
          kind={attachPicker.kind}
          patients={patients.map(p => p.patient).filter(Boolean) as Patient[]}
          initialPatientId={attachPicker.patientId}
          onClose={() => setAttachPicker(null)}
          onDone={() => { setAttachPicker(null); load(); }}
        />
      )}
    </div>
  );
}

function AttachmentLink({ kind, refId, patientId }: { kind: Attachment["kind"]; refId: string; patientId: string | null }) {
  const href =
    kind === "treatment_plan" ? `/admin/treatment-plans/${refId}` :
    kind === "ai_run"         ? `/cabinet/agent?run=${refId}` :
    kind === "visit"          ? `/admin/patient-visits/${refId}` :
    kind === "ultrasound"     ? (patientId ? `/admin/patients/${patientId}` : "#") :
    kind === "lab"            ? (patientId ? `/admin/patients/${patientId}` : "#") :
    kind === "prescription"   ? `/admin/prescriptions/${refId}` :
    "#";
  return (
    <Link to={href} className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5">
      <ExternalLink className="w-2.5 h-2.5" />открыть
    </Link>
  );
}

/* =================== Patient picker dialog =================== */
function PatientPicker({
  open, onClose, onPick, excludeIds,
}: { open: boolean; onClose: () => void; onPick: (p: Patient) => void; excludeIds: string[] }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      let query = supabase.from("patients").select("id, full_name, birth_date, history_number")
        .order("full_name").limit(30);
      if (q.trim()) query = query.ilike("full_name", `%${q.trim()}%`);
      const { data } = await query;
      setResults(((data as any) ?? []).filter((p: Patient) => !excludeIds.includes(p.id)));
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q, open, excludeIds]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Привязать пациента</DialogTitle></DialogHeader>
        <Input placeholder="Поиск по ФИО..." value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <div className="max-h-80 overflow-y-auto space-y-1">
          {loading && <Loader2 className="w-4 h-4 animate-spin mx-auto" />}
          {results.map((p) => (
            <button key={p.id} onClick={() => onPick(p)}
              className="w-full text-left px-2 py-2 rounded hover:bg-muted text-sm border">
              <div className="font-medium">{p.full_name}</div>
              <div className="text-[11px] text-muted-foreground">
                {p.birth_date ?? "—"}{p.history_number ? ` · ИБ ${p.history_number}` : ""}
              </div>
            </button>
          ))}
          {!loading && results.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-4">Никого не найдено</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* =================== Attachment picker dialog =================== */
function AttachmentPicker({
  noteId, kind, patients, initialPatientId, onClose, onDone,
}: {
  noteId: string;
  kind: Attachment["kind"];
  patients: Patient[];
  initialPatientId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [patientId, setPatientId] = useState(initialPatientId);
  const [items, setItems] = useState<Array<{ id: string; title: string; summary?: string; data?: any }>>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<"live" | "snapshot">("live");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setSelected(null); loadItems(); /* eslint-disable-next-line */ }, [patientId, kind]);

  async function loadItems() {
    setLoading(true);
    let rows: any[] = [];
    if (kind === "ai_run") {
      const { data } = await supabase.from("agent_runs")
        .select("id, task, summary, created_at").eq("patient_id", patientId)
        .order("created_at", { ascending: false }).limit(50);
      rows = (data ?? []).map((r: any) => ({
        id: r.id,
        title: (r.task ?? "Разбор ИИ").slice(0, 80),
        summary: r.summary?.slice(0, 200),
        data: r,
      }));
    } else if (kind === "treatment_plan") {
      const { data } = await supabase.from("treatment_plans")
        .select("id, title, diagnosis, created_at").eq("patient_id", patientId)
        .order("created_at", { ascending: false }).limit(50);
      rows = (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title || `План от ${new Date(r.created_at).toLocaleDateString("ru")}`,
        summary: r.diagnosis,
        data: r,
      }));
    } else if (kind === "ultrasound") {
      const { data } = await supabase.from("ultrasound_results")
        .select("id, study_type, study_date, conclusion").eq("patient_id", patientId)
        .order("study_date", { ascending: false }).limit(50);
      rows = (data ?? []).map((r: any) => ({
        id: r.id,
        title: `${r.study_type || "УЗИ"} — ${r.study_date ?? ""}`,
        summary: r.conclusion?.slice(0, 200),
        data: r,
      }));
    } else if (kind === "visit") {
      const { data } = await supabase.from("patient_visits")
        .select("id, visit_date, visit_type, complaints").eq("patient_id", patientId)
        .order("visit_date", { ascending: false }).limit(50);
      rows = (data ?? []).map((r: any) => ({
        id: r.id,
        title: `${r.visit_type || "Визит"} — ${r.visit_date ?? ""}`,
        summary: r.complaints?.slice(0, 200),
        data: r,
      }));
    } else if (kind === "lab") {
      const { data } = await supabase.from("lab_results")
        .select("id, test_name, study_date, result_value, result_unit").eq("patient_id", patientId)
        .order("study_date", { ascending: false }).limit(50);
      rows = (data ?? []).map((r: any) => ({
        id: r.id,
        title: `${r.test_name} — ${r.study_date ?? ""}`,
        summary: r.result_value ? `${r.result_value} ${r.result_unit ?? ""}` : "",
        data: r,
      }));
    } else if (kind === "prescription") {
      const { data } = await supabase.from("prescriptions")
        .select("id, prescription_number, issued_date, diagnosis").eq("patient_id", patientId)
        .order("issued_date", { ascending: false }).limit(50);
      rows = (data ?? []).map((r: any) => ({
        id: r.id,
        title: `Рецепт ${r.prescription_number ?? ""} — ${r.issued_date ?? ""}`,
        summary: r.diagnosis,
        data: r,
      }));
    }
    setItems(rows);
    setLoading(false);
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    const item = items.find((i) => i.id === selected);
    const { error } = await supabase.from("vault_note_attachments").insert({
      note_id: noteId,
      patient_id: patientId,
      kind,
      ref_id: selected,
      mode,
      title: item?.title ?? "Без названия",
      summary: item?.summary ?? null,
      snapshot: mode === "snapshot" ? item?.data ?? null : null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Добавлено в заметку");
    onDone();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Добавить: {KIND_META[kind].label}</DialogTitle>
        </DialogHeader>

        {patients.length > 1 && (
          <Select value={patientId} onValueChange={setPatientId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <div className="max-h-72 overflow-y-auto space-y-1 border rounded p-1">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto my-4" /> :
            items.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-6">У пациента нет таких записей</div>
            ) : items.map((it) => (
              <button key={it.id} onClick={() => setSelected(it.id)}
                className={`w-full text-left px-2 py-1.5 rounded text-sm border ${
                  selected === it.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"
                }`}>
                <div className="font-medium text-xs">{it.title}</div>
                {it.summary && <div className="text-[10px] text-muted-foreground line-clamp-1">{it.summary}</div>}
              </button>
            ))
          }
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Режим:</span>
          <Button size="sm" variant={mode === "live" ? "default" : "outline"} className="h-7 text-xs"
            onClick={() => setMode("live")}>
            <Link2 className="w-3 h-3 mr-1" />Живая ссылка
          </Button>
          <Button size="sm" variant={mode === "snapshot" ? "default" : "outline"} className="h-7 text-xs"
            onClick={() => setMode("snapshot")}>
            <Camera className="w-3 h-3 mr-1" />Снимок
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={save} disabled={!selected || saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
