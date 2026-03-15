import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Save, Calculator, TrendingUp, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { PatientSelect } from "@/components/prescriptions/PatientSelect";
import { calculateAnthropometry, type AnthropometryResult } from "@/utils/anthropometry/who-reference";
import { AnthropometryHistory } from "./AnthropometryHistory";
import { GrowthCharts } from "./GrowthCharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  full_name: string;
  birth_date: string;
}

const TANNER_DESCRIPTIONS: Record<number, string> = {
  1: "Препубертат",
  2: "Начало пубертата",
  3: "Средний пубертат",
  4: "Поздний пубертат",
  5: "Взрослый тип",
};

/**
 * Russian shoe size = foot length (cm) * 1.5 + 1.5 (метрическая система / штихмассовая)
 * Российский размер ≈ (длина стопы мм / 6.67) rounded, or commonly: (footCm - 1.5) * 1.5
 * Standard: размер = длина стопы (см) * 1.5 (штихмассовая система)
 */
function getRussianShoeSize(footCm: number): number {
  // Штихмассовая система (Россия/Европа): размер = длина колодки / 0.667 см
  // Приближённо: размер = footCm * 1.5 + 1.5 (запас на колодку)
  return Math.round(footCm * 1.5 + 1.5);
}

/** Нормы длины стопы по возрасту (см), приблизительные средние значения */
function getFootNorm(ageMonths: number): string {
  const norms: { maxMonths: number; size: string }[] = [
    { maxMonths: 6, size: "9–10 см (р. 16)" },
    { maxMonths: 12, size: "11–12 см (р. 18–19)" },
    { maxMonths: 18, size: "12–13 см (р. 20–21)" },
    { maxMonths: 24, size: "13–14 см (р. 22–23)" },
    { maxMonths: 36, size: "14–15 см (р. 23–25)" },
    { maxMonths: 48, size: "16–17 см (р. 26–27)" },
    { maxMonths: 60, size: "17–18 см (р. 27–29)" },
    { maxMonths: 72, size: "18–19 см (р. 29–30)" },
    { maxMonths: 84, size: "19–20 см (р. 30–32)" },
    { maxMonths: 96, size: "20–21 см (р. 32–33)" },
    { maxMonths: 108, size: "21–22 см (р. 33–34)" },
    { maxMonths: 120, size: "22–23 см (р. 34–36)" },
    { maxMonths: 144, size: "23–25 см (р. 36–38)" },
    { maxMonths: 168, size: "25–27 см (р. 38–41)" },
    { maxMonths: 216, size: "26–29 см (р. 40–44)" },
  ];
  for (const n of norms) {
    if (ageMonths <= n.maxMonths) return n.size;
  }
  return "27–30 см (р. 42–46)";
}

export function AnthropometryCalculator() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [measurementDate, setMeasurementDate] = useState<Date>(new Date());
  const [sex, setSex] = useState<"male" | "female">("male");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [headCircumference, setHeadCircumference] = useState("");
  const [waistCircumference, setWaistCircumference] = useState("");
  const [tannerStage, setTannerStage] = useState<string>("");
  const [footLength, setFootLength] = useState("");
  const [penileLength, setPenileLength] = useState("");
  const [penileCircumference, setPenileCircumference] = useState("");
  const [result, setResult] = useState<AnthropometryResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("calculator");

  // Auto-calculate when inputs change
  useEffect(() => {
    if (!patient) { setResult(null); return; }
    const birthDate = new Date(patient.birth_date);
    const w = parseFloat(weight) || undefined;
    const h = parseFloat(height) || undefined;
    const hc = parseFloat(headCircumference) || undefined;
    const wc = parseFloat(waistCircumference) || undefined;

    if (!w && !h) { setResult(null); return; }

    const res = calculateAnthropometry({
      birthDate,
      measurementDate,
      sex,
      weight: w,
      height: h,
      headCircumference: hc,
      waistCircumference: wc,
    });
    setResult(res);
  }, [patient, measurementDate, sex, weight, height, headCircumference, waistCircumference]);

  const handleSave = async () => {
    if (!patient || !result) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("anthropometry_measurements")
        .insert({
          patient_id: patient.id,
          measurement_date: format(measurementDate, "yyyy-MM-dd"),
          age_months: result.ageMonths,
          sex,
          weight_kg: parseFloat(weight) || null,
          height_cm: parseFloat(height) || null,
          head_circumference_cm: parseFloat(headCircumference) || null,
          waist_circumference_cm: parseFloat(waistCircumference) || null,
          tanner_stage: tannerStage ? parseInt(tannerStage) : null,
          bmi: result.bmi,
          bsa: result.bsa,
          waist_height_ratio: result.waistHeightRatio,
          weight_z_score: result.weightZScore,
          height_z_score: result.heightZScore,
          bmi_z_score: result.bmiZScore,
          head_z_score: result.headZScore,
          weight_percentile: result.weightPercentile,
          height_percentile: result.heightPercentile,
          bmi_percentile: result.bmiPercentile,
          head_percentile: result.headPercentile,
          physical_development: result.physicalDevelopment,
          harmony: result.harmony,
          reference_standard: "WHO",
          notes: notes || null,
          foot_length_cm: parseFloat(footLength) || null,
          shoe_size_ru: footLength ? getRussianShoeSize(parseFloat(footLength)) : null,
        } as any);

      if (error) throw error;
      toast.success("Измерение сохранено");
    } catch (err: any) {
      toast.error("Ошибка сохранения: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getZBadge = (z: number | null, label: string) => {
    if (z === null) return null;
    let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
    let icon = <CheckCircle2 className="h-3 w-3" />;
    if (z < -2 || z > 2) { variant = "destructive"; icon = <AlertTriangle className="h-3 w-3" />; }
    else if (z < -1 || z > 1) { variant = "outline"; icon = <Info className="h-3 w-3" />; }
    return (
      <Badge variant={variant} className="gap-1">
        {icon} {label}: Z={z.toFixed(2)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="calculator"><Calculator className="h-4 w-4 mr-1" /> Калькулятор</TabsTrigger>
          <TabsTrigger value="trends" disabled={!patient}><TrendingUp className="h-4 w-4 mr-1" /> Тренды</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Антропометрия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PatientSelect selectedPatient={patient} onSelect={setPatient} />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Дата измерения</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(measurementDate, "dd.MM.yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={measurementDate} onSelect={(d) => d && setMeasurementDate(d)} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Пол</Label>
                    <Select value={sex} onValueChange={(v) => setSex(v as "male" | "female")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Мужской</SelectItem>
                        <SelectItem value="female">Женский</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {patient && (
                  <div className="p-3 rounded-lg bg-accent/50 text-sm">
                    <span className="font-medium">Возраст: </span>
                    {result?.ageText ?? "введите данные"}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Масса тела (кг)</Label>
                    <Input type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="12.5" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Рост (см)</Label>
                    <Input type="number" step="0.1" min="0" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="85.0" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Окружность головы (см)</Label>
                    <Input type="number" step="0.1" min="0" value={headCircumference} onChange={(e) => setHeadCircumference(e.target.value)} placeholder="46.0" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Окружность талии (см)</Label>
                    <Input type="number" step="0.1" min="0" value={waistCircumference} onChange={(e) => setWaistCircumference(e.target.value)} placeholder="50.0" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Длина стопы (см)</Label>
                    <Input type="number" step="0.1" min="0" value={footLength} onChange={(e) => setFootLength(e.target.value)} placeholder="22.0" />
                  </div>
                </div>

                {footLength && parseFloat(footLength) > 0 && (
                  <div className="p-3 rounded-lg bg-accent/50 text-sm">
                    <span className="font-medium">Размер обуви (РФ): </span>
                    {getRussianShoeSize(parseFloat(footLength))}
                    <span className="text-muted-foreground ml-2">
                      (норма для {result?.ageText ?? "—"}: {result ? getFootNorm(result.ageMonths) : "—"})
                    </span>
                  </div>
                )}

                {sex === "male" && (
                  <>
                    <div className="border-t pt-3 mt-2">
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Половой член (антропометрия)</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Длина (см)</Label>
                          <Input type="number" step="0.1" min="0" value={penileLength} onChange={(e) => setPenileLength(e.target.value)} placeholder="5.0" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Окружность (см)</Label>
                          <Input type="number" step="0.1" min="0" value={penileCircumference} onChange={(e) => setPenileCircumference(e.target.value)} placeholder="7.0" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">Стадия Таннера</Label>
                  <Select value={tannerStage} onValueChange={setTannerStage}>
                    <SelectTrigger><SelectValue placeholder="Не указана" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Не указана</SelectItem>
                      {[1, 2, 3, 4, 5].map(s => (
                        <SelectItem key={s} value={String(s)}>
                          {s} — {TANNER_DESCRIPTIONS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Заметки</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Дополнительные наблюдения..." rows={2} />
                </div>

                <Button onClick={handleSave} disabled={saving || !patient || !result} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Сохранение..." : "Сохранить измерение"}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
              {result ? (
                <>
                  {/* Computed values */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Расчётные показатели</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {result.bmi !== null && (
                          <div className="p-3 rounded-lg bg-secondary/50">
                            <p className="text-muted-foreground text-xs">ИМТ</p>
                            <p className="text-lg font-bold">{result.bmi.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">{result.bmiCategory}</p>
                          </div>
                        )}
                        {result.bsa !== null && (
                          <div className="p-3 rounded-lg bg-secondary/50">
                            <p className="text-muted-foreground text-xs">BSA (м²)</p>
                            <p className="text-lg font-bold">{result.bsa.toFixed(3)}</p>
                            <p className="text-xs text-muted-foreground">Мостеллер</p>
                          </div>
                        )}
                        {result.waistHeightRatio !== null && (
                          <div className="p-3 rounded-lg bg-secondary/50">
                            <p className="text-muted-foreground text-xs">Талия/Рост</p>
                            <p className="text-lg font-bold">{result.waistHeightRatio.toFixed(3)}</p>
                            <p className="text-xs text-muted-foreground">{result.waistHeightCategory}</p>
                          </div>
                        )}
                        <div className="p-3 rounded-lg bg-secondary/50">
                          <p className="text-muted-foreground text-xs">Возраст</p>
                          <p className="text-lg font-bold">{result.ageText}</p>
                          <p className="text-xs text-muted-foreground">{result.ageMonths} мес.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Percentiles */}
                  {(result.weightPercentile !== null || result.heightPercentile !== null) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Перцентили (WHO)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {result.weightPercentile !== null && (
                            <PercentileBar label="Масса" percentile={result.weightPercentile} zScore={result.weightZScore!} />
                          )}
                          {result.heightPercentile !== null && (
                            <PercentileBar label="Рост" percentile={result.heightPercentile} zScore={result.heightZScore!} />
                          )}
                          {result.bmiPercentile !== null && (
                            <PercentileBar label="ИМТ" percentile={result.bmiPercentile} zScore={result.bmiZScore!} />
                          )}
                          {result.headPercentile !== null && (
                            <PercentileBar label="Окр. головы" percentile={result.headPercentile} zScore={result.headZScore!} />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Assessment */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Оценка физического развития</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
                          <span className="text-sm text-muted-foreground">Уровень развития</span>
                          <span className="font-medium">{result.physicalDevelopment}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
                          <span className="text-sm text-muted-foreground">Гармоничность</span>
                          <span className={cn("font-medium", result.harmony.includes("Резко") && "text-destructive")}>{result.harmony}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
                          <span className="text-sm text-muted-foreground">ИМТ-категория</span>
                          <span className="font-medium">{result.bmiCategory}</span>
                        </div>
                        {result.waistHeightCategory && (
                          <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
                            <span className="text-sm text-muted-foreground">Талия/Рост</span>
                            <span className={cn("font-medium", result.waistHeightCategory.includes("риск") && "text-destructive")}>{result.waistHeightCategory}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {getZBadge(result.weightZScore, "Масса")}
                        {getZBadge(result.heightZScore, "Рост")}
                        {getZBadge(result.bmiZScore, "ИМТ")}
                        {getZBadge(result.headZScore, "Голова")}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Выберите пациента и введите данные для расчёта</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          {patient && (
            <div className="space-y-6">
              <GrowthCharts patientId={patient.id} sex={sex} />
              <AnthropometryHistory patientId={patient.id} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PercentileBar({ label, percentile, zScore }: { label: string; percentile: number; zScore: number }) {
  const getColor = () => {
    if (percentile < 3 || percentile > 97) return "bg-destructive";
    if (percentile < 15 || percentile > 85) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">P{percentile} (Z={zScore.toFixed(2)})</span>
      </div>
      <div className="h-2 bg-secondary rounded-full relative">
        <div className="absolute top-0 left-0 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(2, percentile))}%` }}>
          <div className={cn("h-full rounded-full", getColor())} />
        </div>
        {/* Reference markers */}
        <div className="absolute top-0 left-[3%] w-px h-full bg-muted-foreground/30" />
        <div className="absolute top-0 left-[15%] w-px h-full bg-muted-foreground/20" />
        <div className="absolute top-0 left-[50%] w-px h-full bg-muted-foreground/30" />
        <div className="absolute top-0 left-[85%] w-px h-full bg-muted-foreground/20" />
        <div className="absolute top-0 left-[97%] w-px h-full bg-muted-foreground/30" />
      </div>
    </div>
  );
}
