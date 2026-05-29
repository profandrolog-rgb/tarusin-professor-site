import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Printer, Trash2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { PROTOCOL_TYPE_MAP, ProtocolType } from "@/lib/visits/protocolTypes";
import { ProtocolForm } from "@/components/visits/ProtocolForm";
import { IcdAutocomplete } from "@/components/visits/IcdAutocomplete";
import { useAutoSave } from "@/hooks/useAutoSave";

interface Visit {
  id: string;
  patient_id: string;
  visit_date: string;
  protocol_type: ProtocolType;
  protocol_data: any;
  diagnosis: string | null;
  icd_code: string | null;
  next_visit_date: string | null;
  patient: { id: string; full_name: string; history_number: string | null; birth_date: string } | null;
}

export default function AdminPatientVisitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, isSurgeon } = useAuth();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!authLoading && user && !isAdmin && !isSurgeon) navigate("/");
  }, [authLoading, user, isAdmin, isSurgeon, navigate]);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("patient_visits")
      .select("*, patient:patients(id, full_name, history_number, birth_date)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
        setVisit(data as any);
        setLoading(false);
      });
  }, [id]);

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
    else { clearDraft(); toast({ title: "Сохранено" }); }
  };

  // Autosave draft (visit metadata + protocol data) every 3 minutes
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

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!visit) return <div className="p-8 text-center">Визит не найден</div>;

  const def = PROTOCOL_TYPE_MAP[visit.protocol_type];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/visits"><ArrowLeft className="h-4 w-4 mr-1" /> К журналу</Link>
            </Button>
            <h1 className="text-2xl font-bold">{def?.title || visit.protocol_type}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/admin/visits/${visit.id}/print`}><Printer className="h-4 w-4 mr-1" /> Печать</Link>
            </Button>
            <Button variant="outline" onClick={handleDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-1" /> Удалить
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Сохранить
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Пациент</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div><span className="text-muted-foreground">ФИО:</span> {visit.patient?.full_name}</div>
            <div><span className="text-muted-foreground">№ ИБ:</span> <span className="font-mono">{visit.patient?.history_number || "—"}</span></div>
            <div><span className="text-muted-foreground">Дата рождения:</span> {visit.patient?.birth_date ? format(new Date(visit.patient.birth_date), "dd.MM.yyyy") : "—"}</div>
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
          <CardHeader>
            <CardTitle className="text-base">Содержание протокола</CardTitle>
          </CardHeader>
          <CardContent>
            <ProtocolForm
              type={visit.protocol_type}
              data={visit.protocol_data}
              onChange={(d) => update({ protocol_data: d })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
