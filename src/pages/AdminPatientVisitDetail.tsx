import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Printer, Trash2, RotateCcw, Eye, Plus, ChevronDown, Save, X, Copy, Stethoscope, Pencil, FileDown } from "lucide-react";
import { exportNodeToPdf } from "@/lib/exportPdf";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { PROTOCOL_TYPE_MAP, ProtocolType } from "@/lib/visits/protocolTypes";
import { DEFAULT_PROTOCOL_DATA } from "@/lib/visits/protocolSchemas";
import { ProtocolForm } from "@/components/visits/ProtocolForm";
import { IcdAutocomplete } from "@/components/visits/IcdAutocomplete";
import { useAutoSave } from "@/hooks/useAutoSave";
import { normalizeImportedProtocolData, NORMALIZATION_VERSION } from "@/lib/visits/normalizeProtocolData";
import { ProtocolPrintLayout } from "@/components/visits/ProtocolPrintLayout";
import { AssignmentsPanel, normalizeAssignments, AssignmentsData } from "@/components/visits/AssignmentsPanel";
import { AiReasoningField } from "@/components/visits/AiReasoningField";
import { WriteRxFromAssignments } from "@/components/visits/WriteRxFromAssignments";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { setActiveContext, clearActiveContextIfMatches, subscribePlanItems, popQueuedPlanItems, type ParsedPlanItem } from "@/lib/protocolBridge";
import { useProtocolFragmentReceiver } from "@/hooks/useProtocolFragmentReceiver";
import { mergePlanItemsIntoAssignments } from "@/lib/visits/applyPlanItemsToAssignments";
import PdfBatchUpload from "@/components/medical/PdfBatchUpload";

interface Visit {
  id: string;
  patient_id: string;
  visit_date: string;
  protocol_type: ProtocolType;
  protocol_data: Json;
  diagnosis: string | null;
  icd_code: string | null;
  next_visit_date: string | null;
  patient: { id: string; full_name: string; history_number: string | null; birth_date: string; sex: "M" | "F" | null } | null;
}

interface SiblingVisit {
  id: string;
  visit_date: string;
  protocol_type: ProtocolType;
  diagnosis: string | null;
}

const isProtocolRecord = (data: Json): data is { [key: string]: Json } => {
  return !!data && typeof data === "object" && !Array.isArray(data);
};

const serializeVisit = (v: Visit) => JSON.stringify({
  visit_date: v.visit_date,
  diagnosis: v.diagnosis,
  icd_code: v.icd_code,
  next_visit_date: v.next_visit_date,
  protocol_data: v.protocol_data,
});

export default function AdminPatientVisitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, isSurgeon } = useAuth();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [baseline, setBaseline] = useState<string>("");
  const [siblings, setSiblings] = useState<SiblingVisit[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!authLoading && user && !isAdmin && !isSurgeon) navigate("/");
  }, [authLoading, user, isAdmin, isSurgeon, navigate]);

  useProtocolFragmentReceiver({ patientId: visit?.patient_id, kind: "visit" });

  // Receive structured plan items from Cabinet ("Распределить по плану") and merge into assignments.
  useEffect(() => {
    if (!visit?.patient_id) return;
    const ingest = (items: ParsedPlanItem[]) => {
      if (!items?.length) return;
      setVisit((v) => {
        if (!v) return v;
        const base = isProtocolRecord(v.protocol_data) ? { ...(v.protocol_data as any) } : {};
        const cur = normalizeAssignments(base.assignments);
        base.assignments = mergePlanItemsIntoAssignments(cur, items);
        return { ...v, protocol_data: base as Json };
      });
      toast({ title: `Добавлено в назначения: ${items.length}` });
    };
    const unsub = subscribePlanItems((msg) => ingest(msg.items), { patientId: visit.patient_id });
    const queued = popQueuedPlanItems({ patientId: visit.patient_id });
    if (queued.length) ingest(queued.flatMap((q) => q.items));
    return unsub;
  }, [visit?.patient_id]);

  useEffect(() => {
    if (!visit?.patient?.full_name) return;
    setActiveContext({
      patientId: visit.patient.id,
      patientName: visit.patient.full_name,
      targetId: visit.id,
      kind: "visit",
      url: window.location.pathname + window.location.search,
    });
    return () => clearActiveContextIfMatches(visit.id);
  }, [visit?.id, visit?.patient?.id, visit?.patient?.full_name]);


  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setBaseline("");
    supabase
      .from("patient_visits")
      .select("*, patient:patients(id, full_name, history_number, birth_date, sex)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
        if (data) {
          const v = data as Visit;
          const original = v.protocol_data;
          const normalized = normalizeImportedProtocolData(v.protocol_type, original);
          v.protocol_data = normalized;
          setVisit(v);
          setBaseline(serializeVisit(v));
          const prevVersion = isProtocolRecord(original)
            ? (original._normalized_version as number | undefined) : undefined;
          const newVersion = isProtocolRecord(normalized)
            ? (normalized._normalized_version as number | undefined) : undefined;
          if (newVersion === NORMALIZATION_VERSION && prevVersion !== NORMALIZATION_VERSION) {
            supabase.from("patient_visits").update({ protocol_data: normalized }).eq("id", v.id)
              .then(({ error: upErr }) => { if (upErr) console.warn("[normalize] auto-persist failed:", upErr.message); });
          }
        }
        setLoading(false);
      });
  }, [id]);

  // Load siblings for "Открыть протокол" dropdown
  useEffect(() => {
    if (!visit?.patient_id) return;
    supabase.from("patient_visits")
      .select("id, visit_date, protocol_type, diagnosis")
      .eq("patient_id", visit.patient_id)
      .neq("id", visit.id)
      .order("visit_date", { ascending: false })
      .limit(50)
      .then(({ data }) => setSiblings((data || []) as SiblingVisit[]));
  }, [visit?.patient_id, visit?.id]);

  const isDirty = useMemo(() => {
    if (!visit || !baseline) return false;
    return serializeVisit(visit) !== baseline;
  }, [visit, baseline]);
  const isDirtyRef = useRef(isDirty);
  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

  const update = (patch: Partial<Visit>) => setVisit((v) => (v ? { ...v, ...patch } : v));

  const handleSave = async () => {
    if (!visit) return;
    setSaving(true);
    const { error } = await supabase
      .from("patient_visits")
      .update({
        visit_date: visit.visit_date,
        diagnosis: visit.diagnosis,
        icd_code: visit.icd_code,
        next_visit_date: visit.next_visit_date,
        protocol_data: visit.protocol_data,
      })
      .eq("id", visit.id);
    setSaving(false);
    if (error) toast({ title: "Не удалось сохранить", description: error.message, variant: "destructive" });
    else {
      clearDraft();
      setBaseline(serializeVisit(visit));
      toast({ title: "Сохранено" });
    }
  };
  const handleSaveRef = useRef(handleSave);
  useEffect(() => { handleSaveRef.current = handleSave; });

  // Ctrl+S / Cmd+S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        if (isDirtyRef.current) handleSaveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // beforeunload guard
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const confirmIfDirty = (cb: () => void) => {
    if (isDirty && !window.confirm("Есть несохранённые изменения. Уйти без сохранения?")) return;
    cb();
  };

  const { loadDraft, clearDraft, hasDraft } = useAutoSave({
    key: id ? `visit_${id}` : "visit_new",
    data: visit ? {
      visit_date: visit.visit_date,
      diagnosis: visit.diagnosis,
      icd_code: visit.icd_code,
      next_visit_date: visit.next_visit_date,
      protocol_data: visit.protocol_data,
    } : {},
    enabled: !!visit,
  });

  const restoreDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setVisit((v) => (v ? { ...v, ...draft } : v));
      toast({ title: "Черновик восстановлен" });
    }
  };

  const handleDelete = async () => {
    if (!visit) return;
    if (!confirm("Удалить этот визит безвозвратно?")) return;
    const { error } = await supabase.from("patient_visits").delete().eq("id", visit.id);
    if (error) toast({ title: "Не удалось удалить", description: error.message, variant: "destructive" });
    else navigate("/admin/visits");
  };

  const handleDuplicate = async () => {
    if (!visit) return;
    const proceed = () => true;
    if (isDirty && !window.confirm("Есть несохранённые изменения. Дублировать без сохранения?")) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("patient_visits")
      .insert({
        patient_id: visit.patient_id,
        visit_date: today,
        protocol_type: visit.protocol_type,
        protocol_data: visit.protocol_data,
        diagnosis: visit.diagnosis,
        icd_code: visit.icd_code,
        next_visit_date: null,
      })
      .select("id")
      .single();
    if (error || !data) {
      toast({ title: "Не удалось дублировать", description: error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Протокол продублирован", description: "Измените динамические поля." });
    navigate(`/admin/visits/${data.id}`);
    void proceed;
  };

  /** Создать (или открыть существующий) протокол УЗДГ органов МПС
   *  для того же пациента — чтобы первичная консультация + УЗИ делались за один шаг. */
  const handleAddUziUrinary = async () => {
    if (!visit) return;
    if (isDirty && !window.confirm("Есть несохранённые изменения в текущем протоколе. Продолжить?")) return;

    // Если у пациента уже есть сегодняшний УЗДГ МПС — открываем его, а не плодим дубль.
    const today = format(new Date(), "yyyy-MM-dd");
    const existing = siblings.find((s) => s.protocol_type === "uzi_reproductive" && s.visit_date === today);
    if (existing) {
      toast({ title: "Открываю существующий УЗДГ МПС", description: "Протокол за сегодня уже создан." });
      navigate(`/admin/visits/${existing.id}`);
      return;
    }

    const { data, error } = await supabase
      .from("patient_visits")
      .insert({
        patient_id: visit.patient_id,
        visit_date: today,
        protocol_type: "uzi_reproductive",
        protocol_data: (DEFAULT_PROTOCOL_DATA["uzi_reproductive"] as any) || {},
        diagnosis: visit.diagnosis,
        icd_code: visit.icd_code,
      })
      .select("id")
      .single();

    if (error || !data) {
      toast({ title: "Не удалось создать УЗДГ МПС", description: error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "УЗДГ органов МПС создан", description: "Заполните параметры исследования." });
    navigate(`/admin/visits/${data.id}`);
  };



  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!visit) return <div className="p-8 text-center">Визит не найден</div>;

  const def = PROTOCOL_TYPE_MAP[visit.protocol_type];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        {/* STICKY ACTION BAR */}
        <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center gap-2 px-4 h-12">
            {/* Left group */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => confirmIfDirty(() => navigate("/admin/visits"))}
                >
                  <ArrowLeft className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">К журналу</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>К журналу визитов</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <span className="hidden md:inline">Открыть протокол</span>
                      <span className="md:hidden">Протокол</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Другие протоколы пациента</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="start" className="max-h-[60vh] overflow-y-auto w-80">
                {siblings.length === 0 ? (
                  <DropdownMenuItem disabled>Нет других протоколов</DropdownMenuItem>
                ) : (
                  siblings.map((s) => {
                    const title = PROTOCOL_TYPE_MAP[s.protocol_type]?.title || s.protocol_type;
                    const dx = s.diagnosis ? ` — ${s.diagnosis.slice(0, 40)}${s.diagnosis.length > 40 ? "…" : ""}` : "";
                    return (
                      <DropdownMenuItem
                        key={s.id}
                        onSelect={() => confirmIfDirty(() => navigate(`/admin/visits/${s.id}`))}
                      >
                        <span className="text-xs">
                          <strong>{format(new Date(s.visit_date), "dd.MM.yyyy")}</strong> — {title}{dx}
                        </span>
                      </DropdownMenuItem>
                    );
                  })
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/admin/visits/new?patient_id=${visit.patient_id}`} onClick={(e) => {
                    if (isDirty && !window.confirm("Есть несохранённые изменения. Уйти без сохранения?")) {
                      e.preventDefault();
                    }
                  }}>
                    <Plus className="h-4 w-4 md:mr-1" />
                    <span className="hidden md:inline">Новый протокол</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Создать новый протокол для этого пациента</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Дублировать</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Создать копию этого протокола (сегодняшняя дата)</TooltipContent>
            </Tooltip>

            {visit.protocol_type === "primary_short" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddUziUrinary}
                    className="gap-1 border-primary/40 text-primary hover:bg-primary/5"
                  >
                    <Stethoscope className="h-4 w-4 md:mr-1" />
                    <span className="hidden md:inline">+ УЗДГ органов МПС</span>
                    <span className="md:hidden">+ УЗДГ</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Создать протокол УЗИ органов мочевыделительной системы для того же пациента</TooltipContent>
              </Tooltip>
            )}



            {/* Right group */}
            <div className="ml-auto flex items-center gap-2">
              {hasDraft() && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={restoreDraft}>
                      <RotateCcw className="h-4 w-4 md:mr-1" />
                      <span className="hidden md:inline">Черновик</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Восстановить автосохранённый черновик</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                    <Eye className="h-4 w-4 md:mr-1" />
                    <span className="hidden md:inline">Предпросмотр</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Полный предпросмотр бланка</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Удалить визит</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    className={isDirty ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                  >
                    {saving ? <Loader2 className="h-4 w-4 md:mr-1 animate-spin" /> : <Save className="h-4 w-4 md:mr-1" />}
                    <span className="hidden md:inline">Сохранить</span>
                    {isDirty && <span className="ml-1 inline-block w-2 h-2 rounded-full bg-yellow-300" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isDirty ? "Есть несохранённые изменения (Ctrl+S)" : "Всё сохранено"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {isDirty && (
            <div className="bg-yellow-50 border-t border-b border-yellow-300 text-yellow-900 text-xs px-4 py-1.5 text-center">
              ⚠ Есть несохранённые изменения — не забудьте сохранить (Ctrl+S)
            </div>
          )}
        </div>

        <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-8">
          <h1 className="text-2xl font-bold">{def?.title || visit.protocol_type}</h1>

          <Card>
            <CardHeader><CardTitle className="text-base">Пациент</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">ФИО:</span> {visit.patient?.full_name}
                {visit.patient_id && (
                  <Link
                    to={`/admin/patients/${visit.patient_id}/edit`}
                    title="Редактировать карточку пациента"
                    className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
              <div><span className="text-muted-foreground">№ ИБ:</span> <span className="font-mono">{visit.patient?.history_number || "—"}</span></div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Дата рождения:</span>
                {visit.patient?.birth_date ? format(new Date(visit.patient.birth_date), "dd.MM.yyyy") : "—"}
                {visit.patient_id && (
                  <Link
                    to={`/admin/patients/${visit.patient_id}/edit`}
                    title="Исправить дату рождения в карточке"
                    className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Метаданные визита</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Дата визита</Label>
                <Input type="date" value={visit.visit_date} onChange={(e) => update({ visit_date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Контрольный осмотр</Label>
                <Input type="date" value={visit.next_visit_date || ""} onChange={(e) => update({ next_visit_date: e.target.value || null })} />
              </div>
              <div className="space-y-1">
                <Label>Код МКБ-10</Label>
                <IcdAutocomplete
                  value={visit.icd_code || ""}
                  onChange={(code, name) => update({ icd_code: code, diagnosis: visit.diagnosis || name || null })}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Диагноз</Label>
                <Textarea value={visit.diagnosis || ""} onChange={(e) => update({ diagnosis: e.target.value })} rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Содержание протокола</CardTitle></CardHeader>
            <CardContent>
              <ProtocolForm
                type={visit.protocol_type}
                data={visit.protocol_data}
                onChange={(d) => update({ protocol_data: d })}
                birthDate={visit.patient?.birth_date}
              />

            </CardContent>
          </Card>

          <PdfBatchUpload patientId={visit.patient_id} />


          <AssignmentsPanel
            value={isProtocolRecord(visit.protocol_data) ? normalizeAssignments((visit.protocol_data as any).assignments) : undefined}
            onChange={(next: AssignmentsData) => {
              const base = isProtocolRecord(visit.protocol_data) ? { ...(visit.protocol_data as any) } : {};
              base.assignments = next;
              update({ protocol_data: base as Json });
            }}
          />

          {(() => {
            const a = isProtocolRecord(visit.protocol_data)
              ? normalizeAssignments((visit.protocol_data as any).assignments)
              : null;
            if (!a || a.treatments.length === 0) return null;
            return (
              <div className="flex justify-end">
                <WriteRxFromAssignments
                  treatments={a.treatments}
                  patientId={visit.patient_id}
                  patientName={visit.patient?.full_name}
                />
              </div>
            );
          })()}

          <AiReasoningField
            value={isProtocolRecord(visit.protocol_data) ? ((visit.protocol_data as any).ai_reasoning || "") : ""}
            onChange={(v) => {
              const base = isProtocolRecord(visit.protocol_data) ? { ...(visit.protocol_data as any) } : {};
              base.ai_reasoning = v;
              update({ protocol_data: base as Json });
            }}
          />
        </div>

        {/* Fullscreen preview dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent
            className="max-w-none w-screen h-screen p-0 gap-0 rounded-none border-0 sm:rounded-none overflow-hidden flex flex-col [&>button]:hidden"
          >
            <style>{`
              .preview-container {
                background: #e0e0e0;
                padding: 20px 0;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                min-height: 0;
              }
              .preview-wrapper {
                transform: scale(0.85);
                transform-origin: top center;
                width: 117.65%;
                margin-left: -8.82%;
              }
              @media (max-width: 1280px) {
                .preview-wrapper { transform: scale(0.75); width: 133.33%; margin-left: -16.66%; }
              }
              @media (max-width: 1024px) {
                .preview-wrapper { transform: scale(0.55); width: 181.82%; margin-left: -40.91%; }
              }
              .preview-container .print-page {
                margin: 0 auto 20px auto;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              }
              @media print {
                body > *:not(.modal-print-root) { display: none !important; }
                .modal-print-root { position: absolute; inset: 0; box-shadow: none !important; }
                .modal-print-root .preview-toolbar { display: none !important; }
                .modal-print-root .preview-container { overflow: visible !important; height: auto !important; padding: 0 !important; background: #fff !important; }
                .modal-print-root .preview-wrapper { transform: none !important; width: auto !important; margin: 0 !important; }
                .modal-print-root .preview-container .print-page { box-shadow: none !important; margin: 0 !important; }
              }
            `}</style>
            <div className="modal-print-root flex flex-col h-full min-h-0 bg-muted/30">
              <div className="preview-toolbar flex items-center justify-between border-b bg-background px-4 h-12 shrink-0">
                <div className="text-sm font-medium">Предпросмотр протокола</div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const src = document.getElementById("protocol-print-content");
                      if (!src) return;
                      const w = window.open("", "_blank");
                      if (!w) return;
                      const headCss = `
                        html,body{margin:0!important;padding:0!important;background:#fff}
                        @page { size: A4; margin: 15mm 15mm 18mm 15mm; }
                        @media print {
                          html,body{margin:0!important;padding:0!important;background:#fff!important}
                          .print-page{padding:0!important;margin:0!important;width:100%!important;max-width:100%!important;min-height:0!important;box-shadow:none!important;box-sizing:border-box!important}
                        }
                      `;
                      w.document.write(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Протокол — Тарусин Д.И.</title><base href="${window.location.origin}/"><style>${headCss}</style></head><body>${src.innerHTML}</body></html>`);
                      w.document.close();
                      w.focus();
                      const doPrint = async () => {
                        try {
                          const imgs = Array.from(w.document.images || []);
                          await Promise.all(imgs.map((img) => {
                            if (img.complete && img.naturalWidth > 0) return Promise.resolve();
                            return new Promise<void>((resolve) => {
                              img.addEventListener("load", () => resolve(), { once: true });
                              img.addEventListener("error", () => resolve(), { once: true });
                            });
                          }));
                          if ((w.document as any).fonts?.ready) {
                            try { await (w.document as any).fonts.ready; } catch {}
                          }
                          w.focus();
                          w.print();
                        } finally {
                          setTimeout(() => { try { w.close(); } catch {} }, 300);
                        }
                      };
                      if (w.document.readyState === "complete") doPrint();
                      else w.addEventListener("load", () => doPrint(), { once: true });
                    }}
                  >
                    <Printer className="h-4 w-4 mr-1" /> Печать
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const src = document.getElementById("protocol-print-content") as HTMLElement | null;
                      if (!src) return;
                      try {
                        const name = (visit as any)?.patient?.full_name?.replace(/\s+/g, "_") || "protocol";
                        const date = (visit as any)?.visit_date ? String((visit as any).visit_date).slice(0, 10) : "";
                        await exportNodeToPdf(src, `${name}_${date}.pdf`);
                      } catch (e: any) {
                        toast({ title: "Не удалось создать PDF", description: e?.message || String(e), variant: "destructive" });
                      }
                    }}
                  >
                    <FileDown className="h-4 w-4 mr-1" /> PDF
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPreviewOpen(false)}>
                    <X className="h-4 w-4 mr-1" /> Закрыть
                  </Button>
                </div>
              </div>
              <div className="preview-container flex-1 min-h-0">
                <div id="protocol-print-content" className="preview-wrapper">
                  <ProtocolPrintLayout visit={visit as any} />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
