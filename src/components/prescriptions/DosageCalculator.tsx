import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calculator,
  Loader2,
  AlertTriangle,
  Search,
  Baby,
  Weight,
  Ruler,
  Pill,
  Clock,
  Syringe,
  ShieldAlert,
  Info,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { MedicationSearch } from "./MedicationSearch";

interface DosageResult {
  is_contraindicated: boolean;
  contraindication_warning?: string;
  min_age_allowed?: string;
  single_dose?: string;
  daily_dose?: string;
  frequency?: string;
  max_daily_dose?: string;
  route?: string;
  duration?: string;
  calculation_method?: string;
  formula_used?: string;
  available_forms?: string;
  notes?: string;
  bsa_calculated?: number;
}

export function DosageCalculator() {
  const [medicationName, setMedicationName] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DosageResult | null>(null);

  const bsa =
    weightKg && heightCm
      ? Math.round(Math.sqrt((parseFloat(heightCm) * parseFloat(weightKg)) / 3600) * 100) / 100
      : null;

  const canCalculate = medicationName.trim() && (weightKg || ageYears);

  const handleCalculate = async () => {
    if (!canCalculate) return;
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("dosage-calculator", {
        body: {
          medication_name: medicationName.trim(),
          age_years: ageYears ? parseInt(ageYears) : undefined,
          age_months: ageMonths ? parseInt(ageMonths) : undefined,
          weight_kg: weightKg ? parseFloat(weightKg) : undefined,
          height_cm: heightCm ? parseFloat(heightCm) : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
    } catch (err: any) {
      toast.error(err.message || "Ошибка расчёта дозы");
    } finally {
      setLoading(false);
    }
  };

  const handleMedSelect = (med: { latin_name: string }) => {
    setMedicationName(med.latin_name);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Калькулятор педиатрической дозы
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Расчёт дозировки препарата по возрасту, массе тела и площади поверхности тела (BSA)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Medication */}
          <div className="space-y-2">
            <MedicationSearch onSelect={handleMedSelect} />
            {medicationName && (
              <div className="flex items-center gap-2 text-sm bg-primary/10 text-primary rounded-md px-3 py-2">
                <Pill className="h-4 w-4" />
                <span className="font-medium">{medicationName}</span>
                <button
                  onClick={() => setMedicationName("")}
                  className="ml-auto text-xs hover:underline"
                >
                  Изменить
                </button>
              </div>
            )}
          </div>

          {/* Child parameters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <Baby className="h-3.5 w-3.5" /> Возраст (лет)
              </Label>
              <Input
                type="number"
                min={0}
                max={18}
                value={ageYears}
                onChange={(e) => setAgeYears(e.target.value)}
                placeholder="0–18"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <Baby className="h-3.5 w-3.5" /> Месяцев
              </Label>
              <Input
                type="number"
                min={0}
                max={11}
                value={ageMonths}
                onChange={(e) => setAgeMonths(e.target.value)}
                placeholder="0–11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <Weight className="h-3.5 w-3.5" /> Вес (кг)
              </Label>
              <Input
                type="number"
                min={0.5}
                max={150}
                step={0.1}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="кг"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <Ruler className="h-3.5 w-3.5" /> Рост (см)
              </Label>
              <Input
                type="number"
                min={30}
                max={200}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="см"
              />
            </div>
          </div>

          {/* BSA preview */}
          {bsa && (
            <div className="text-sm text-muted-foreground bg-secondary/30 rounded-md px-3 py-2">
              ППТ (BSA, Mosteller): <span className="font-semibold text-foreground">{bsa} м²</span>
            </div>
          )}

          <Button onClick={handleCalculate} disabled={loading || !canCalculate} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Расчёт...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" /> Рассчитать дозу
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Contraindication warning */}
          {result.is_contraindicated && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-destructive text-lg">
                      ⚠️ Противопоказан детям!
                    </h3>
                    <p className="text-sm text-destructive/80 mt-1">
                      {result.contraindication_warning}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Age restriction */}
          {result.min_age_allowed && !result.is_contraindicated && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Минимальный возраст: {result.min_age_allowed}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dosage info */}
          {!result.is_contraindicated && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Результат расчёта
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {result.formula_used && (
                    <ResultRow icon={<Calculator className="h-4 w-4" />} label="Формула" value={result.formula_used} highlight />
                  )}
                  {result.single_dose && (
                    <ResultRow icon={<Pill className="h-4 w-4" />} label="Разовая доза" value={result.single_dose} />
                  )}
                  {result.daily_dose && (
                    <ResultRow icon={<Pill className="h-4 w-4" />} label="Суточная доза" value={result.daily_dose} />
                  )}
                  {result.max_daily_dose && (
                    <ResultRow icon={<AlertTriangle className="h-4 w-4" />} label="Макс. суточная" value={result.max_daily_dose} />
                  )}
                  {result.frequency && (
                    <ResultRow icon={<Clock className="h-4 w-4" />} label="Кратность" value={result.frequency} />
                  )}
                  {result.route && (
                    <ResultRow icon={<Syringe className="h-4 w-4" />} label="Путь введения" value={result.route} />
                  )}
                  {result.duration && (
                    <ResultRow icon={<Clock className="h-4 w-4" />} label="Длительность" value={result.duration} />
                  )}
                  {result.calculation_method && (
                    <ResultRow icon={<Info className="h-4 w-4" />} label="Метод расчёта" value={result.calculation_method} />
                  )}
                  {result.available_forms && (
                    <ResultRow icon={<Pill className="h-4 w-4" />} label="Детские формы" value={result.available_forms} />
                  )}
                  {result.notes && (
                    <div className="mt-3 p-3 rounded-lg bg-secondary/30 border text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Примечания: </span>
                      {result.notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <p className="text-[10px] text-muted-foreground/60 text-center">
            Расчёт выполнен AI на основе данных фармакопеи. Не заменяет клинического решения врача.
          </p>
        </div>
      )}
    </div>
  );
}

function ResultRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 py-2 px-3 rounded-md ${
        highlight ? "bg-primary/5 border border-primary/20" : ""
      }`}
    >
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
