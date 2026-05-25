import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Save, Printer, Trash2, BookMarked, Download, CalendarDays, List, History, FileDown, ClipboardList, Share2, Send, MoreHorizontal, Keyboard } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { CommandPaletteDialog } from "@/components/treatment/CommandPaletteDialog";
import { HotkeysHelpDialog } from "@/components/treatment/HotkeysHelpDialog";
import { toast } from "@/hooks/use-toast";
import { PatientSelect } from "@/components/prescriptions/PatientSelect";
import { SECTIONS, TreatmentCategory } from "@/components/treatment/sections";
import { CatalogPicker, CatalogItem } from "@/components/treatment/CatalogPicker";
import { PlanItemRow, PlanItem } from "@/components/treatment/PlanItemRow";
import { ApplyTemplateDialog } from "@/components/treatment/ApplyTemplateDialog";
import { SaveAsTemplateDialog } from "@/components/treatment/SaveAsTemplateDialog";
import { GanttHeader } from "@/components/treatment/GanttStrip";
import { ScheduledSummary } from "@/components/treatment/ScheduledSummary";
import { PlanVersionHistoryDrawer } from "@/components/treatment/PlanVersionHistoryDrawer";
import { PlanCostBlock } from "@/components/treatment/PlanCostBlock";
import { LabControlSection, type LabControlPoint } from "@/components/treatment/LabControlSection";
import { PublicLinkPopover } from "@/components/treatment/PublicLinkPopover";
import { PatternExportDialog } from "@/components/treatment/PatternExportDialog";
import { SendMemoDialog } from "@/components/treatment/SendMemoDialog";
import { generatePlanDocx } from "@/lib/treatment/docxExport";
import type { CostCatalog } from "@/lib/treatment/cost";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

interface Patient { id: string; full_name: string; birth_date: string; sex?: string | null; }

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto) ? crypto.randomUUID() : Math.random().toString(36).slice(2);

function fromCatalog(c: CatalogItem, section: TreatmentCategory): PlanItem {
  return {
    client_id: newId(), catalog_id: c.id, section_category: section,
    name_snapshot: c.name, inn_snapshot: c.inn, form_snapshot: c.form,
    dose: c.default_dose, dose_unit: c.dose_unit,
    dilution_volume: c.default_dilution_volume, dilution_solvent: c.default_dilution_solvent,
    frequency: c.default_frequency, duration_days: c.default_duration_days,
    time_of_day: c.time_of_day_default || [], infusion_rate: c.infusion_rate,
    notes: c.notes, is_off_label: c.is_off_label, light_sensitive: c.light_sensitive,
    glucose_only: c.glucose_only, dose_range_min: c.dose_range_min, dose_range_max: c.dose_range_max,
  };
}

export default function TreatmentPlanEditor() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [issuedAt, setIssuedAt] = useState<string>(new Date().toISOString().slice(0, 10));
  const [durationDays, setDurationDays] = useState<number>(10);
  const [mode, setMode] = useState<"flat" | "scheduled">("flat");
  const [diagnosis, setDiagnosis] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<"draft" | "issued" | "archived">("draft");
  const [items, setItems] = useState<PlanItem[]>([]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [patternExportOpen, setPatternExportOpen] = useState(false);
  const [sendMemoOpen, setSendMemoOpen] = useState(false);
  const [currentTotalCost, setCurrentTotalCost] = useState<number>(0);
  const [courseNumber, setCourseNumber] = useState<number | null>(null);
  const [patientAge, setPatientAge] = useState<number | null>(null);
  const [showCostInPrint, setShowCostInPrint] = useState(false);
  const [labControlEnabled, setLabControlEnabled] = useState(false);
  const [labPoints, setLabPoints] = useState<LabControlPoint[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [publicHash, setPublicHash] = useState<string | null>(null);
  const isNew = !id;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: id ? `/admin/treatment-plans/${id}` : "/admin/treatment-plans/new" } });
    }
  }, [user, isAdmin, loading, navigate, id]);

  useEffect(() => {
    (async () => {
      setBusy(true);
      if (isNew) {
        const pid = params.get("patientId");
        if (pid) {
          const { data } = await supabase.from("patients").select("*").eq("id", pid).maybeSingle();
          if (data) setPatient(data as any);
        }
        setBusy(false);
        return;
      }
      const { data: plan } = await supabase.from("treatment_plans")
        .select("*, patient:patients(*)").eq("id", id!).maybeSingle();
      if (plan) {
        setPatient((plan as any).patient);
        setIssuedAt(plan.issued_at);
        setDurationDays(plan.duration_days);
        setMode((plan.mode as any) || "flat");
        setDiagnosis(plan.diagnosis_short || "");
        setSummary(plan.clinical_summary || "");
        setStatus(plan.status as any);
        setCourseNumber((plan as any).course_number ?? null);
        setShowCostInPrint(!!(plan as any).show_cost_in_print);
        setLabControlEnabled(!!(plan as any).lab_control_enabled);
        setIsPublic(!!(plan as any).is_public);
        setPublicHash((plan as any).public_hash || null);
        const { data: rows } = await supabase.from("treatment_plan_items")
          .select("*").eq("plan_id", id!).order("section_category").order("order_index");
        setItems((rows || []).map((r: any): PlanItem => ({
          client_id: newId(), catalog_id: r.catalog_id, section_category: r.section_category,
          name_snapshot: r.name_snapshot, inn_snapshot: r.inn_snapshot, form_snapshot: r.form_snapshot,
          dose: r.dose, dose_unit: r.dose_unit, dilution_volume: r.dilution_volume, dilution_solvent: r.dilution_solvent,
          frequency: r.frequency, duration_days: r.duration_days, day_pattern: r.day_pattern,
          time_of_day: r.time_of_day || [], infusion_rate: r.infusion_rate, route_override: r.route_override,
          notes: r.notes, is_off_label: r.is_off_label, prn_estimated_doses: r.prn_estimated_doses,
        })));
        const { data: lc } = await supabase.from("treatment_plan_lab_control" as any)
          .select("*").eq("plan_id", id!).order("order_index");
        setLabPoints(((lc as any) || []).map((p: any) => ({
          client_id: newId(), id: p.id, control_point: p.control_point || "",
          at_day: p.at_day, test_ids: p.test_ids || [], custom_tests: p.custom_tests || [],
          notes: p.notes, order_index: p.order_index,
        })));
      }
      setBusy(false);
    })();
  }, [id, isNew, params]);

  // Compute patient age at issued date
  useEffect(() => {
    if (!patient?.birth_date) { setPatientAge(null); return; }
    const b = new Date(patient.birth_date);
    const d = new Date(issuedAt);
    let a = d.getFullYear() - b.getFullYear();
    const m = d.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && d.getDate() < b.getDate())) a--;
    setPatientAge(a);
  }, [patient, issuedAt]);

  // Bulk pattern update for Gantt day-context menu. Filter returns null = no change.
  const bulkUpdate = (updater: (it: PlanItem) => Partial<PlanItem> | null) => {
    setItems(prev => prev.map(it => {
      const p = updater(it);
      return p ? { ...it, ...p } : it;
    }));
  };

  const innCounts = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach(it => { if (it.inn_snapshot) m.set(it.inn_snapshot, (m.get(it.inn_snapshot) || 0) + 1); });
    return m;
  }, [items]);

  const addItem = (section: TreatmentCategory, c: CatalogItem) => {
    setItems(prev => {
      const it = fromCatalog(c, section);
      if (mode === "scheduled" && !it.day_pattern) it.day_pattern = `1-${durationDays}`;
      return [...prev, it];
    });
  };
  const updateItem = (cid: string, patch: Partial<PlanItem>) => setItems(prev => prev.map(i => i.client_id === cid ? { ...i, ...patch } : i));
  const removeItem = (cid: string) => setItems(prev => prev.filter(i => i.client_id !== cid));

  const toggleMode = () => {
    if (mode === "flat") {
      setItems(prev => prev.map(it => ({ ...it, day_pattern: it.day_pattern || `1-${durationDays}` })));
      setMode("scheduled");
    } else {
      setMode("flat");
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems(prev => {
      const a = prev.find(i => i.client_id === active.id);
      const b = prev.find(i => i.client_id === over.id);
      if (!a || !b || a.section_category !== b.section_category) return prev;
      const oldIdx = prev.findIndex(i => i.client_id === active.id);
      const newIdx = prev.findIndex(i => i.client_id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const applyTemplate = (newItems: PlanItem[], strategy: "replace" | "merge", suggestedMode: "flat" | "scheduled", suggestedDuration: number | null) => {
    if (suggestedMode === "scheduled" && mode === "flat") {
      if (confirm("Шаблон создан в режиме «Расписание по дням». Переключить лист в этот режим?")) {
        setMode("scheduled");
        if (suggestedDuration) setDurationDays(suggestedDuration);
      }
    }
    setItems(prev => strategy === "replace" ? newItems : [...prev, ...newItems]);
    toast({ title: strategy === "replace" ? "Лист заменён шаблоном" : `Добавлено ${newItems.length} позиций` });
  };

  const save = async (newStatus?: typeof status) => {
    if (!patient) { toast({ title: "Выберите пациента", variant: "destructive" }); return; }
    if (!user) return;
    setSaving(true);
    try {
      const planPayload: any = {
        patient_id: patient.id, issued_at: issuedAt, mode,
        duration_days: durationDays,
        diagnosis_short: diagnosis || null, clinical_summary: summary || null,
        status: newStatus || status, created_by: user.id,
        show_cost_in_print: showCostInPrint,
        lab_control_enabled: labControlEnabled,
      };
      if (courseNumber !== null && !isNew) planPayload.course_number = courseNumber;
      let planId = id;
      if (isNew) {
        const { data, error } = await supabase.from("treatment_plans").insert(planPayload).select("id").single();
        if (error) throw error;
        planId = data.id;
      } else {
        const { error } = await supabase.from("treatment_plans").update(planPayload).eq("id", id!);
        if (error) throw error;
        await supabase.from("treatment_plan_items").delete().eq("plan_id", id!);
        await supabase.from("treatment_plan_lab_control" as any).delete().eq("plan_id", id!);
      }
      if (items.length) {
        const rows = items.map((it, idx) => ({
          plan_id: planId!, catalog_id: it.catalog_id || null, section_category: it.section_category,
          order_index: idx, name_snapshot: it.name_snapshot, inn_snapshot: it.inn_snapshot,
          form_snapshot: it.form_snapshot, dose: it.dose, dose_unit: it.dose_unit,
          dilution_volume: it.dilution_volume, dilution_solvent: it.dilution_solvent,
          frequency: it.frequency, duration_days: it.duration_days ?? durationDays,
          day_pattern: it.day_pattern || null, time_of_day: it.time_of_day,
          infusion_rate: it.infusion_rate, route_override: it.route_override,
          notes: it.notes, is_off_label: it.is_off_label,
          prn_estimated_doses: it.prn_estimated_doses ?? null,
        }));
        const { error: e2 } = await supabase.from("treatment_plan_items").insert(rows);
        if (e2) throw e2;
      }
      if (labControlEnabled && labPoints.length) {
        const lcRows = labPoints.map((p, idx) => ({
          plan_id: planId!, control_point: p.control_point || null, at_day: p.at_day,
          test_ids: p.test_ids, custom_tests: p.custom_tests, notes: p.notes, order_index: idx,
        }));
        const { error: e3 } = await supabase.from("treatment_plan_lab_control" as any).insert(lcRows);
        if (e3) throw e3;
      }
      if (newStatus) setStatus(newStatus);
      toast({ title: "Сохранено" });
      if (isNew && planId) navigate(`/admin/treatment-plans/${planId}`, { replace: true });
    } catch (e: any) {
      toast({ title: "Ошибка сохранения", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!id || !confirm("Удалить лист назначений?")) return;
    const { error } = await supabase.from("treatment_plans").delete().eq("id", id);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    navigate("/admin/treatment-plans");
  };

  const exportDocx = async () => {
    if (!patient) { toast({ title: "Выберите пациента", variant: "destructive" }); return; }
    try {
      // Fetch catalog price data + lab control rows in parallel
      const catIds = Array.from(new Set(items.map(i => i.catalog_id).filter(Boolean) as string[]));
      const [{ data: cat }, { data: lc }] = await Promise.all([
        catIds.length
          ? supabase.from("treatment_catalog")
              .select("id, price_override, pack_size_num, units_per_dose_num, patient_info, price_auto, price_auto_updated_at, price_source_preference")
              .in("id", catIds)
          : Promise.resolve({ data: [] as any[] }),
        id
          ? supabase.from("treatment_plan_lab_control" as any).select("*, lab_tests_catalog(*)" as any).eq("plan_id", id).order("order_index")
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const catalogMap = new Map<string, CostCatalog>();
      const catalogPatientMap = new Map<string, any>();
      (cat || []).forEach((c: any) => {
        catalogMap.set(c.id, c);
        if (c.patient_info) catalogPatientMap.set(c.id, c.patient_info);
      });
      // Resolve test names for labControl block
      const allTestIds = new Set<string>();
      (lc || []).forEach((row: any) => (row.test_ids || []).forEach((tid: string) => allTestIds.add(tid)));
      let testNameMap = new Map<string, string>();
      if (allTestIds.size) {
        const { data: lt } = await supabase
          .from("lab_tests_catalog")
          .select("id, name, short_name")
          .in("id", Array.from(allTestIds));
        (lt || []).forEach((t: any) => testNameMap.set(t.id, t.short_name || t.name));
      }
      const labControl = (lc || []).map((row: any) => ({
        control_point: row.control_point,
        at_day: row.at_day,
        tests: [
          ...((row.test_ids || []).map((tid: string) => testNameMap.get(tid)).filter(Boolean) as string[]),
          ...(row.custom_tests || []),
        ],
        notes: row.notes,
      }));

      await generatePlanDocx({
        plan: {
          id: id || "",
          issued_at: issuedAt,
          duration_days: durationDays,
          diagnosis_short: diagnosis || null,
          clinical_summary: summary || null,
          mode,
          course_number: courseNumber,
          show_cost_in_print: showCostInPrint,
          lab_control_enabled: labControlEnabled,
        },
        patient: { full_name: patient.full_name, birth_date: patient.birth_date },
        patientAge,
        items: items.map(i => ({
          catalog_id: i.catalog_id, section_category: i.section_category,
          name_snapshot: i.name_snapshot, inn_snapshot: i.inn_snapshot,
          dose: i.dose, dose_unit: i.dose_unit,
          dilution_volume: i.dilution_volume, dilution_solvent: i.dilution_solvent,
          frequency: i.frequency, duration_days: i.duration_days, time_of_day: i.time_of_day,
          infusion_rate: i.infusion_rate, route_override: i.route_override,
          notes: i.notes, is_off_label: i.is_off_label, day_pattern: i.day_pattern,
          prn_estimated_doses: (i as any).prn_estimated_doses,
        })),
        labControl,
        catalogMap,
        catalogPatientMap,
      });
      toast({ title: "DOCX скачан" });
    } catch (e: any) {
      toast({ title: "Ошибка экспорта DOCX", description: e.message, variant: "destructive" });
    }
  };

  if (loading || busy) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }
  if (!user) return null;

  const grouped = SECTIONS.map(s => ({ section: s, list: items.filter(i => i.section_category === s.key) }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Link to="/admin/treatment-plans" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4"/>К списку листов
        </Link>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
              {isNew
                ? "Новый лист назначений"
                : <>Лист назначений {courseNumber != null && <span className="text-primary">№ {courseNumber}</span>}</>}
              {!isNew && <Badge variant="outline" className="text-xs">{status === "draft" ? "черновик" : status === "issued" ? "выписан" : "архив"}</Badge>}
            </h1>
            {!isNew && patient && (
              <div className="text-sm text-muted-foreground mt-0.5">
                для {patient.full_name}{patientAge !== null ? `, ${patientAge} г.` : ""}
              </div>
            )}
          </div>

          {/* Desktop toolbar */}
          <div className="hidden lg:flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setApplyOpen(true)} className="gap-2">
              <Download className="w-4 h-4"/>Загрузить из шаблона
            </Button>
            <Button variant="outline" onClick={() => setSaveAsOpen(true)} className="gap-2" disabled={items.length === 0}>
              <BookMarked className="w-4 h-4"/>Сохранить как шаблон
            </Button>
            {!isNew && status === "issued" && (
              <Button variant="outline" onClick={() => setHistoryOpen(true)} className="gap-2">
                <History className="w-4 h-4"/>История
              </Button>
            )}
            {!isNew && (
              <Link to={`/admin/treatment-plans/${id}/print`} target="_blank">
                <Button variant="outline" className="gap-2"><Printer className="w-4 h-4"/>Печать</Button>
              </Link>
            )}
            {!isNew && (
              <Button variant="outline" onClick={exportDocx} className="gap-2" disabled={items.length === 0}>
                <FileDown className="w-4 h-4"/>DOCX
              </Button>
            )}
            {!isNew && (
              <Link to={`/admin/treatment-plans/${id}/memo`} target="_blank">
                <Button variant="outline" className="gap-2"><ClipboardList className="w-4 h-4"/>Памятка</Button>
              </Link>
            )}
            {!isNew && id && patient && (
              <Button variant="outline" onClick={() => setSendMemoOpen(true)} className="gap-2">
                <Send className="w-4 h-4"/>Отправить пациенту
              </Button>
            )}
            <Button variant="outline" onClick={() => setPatternExportOpen(true)} className="gap-2" disabled={items.length === 0}>
              <Share2 className="w-4 h-4"/>Экспорт паттерна
            </Button>
            {!isNew && id && (
              <PublicLinkPopover
                planId={id}
                publicHash={publicHash}
                isPublic={isPublic}
                onChange={(v) => setIsPublic(v.is_public)}
              />
            )}
            <Button onClick={() => save()} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}Сохранить
            </Button>
            {!isNew && status === "draft" && (
              <Button onClick={() => save("issued")} disabled={saving} variant="default">Выписать</Button>
            )}
            {!isNew && (
              <Button onClick={remove} variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4"/></Button>
            )}
          </div>

          {/* Mobile/tablet toolbar: primary actions + dropdown */}
          <div className="flex lg:hidden gap-2 flex-wrap items-center">
            <Button onClick={() => save()} disabled={saving} className="gap-2 min-h-[44px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}Сохранить
            </Button>
            {!isNew && status === "draft" && (
              <Button onClick={() => save("issued")} disabled={saving} variant="default" className="min-h-[44px]">Выписать</Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px] h-11 w-11" aria-label="Меню">
                  <MoreHorizontal className="w-5 h-5"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={() => setApplyOpen(true)} className="gap-2 py-3">
                  <Download className="w-4 h-4"/>Загрузить из шаблона
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSaveAsOpen(true)} disabled={items.length === 0} className="gap-2 py-3">
                  <BookMarked className="w-4 h-4"/>Сохранить как шаблон
                </DropdownMenuItem>
                {!isNew && status === "issued" && (
                  <DropdownMenuItem onClick={() => setHistoryOpen(true)} className="gap-2 py-3">
                    <History className="w-4 h-4"/>История версий
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator/>
                {!isNew && (
                  <DropdownMenuItem onClick={() => window.open(`/admin/treatment-plans/${id}/print`, "_blank")} className="gap-2 py-3">
                    <Printer className="w-4 h-4"/>Печать
                  </DropdownMenuItem>
                )}
                {!isNew && (
                  <DropdownMenuItem onClick={exportDocx} disabled={items.length === 0} className="gap-2 py-3">
                    <FileDown className="w-4 h-4"/>DOCX
                  </DropdownMenuItem>
                )}
                {!isNew && (
                  <DropdownMenuItem onClick={() => window.open(`/admin/treatment-plans/${id}/memo`, "_blank")} className="gap-2 py-3">
                    <ClipboardList className="w-4 h-4"/>Памятка
                  </DropdownMenuItem>
                )}
                {!isNew && id && patient && (
                  <DropdownMenuItem onClick={() => setSendMemoOpen(true)} className="gap-2 py-3">
                    <Send className="w-4 h-4"/>Отправить пациенту
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setPatternExportOpen(true)} disabled={items.length === 0} className="gap-2 py-3">
                  <Share2 className="w-4 h-4"/>Экспорт паттерна
                </DropdownMenuItem>
                {!isNew && (
                  <>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem onClick={remove} className="gap-2 py-3 text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4"/>Удалить лист
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {!isNew && id && (
              <div className="w-full">
                <PublicLinkPopover
                  planId={id}
                  publicHash={publicHash}
                  isPublic={isPublic}
                  onChange={(v) => setIsPublic(v.is_public)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Header form */}
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <PatientSelect selectedPatient={patient} onSelect={setPatient} />
            <div className="grid md:grid-cols-5 gap-3">
              <div>
                <Label>Дата выписки</Label>
                <Input type="date" value={issuedAt} onChange={e=>setIssuedAt(e.target.value)}/>
              </div>
              <div>
                <Label>№ курса</Label>
                <Input type="number" min={1} value={courseNumber ?? ""} placeholder="авто"
                  onChange={e=>setCourseNumber(e.target.value === "" ? null : Number(e.target.value))}/>
              </div>
              <div>
                <Label>Длительность (дней)</Label>
                <Input type="number" min={1} max={180} value={durationDays} onChange={e=>setDurationDays(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}/>
              </div>
              <div>
                <Label>Диагноз / МКБ-10</Label>
                <Input value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} placeholder="E29.1; N50.1"/>
              </div>
              <div>
                <Label>Режим</Label>
                <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={toggleMode}>
                  {mode === "flat" ? <><List className="w-4 h-4"/>Плоский</> : <><CalendarDays className="w-4 h-4"/>По дням</>}
                </Button>
              </div>
            </div>
            <div>
              <Label>Клиническое обоснование</Label>
              <Textarea value={summary} onChange={e=>setSummary(e.target.value)} rows={3} placeholder="Краткое обоснование курса (печатается курсивом перед назначениями)..."/>
            </div>
          </CardContent>
        </Card>

        {mode === "scheduled" && (
          <div className="mb-3 space-y-2">
            <ScheduledSummary items={items} durationDays={durationDays}/>
            <Card><GanttHeader duration={durationDays} items={items} onBulkUpdate={bulkUpdate}/></Card>
          </div>
        )}

        {/* Sections */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <div className="space-y-3">
            {grouped.map(({ section, list }) => {
              const Icon = section.icon;
              const empty = list.length === 0;
              return (
                <Card key={section.key} className={empty ? "opacity-70" : ""}>
                  <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${empty ? "text-muted-foreground" : "text-primary"}`}/>
                      {section.label}
                      {!empty && <Badge variant="secondary" className="text-xs">{list.length}</Badge>}
                      {section.hint && <span className="text-xs text-muted-foreground font-normal">— {section.hint}</span>}
                    </CardTitle>
                    <CatalogPicker section={section.key} allowAllCategories={section.key === "peptide"} onPick={(c) => addItem(section.key, c)}/>
                  </CardHeader>
                  {!empty && (
                    <CardContent className="pt-0 pb-3 px-4 space-y-2">
                      <SortableContext items={list.map(i => i.client_id)} strategy={verticalListSortingStrategy}>
                        {list.map(it => (
                          <PlanItemRow
                            key={it.client_id} item={it} mode={mode} courseDuration={durationDays} sortable
                            update={(p) => updateItem(it.client_id, p)}
                            remove={() => removeItem(it.client_id)}
                            duplicateInn={!!it.inn_snapshot && (innCounts.get(it.inn_snapshot) || 0) > 1}
                          />
                        ))}
                      </SortableContext>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </DndContext>

        <div className="mt-4 space-y-3">
          <LabControlSection
            enabled={labControlEnabled}
            onEnabledChange={setLabControlEnabled}
            points={labPoints}
            onChange={setLabPoints}
          />
          <PlanCostBlock
            items={items}
            durationDays={durationDays}
            mode={mode}
            showInPrint={showCostInPrint}
            onShowInPrintChange={setShowCostInPrint}
            onTotalChange={setCurrentTotalCost}
          />
        </div>

        <PatternExportDialog
          open={patternExportOpen}
          onOpenChange={setPatternExportOpen}
          items={items}
          durationDays={durationDays}
          totalCost={currentTotalCost}
          lab={labControlEnabled ? labPoints.map(p => ({ control_point: p.control_point, at_day: p.at_day })) : []}
          clinicalSummary={summary}
          profile={{ sex: patient?.sex, age: patientAge, diagnosisShort: diagnosis }}
        />

        {!isNew && id && (
          <SendMemoDialog
            open={sendMemoOpen}
            onOpenChange={setSendMemoOpen}
            planId={id}
            publicHash={publicHash}
            durationDays={durationDays}
            patient={patient ? { full_name: patient.full_name, email: (patient as any).email, telegram_username: (patient as any).telegram_username } : null}
          />
        )}

        <ApplyTemplateDialog
          open={applyOpen} onOpenChange={setApplyOpen}
          currentItemsCount={items.length} currentMode={mode} currentDuration={durationDays}
          onApply={applyTemplate}
        />
        <SaveAsTemplateDialog
          open={saveAsOpen} onOpenChange={setSaveAsOpen}
          items={items} mode={mode} durationDays={durationDays} userId={user.id}
        />
        {!isNew && id && (
          <PlanVersionHistoryDrawer
            open={historyOpen} onOpenChange={setHistoryOpen}
            planId={id} userId={user.id}
          />
        )}
      </div>
    </div>
  );
}
