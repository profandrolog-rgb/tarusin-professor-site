import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Save, Loader2, Trash2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { PatientSelect } from "@/components/prescriptions/PatientSelect";
import { calculateAge } from "@/utils/anthropometry/who-reference";
import { getTesticularVolumeNorm } from "@/utils/lab-reference-ranges";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Patient {
  id: string;
  full_name: string;
  birth_date: string;
}

const ECHOSTRUCTURE_OPTIONS = [
  { value: "homogeneous", label: "Однородная" },
  { value: "heterogeneous", label: "Неоднородная" },
  { value: "hyperechoic_foci", label: "Гиперэхогенные включения" },
  { value: "hypoechoic_area", label: "Гипоэхогенный участок" },
  { value: "microlithiasis", label: "Микролитиаз" },
  { value: "calcification", label: "Кальцинат" },
];

const VARICOCELE_GRADES = [
  { value: "0", label: "0 — Нет" },
  { value: "1", label: "I — Субклиническое (только при Вальсальве на УЗИ)" },
  { value: "2", label: "II — Пальпируется при Вальсальве" },
  { value: "3", label: "III — Видно визуально" },
];

function calcVolume(l?: number, w?: number, d?: number): number | null {
  if (!l || !w || !d) return null;
  return Math.round(l * w * d * 0.523 * 100) / 100; // Ellipsoid formula
}

function calcProstateVolume(l?: number, w?: number, d?: number): number | null {
  if (!l || !w || !d) return null;
  return Math.round(l * w * d * 0.523 * 100) / 100;
}

export function UltrasoundPanel() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [examDate, setExamDate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);
  const [subTab, setSubTab] = useState("input");
  const [history, setHistory] = useState<any[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<Record<string, any>>({});
  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));
  const numVal = (field: string) => form[field] ? parseFloat(form[field]) : undefined;

  const ageYears = patient ? calculateAge(new Date(patient.birth_date), examDate).years : 0;
  const volumeNorm = getTesticularVolumeNorm(ageYears);

  // Auto-calculate volumes
  const rightTestisVol = calcVolume(numVal("right_testis_length"), numVal("right_testis_width"), numVal("right_testis_depth"));
  const leftTestisVol = calcVolume(numVal("left_testis_length"), numVal("left_testis_width"), numVal("left_testis_depth"));
  const prostateVol = calcProstateVolume(numVal("prostate_length"), numVal("prostate_width"), numVal("prostate_depth"));

  const handleSave = async () => {
    if (!patient) { toast.error("Выберите пациента"); return; }
    setSaving(true);
    try {
      const row: any = {
        patient_id: patient.id,
        exam_date: format(examDate, "yyyy-MM-dd"),
        right_testis_length: numVal("right_testis_length") ?? null,
        right_testis_width: numVal("right_testis_width") ?? null,
        right_testis_depth: numVal("right_testis_depth") ?? null,
        right_testis_volume: rightTestisVol,
        left_testis_length: numVal("left_testis_length") ?? null,
        left_testis_width: numVal("left_testis_width") ?? null,
        left_testis_depth: numVal("left_testis_depth") ?? null,
        left_testis_volume: leftTestisVol,
        right_testis_echostructure: form.right_testis_echostructure || null,
        left_testis_echostructure: form.left_testis_echostructure || null,
        right_epididymis_head: numVal("right_epididymis_head") ?? null,
        left_epididymis_head: numVal("left_epididymis_head") ?? null,
        right_epididymis_notes: form.right_epididymis_notes || null,
        left_epididymis_notes: form.left_epididymis_notes || null,
        right_spermatic_vein_diameter: numVal("right_spermatic_vein_diameter") ?? null,
        left_spermatic_vein_diameter: numVal("left_spermatic_vein_diameter") ?? null,
        right_varicocele_grade: form.right_varicocele_grade ? parseInt(form.right_varicocele_grade) : null,
        left_varicocele_grade: form.left_varicocele_grade ? parseInt(form.left_varicocele_grade) : null,
        valsalva_reflux_right: form.valsalva_reflux_right ?? false,
        valsalva_reflux_left: form.valsalva_reflux_left ?? false,
        prostate_length: numVal("prostate_length") ?? null,
        prostate_width: numVal("prostate_width") ?? null,
        prostate_depth: numVal("prostate_depth") ?? null,
        prostate_volume: prostateVol,
        prostate_echostructure: form.prostate_echostructure || null,
        penile_length: numVal("penile_length") ?? null,
        penile_stretched_length: numVal("penile_stretched_length") ?? null,
        right_hydrocele: form.right_hydrocele ?? false,
        left_hydrocele: form.left_hydrocele ?? false,
        hydrocele_volume_right: numVal("hydrocele_volume_right") ?? null,
        hydrocele_volume_left: numVal("hydrocele_volume_left") ?? null,
        right_inguinal_canal: form.right_inguinal_canal || null,
        left_inguinal_canal: form.left_inguinal_canal || null,
        bladder_volume: numVal("bladder_volume") ?? null,
        residual_urine: numVal("residual_urine") ?? null,
        bladder_wall_thickness: numVal("bladder_wall_thickness") ?? null,
        right_kidney_length: numVal("right_kidney_length") ?? null,
        left_kidney_length: numVal("left_kidney_length") ?? null,
        right_kidney_notes: form.right_kidney_notes || null,
        left_kidney_notes: form.left_kidney_notes || null,
        conclusion: form.conclusion || null,
        notes: form.notes || null,
      };
      const { error } = await supabase.from("ultrasound_results").insert(row);
      if (error) throw error;
      toast.success("УЗИ сохранено");
      setForm({});
      if (subTab === "history") fetchHistory();
    } catch (err: any) {
      toast.error("Ошибка: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const fetchHistory = async () => {
    if (!patient) return;
    setHistLoading(true);
    const { data } = await supabase
      .from("ultrasound_results")
      .select("*")
      .eq("patient_id", patient.id)
      .order("exam_date", { ascending: false });
    setHistory(data || []);
    setHistLoading(false);
  };

  useEffect(() => {
    if (patient && subTab === "history") fetchHistory();
  }, [patient, subTab]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("ultrasound_results").delete().eq("id", deleteId);
    if (error) toast.error("Ошибка");
    else { toast.success("Удалено"); fetchHistory(); }
    setDeleteId(null);
  };

  const MeasurementInput = ({ label, field, unit = "мм", step = "0.1" }: { label: string; field: string; unit?: string; step?: string }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label} ({unit})</Label>
      <Input type="number" step={step} min="0" value={form[field] || ""} onChange={(e) => update(field, e.target.value)} placeholder="—" className="h-8 text-sm" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PatientSelect selectedPatient={patient} onSelect={setPatient} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Дата исследования</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left text-sm">
                <CalendarIcon className="mr-1 h-3 w-3" />
                {format(examDate, "dd.MM.yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={examDate} onSelect={(d) => d && setExamDate(d)} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {patient && (
        <div className="text-sm text-muted-foreground">
          Возраст: <span className="font-medium text-foreground">{calculateAge(new Date(patient.birth_date), examDate).text}</span>
          {volumeNorm && (
            <span> · Норма объёма яичка: {volumeNorm.min}–{volumeNorm.max} мл (медиана {volumeNorm.median})</span>
          )}
        </div>
      )}

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList>
          <TabsTrigger value="input">Ввод данных</TabsTrigger>
          <TabsTrigger value="history" disabled={!patient}>История</TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ЯИЧКИ */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Яичко правое</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <MeasurementInput label="Длина" field="right_testis_length" />
                  <MeasurementInput label="Ширина" field="right_testis_width" />
                  <MeasurementInput label="Толщина" field="right_testis_depth" />
                </div>
                {rightTestisVol && (
                  <div className={cn(
                    "text-sm p-2 rounded",
                    volumeNorm && (rightTestisVol < volumeNorm.min || rightTestisVol > volumeNorm.max) ? "bg-destructive/10 text-destructive" : "bg-accent/50"
                  )}>
                    Объём: <span className="font-bold">{rightTestisVol} мл</span>
                    {volumeNorm && <span className="text-xs ml-2">(норма {volumeNorm.min}–{volumeNorm.max})</span>}
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Эхоструктура</Label>
                  <Select value={form.right_testis_echostructure || ""} onValueChange={(v) => update("right_testis_echostructure", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{ECHOSTRUCTURE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Яичко левое</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <MeasurementInput label="Длина" field="left_testis_length" />
                  <MeasurementInput label="Ширина" field="left_testis_width" />
                  <MeasurementInput label="Толщина" field="left_testis_depth" />
                </div>
                {leftTestisVol && (
                  <div className={cn(
                    "text-sm p-2 rounded",
                    volumeNorm && (leftTestisVol < volumeNorm.min || leftTestisVol > volumeNorm.max) ? "bg-destructive/10 text-destructive" : "bg-accent/50"
                  )}>
                    Объём: <span className="font-bold">{leftTestisVol} мл</span>
                    {volumeNorm && <span className="text-xs ml-2">(норма {volumeNorm.min}–{volumeNorm.max})</span>}
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Эхоструктура</Label>
                  <Select value={form.left_testis_echostructure || ""} onValueChange={(v) => update("left_testis_echostructure", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{ECHOSTRUCTURE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* ПРИДАТКИ */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Придатки яичек</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <MeasurementInput label="Головка правого" field="right_epididymis_head" />
                  <MeasurementInput label="Головка левого" field="left_epididymis_head" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Примечание (правый)</Label>
                    <Input value={form.right_epididymis_notes || ""} onChange={(e) => update("right_epididymis_notes", e.target.value)} className="h-8 text-sm" placeholder="—" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Примечание (левый)</Label>
                    <Input value={form.left_epididymis_notes || ""} onChange={(e) => update("left_epididymis_notes", e.target.value)} className="h-8 text-sm" placeholder="—" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ВАРИКОЦЕЛЕ */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Семенной канатик / Варикоцеле</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <MeasurementInput label="Вена справа ∅" field="right_spermatic_vein_diameter" />
                  <MeasurementInput label="Вена слева ∅" field="left_spermatic_vein_diameter" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Варикоцеле справа</Label>
                    <Select value={form.right_varicocele_grade || ""} onValueChange={(v) => update("right_varicocele_grade", v)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{VARICOCELE_GRADES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Варикоцеле слева</Label>
                    <Select value={form.left_varicocele_grade || ""} onValueChange={(v) => update("left_varicocele_grade", v)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{VARICOCELE_GRADES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.valsalva_reflux_right || false} onCheckedChange={(v) => update("valsalva_reflux_right", v)} />
                    <Label className="text-xs">Рефлюкс при Вальсальве (пр.)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.valsalva_reflux_left || false} onCheckedChange={(v) => update("valsalva_reflux_left", v)} />
                    <Label className="text-xs">Рефлюкс при Вальсальве (лев.)</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ПРОСТАТА */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Предстательная железа</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <MeasurementInput label="Длина" field="prostate_length" />
                  <MeasurementInput label="Ширина" field="prostate_width" />
                  <MeasurementInput label="Толщина" field="prostate_depth" />
                </div>
                {prostateVol && (
                  <div className="text-sm p-2 rounded bg-accent/50">
                    Объём: <span className="font-bold">{prostateVol} мл</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ПОЛОВОЙ ЧЛЕН */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Половой член</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <MeasurementInput label="Длина" field="penile_length" />
                  <MeasurementInput label="Растянутая длина" field="penile_stretched_length" />
                </div>
              </CardContent>
            </Card>

            {/* ГИДРОЦЕЛЕ */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Гидроцеле</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.right_hydrocele || false} onCheckedChange={(v) => update("right_hydrocele", v)} />
                    <Label className="text-xs">Справа</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.left_hydrocele || false} onCheckedChange={(v) => update("left_hydrocele", v)} />
                    <Label className="text-xs">Слева</Label>
                  </div>
                </div>
                {(form.right_hydrocele || form.left_hydrocele) && (
                  <div className="grid grid-cols-2 gap-3">
                    {form.right_hydrocele && <MeasurementInput label="Объём (пр.)" field="hydrocele_volume_right" unit="мл" />}
                    {form.left_hydrocele && <MeasurementInput label="Объём (лев.)" field="hydrocele_volume_left" unit="мл" />}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* МОЧЕВОЙ ПУЗЫРЬ И ПОЧКИ */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Мочевой пузырь / Почки</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <MeasurementInput label="Объём пузыря" field="bladder_volume" unit="мл" />
                  <MeasurementInput label="Остаточная моча" field="residual_urine" unit="мл" />
                  <MeasurementInput label="Толщина стенки" field="bladder_wall_thickness" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MeasurementInput label="Почка правая (длина)" field="right_kidney_length" />
                  <MeasurementInput label="Почка левая (длина)" field="left_kidney_length" />
                </div>
              </CardContent>
            </Card>

            {/* ЗАКЛЮЧЕНИЕ */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-base">Заключение</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea value={form.conclusion || ""} onChange={(e) => update("conclusion", e.target.value)} placeholder="Заключение УЗИ..." rows={3} />
                <Textarea value={form.notes || ""} onChange={(e) => update("notes", e.target.value)} placeholder="Дополнительные примечания..." rows={2} />
              </CardContent>
            </Card>
          </div>

          <Button onClick={handleSave} disabled={saving || !patient} className="w-full mt-4">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Сохранение..." : "Сохранить результаты УЗИ"}
          </Button>
        </TabsContent>

        <TabsContent value="history">
          {histLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : history.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Нет сохранённых УЗИ</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {history.map((u: any) => (
                <Card key={u.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-medium">{format(new Date(u.exam_date), "dd.MM.yyyy")}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(u.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {u.right_testis_volume && (
                        <div className="p-2 bg-secondary/30 rounded">
                          <span className="text-muted-foreground text-xs">Яичко (пр.)</span>
                          <div className="font-medium">{u.right_testis_volume} мл</div>
                        </div>
                      )}
                      {u.left_testis_volume && (
                        <div className="p-2 bg-secondary/30 rounded">
                          <span className="text-muted-foreground text-xs">Яичко (лев.)</span>
                          <div className="font-medium">{u.left_testis_volume} мл</div>
                        </div>
                      )}
                      {u.prostate_volume && (
                        <div className="p-2 bg-secondary/30 rounded">
                          <span className="text-muted-foreground text-xs">Простата</span>
                          <div className="font-medium">{u.prostate_volume} мл</div>
                        </div>
                      )}
                      {u.penile_length && (
                        <div className="p-2 bg-secondary/30 rounded">
                          <span className="text-muted-foreground text-xs">Длина п/ч</span>
                          <div className="font-medium">{u.penile_length} мм</div>
                        </div>
                      )}
                      {(u.left_varicocele_grade != null && u.left_varicocele_grade > 0) && (
                        <div className="p-2 bg-amber-50 rounded border border-amber-200">
                          <span className="text-muted-foreground text-xs">Варикоцеле (лев.)</span>
                          <div className="font-medium">Степень {u.left_varicocele_grade}</div>
                        </div>
                      )}
                    </div>
                    {u.conclusion && (
                      <p className="text-sm mt-2 text-muted-foreground"><span className="font-medium text-foreground">Заключение:</span> {u.conclusion}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить результат УЗИ?</AlertDialogTitle>
            <AlertDialogDescription>Это действие необратимо.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
