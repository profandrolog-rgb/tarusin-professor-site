import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Printer, FileDown } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import {
  buildMemoGroups, generateMemoDocx, memoReadiness,
  type DocxPlanItem,
} from "@/lib/treatment/docxExport";
import {
  calculatePlanCost, formatRub, type CostCatalog, type CostItemInput,
} from "@/lib/treatment/cost";

export default function TreatmentPlanMemo() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(true);
  const [plan, setPlan] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [items, setItems] = useState<DocxPlanItem[]>([]);
  const [showCost, setShowCost] = useState(false);
  const [catalogMap, setCatalogMap] = useState<Map<string, CostCatalog>>(new Map());
  const [catalogPatientMap, setCatalogPatientMap] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth", { state: { from: `/admin/treatment-plans/${id}/memo` } });
  }, [user, isAdmin, loading, id, navigate]);

  useEffect(() => {
    (async () => {
      setBusy(true);
      const { data: p } = await supabase.from("treatment_plans")
        .select("*, patient:patients(*)").eq("id", id!).maybeSingle();
      if (!p) { setBusy(false); return; }
      setPlan(p);
      setPatient((p as any).patient);
      setShowCost(!!(p as any).show_cost_in_memo);
      const { data: rows } = await supabase.from("treatment_plan_items")
        .select("*").eq("plan_id", id!).order("section_category").order("order_index");
      setItems((rows as any) || []);
      const catIds = Array.from(new Set((rows || []).map((r: any) => r.catalog_id).filter(Boolean) as string[]));
      if (catIds.length) {
        const { data: cat } = await supabase
          .from("treatment_catalog")
          .select("id, price_override, pack_size_num, units_per_dose_num, patient_info, price_auto, price_auto_updated_at, price_updated_at, price_source_preference")
          .in("id", catIds);
        const m = new Map<string, CostCatalog>();
        const mp = new Map<string, any>();
        (cat || []).forEach((c: any) => {
          m.set(c.id, c);
          if (c.patient_info && typeof c.patient_info === "object") mp.set(c.id, c.patient_info);
        });
        setCatalogMap(m);
        setCatalogPatientMap(mp);
      }
      setBusy(false);
    })();
  }, [id]);

  const groups = useMemo(
    () => buildMemoGroups(items, catalogPatientMap),
    [items, catalogPatientMap],
  );

  const breakdown = useMemo(() => {
    if (!plan) return null;
    const input: Array<CostItemInput & { name_snapshot: string }> = items.map(it => ({
      catalog_id: it.catalog_id, section_category: it.section_category,
      frequency: it.frequency, day_pattern: it.day_pattern,
      duration_days: it.duration_days, prn_estimated_doses: it.prn_estimated_doses,
      name_snapshot: it.name_snapshot,
    }));
    return calculatePlanCost(input, catalogMap, plan.duration_days, (plan.mode as any) || "flat");
  }, [items, catalogMap, plan]);

  const readiness = useMemo(() => memoReadiness(items, catalogPatientMap), [items, catalogPatientMap]);

  const onToggleCost = async (v: boolean) => {
    setShowCost(v);
    await supabase.from("treatment_plans").update({ show_cost_in_memo: v } as any).eq("id", id!);
  };

  const onExportDocx = async () => {
    if (!plan) return;
    try {
      await generateMemoDocx(
        {
          plan, patient,
          patientAge: null,
          items,
          catalogMap, catalogPatientMap,
        } as any,
        { showCost, costBreakdownTotal: breakdown?.total ?? null },
      );
      toast({ title: "DOCX памятки скачан" });
    } catch (e: any) {
      toast({ title: "Ошибка экспорта", description: e.message, variant: "destructive" });
    }
  };

  if (busy || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }
  if (!plan) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Лист назначений не найден</div>;
  }

  const date = new Date(plan.issued_at);

  return (
    <div className="bg-muted/30 min-h-screen py-6 print:bg-white print:py-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .memo-page { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 15mm !important; }
          @page { size: A4 portrait; margin: 15mm; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 flex items-center justify-between flex-wrap gap-2 px-4">
        <Link to={`/admin/treatment-plans/${id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4"/>К листу назначений
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={showCost} onCheckedChange={(v) => onToggleCost(!!v)}/>
            Включить стоимость в памятку
          </label>
          <ReadinessBadge readiness={readiness}/>
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4"/>Печать / PDF
          </Button>
          <Button onClick={onExportDocx} className="gap-2">
            <FileDown className="w-4 h-4"/>Скачать DOCX
          </Button>
        </div>
      </div>

      {/* Memo page */}
      <Card className="memo-page bg-white text-black mx-auto shadow-lg" style={{ width: "210mm", minHeight: "297mm" }}>
        <CardContent className="p-10" style={{ fontFamily: "Times New Roman, serif", fontSize: "12pt", lineHeight: 1.55 }}>
          <h1 className="text-center font-bold tracking-wide" style={{ fontSize: "20pt", marginBottom: "4mm" }}>
            ПАМЯТКА ПАЦИЕНТУ
          </h1>
          <p className="text-center italic text-muted-foreground" style={{ fontSize: "11pt", color: "#555" }}>
            для <b style={{ color: "#000" }}>{patient?.full_name || "—"}</b> · курс {plan.duration_days} дней ·{" "}
            {format(date, "d MMMM yyyy 'г.'", { locale: ru })}
          </p>
          <p className="text-center italic" style={{ color: "#555", fontSize: "10.5pt", marginTop: "2mm", marginBottom: "8mm" }}>
            Это пояснение к листу назначений простым языком. Если что-то непонятно — звоните или пишите перед началом курса.
          </p>

          {groups.length === 0 && (
            <p className="text-center italic" style={{ color: "#888" }}>
              Памятка пуста — для всех позиций установлен признак «скрыто от памятки» или лист ещё не заполнен.
            </p>
          )}

          {groups.map(g => (
            <section key={g.label} style={{ marginBottom: "6mm", breakInside: "avoid" }}>
              <h2 className="font-bold uppercase tracking-wider" style={{ fontSize: "12pt", marginBottom: "2mm", borderBottom: "1px solid #ccc", paddingBottom: "1mm" }}>
                {g.emoji} {g.label}
              </h2>
              <ul style={{ paddingLeft: "6mm", margin: 0 }}>
                {g.items.map((it, i) => (
                  <li key={i} style={{ marginBottom: "2mm" }}>
                    <b>{it.name}</b>
                    {it.description ? <span> — {it.description}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {showCost && breakdown && breakdown.total > 0 && (
            <section style={{ marginTop: "6mm", breakInside: "avoid" }}>
              <h2 className="font-bold uppercase tracking-wider" style={{ fontSize: "12pt", marginBottom: "2mm", borderBottom: "1px solid #ccc", paddingBottom: "1mm" }}>
                💰 Ориентировочная стоимость курса
              </h2>
              <p style={{ marginTop: "2mm" }}>
                {formatRub(breakdown.total)} (±15–20%, без стоимости процедур и услуг клиники).
              </p>
            </section>
          )}

          <p className="italic" style={{ marginTop: "10mm", color: "#444", fontSize: "10pt" }}>
            Памятка не заменяет лист назначений и консультацию врача. Все вопросы — на приёме или по телефону.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ReadinessBadge({ readiness }: { readiness: ReturnType<typeof memoReadiness> }) {
  const cfg = readiness.state === "complete"
    ? { dot: "bg-emerald-500", label: "готова" }
    : readiness.state === "partial"
      ? { dot: "bg-amber-500", label: "частично" }
      : { dot: "bg-red-500", label: "много пропусков" };
  return (
    <span
      title={`Памятка: заполнено ${readiness.filled} из ${readiness.total}`}
      className="inline-flex items-center gap-2 text-xs text-muted-foreground"
    >
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${cfg.dot}`}/>
      Памятка: {cfg.label} ({readiness.filled}/{readiness.total})
    </span>
  );
}
