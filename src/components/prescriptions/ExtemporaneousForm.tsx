import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Printer, Plus, Trash2, Eye, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { PatientSelect } from "./PatientSelect";
import { PrescriptionPrint } from "./PrescriptionPrint";
import { PrescriptionPreview } from "./PrescriptionPreview";

interface Ingredient {
  ingredient_name: string;
  amount: string;
  unit: string;
}

interface Patient {
  id: string;
  full_name: string;
  birth_date: string;
}

interface SubstanceSuggestion {
  id: string;
  latin_name: string;
  russian_name: string;
  default_unit: string;
  category: string;
  description: string | null;
}

interface ExtemporaneousFormProps {
  onSaved: () => void;
}

const FORM_TYPES = [
  { value: "unguentum", label: "Мазь (Unguentum)", misceLabel: "unguentum" },
  { value: "pasta", label: "Паста (Pasta)", misceLabel: "pastam" },
  { value: "cremor", label: "Крем (Cremor)", misceLabel: "cremorem" },
  { value: "gel", label: "Гель (Gel)", misceLabel: "gel" },
  { value: "linimentum", label: "Линимент (Linimentum)", misceLabel: "linimentum" },
  { value: "suspensio", label: "Болтушка (Suspensio)", misceLabel: "suspensionem" },
  { value: "suppositoria", label: "Свечи (Suppositoria)", misceLabel: "suppositoria" },
  { value: "mixtura", label: "Микстура (Mixtura)", misceLabel: "mixturam" },
  { value: "tinctura", label: "Настойка (Tinctura)", misceLabel: "tincturam" },
  { value: "solutio", label: "Раствор (Solutio)", misceLabel: "solutionem" },
];

const SIGNA_TEMPLATES = [
  "Наружно. Наносить тонким слоем на поражённые участки 2 раза в день",
  "Наружно. Наносить на кожу 1 раз в день на ночь",
  "Наружно. Смазывать поражённые участки 3 раза в день",
  "Наружно. Наносить под повязку 1 раз в день",
  "Ректально. По 1 свече 1 раз в день на ночь",
  "Ректально. По 1 свече 2 раза в день (утром и на ночь)",
  "Вагинально. По 1 свече на ночь",
  "Внутрь. По 1 столовой ложке 3 раза в день до еды",
  "Внутрь. По 1 десертной ложке 3 раза в день после еды",
  "Внутрь. По 1 чайной ложке 3 раза в день",
  "Внутрь. По 15 капель 3 раза в день, растворив в воде",
  "Внутрь. По 20 капель на ночь",
  "Для полоскания. Развести 1 чайную ложку в стакане воды",
  "Для промывания. Использовать по назначению врача",
];

export function ExtemporaneousForm({ onSaved }: ExtemporaneousFormProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptionDate, setPrescriptionDate] = useState<Date>(new Date());
  const [formType, setFormType] = useState("unguentum");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ ingredient_name: "", amount: "", unit: "г" }]);
  const [signa, setSigna] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedPrescription, setSavedPrescription] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Autocomplete state
  const [activeIngIdx, setActiveIngIdx] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<SubstanceSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const searchSubstances = useCallback(async (query: string, formTypeFilter: string) => {
    if (query.length < 2) { setSuggestions([]); return; }
    setSearchLoading(true);
    try {
      const { data } = await supabase
        .from("extemporaneous_substances")
        .select("id, latin_name, russian_name, default_unit, category, description")
        .or(`latin_name.ilike.%${query}%,russian_name.ilike.%${query}%`)
        .limit(15);
      setSuggestions(data || []);
    } catch {
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleIngredientNameChange = (index: number, value: string) => {
    updateIngredient(index, "ingredient_name", value);
    setActiveIngIdx(index);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchSubstances(value, formType), 300);
  };

  const selectSuggestion = (index: number, sub: SubstanceSuggestion) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = {
      ingredient_name: sub.latin_name,
      amount: newIngredients[index].amount,
      unit: sub.default_unit,
    };
    setIngredients(newIngredients);
    setSuggestions([]);
    setActiveIngIdx(null);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { ingredient_name: "", amount: "", unit: "г" }]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const getMisceText = () => {
    const ft = FORM_TYPES.find(f => f.value === formType);
    return `M.f. ${ft?.misceLabel || formType}`;
  };

  const handleSave = async () => {
    if (!patient) { toast.error("Выберите пациента"); return; }
    const validIngredients = ingredients.filter(i => i.ingredient_name.trim());
    if (validIngredients.length === 0) { toast.error("Добавьте хотя бы один ингредиент"); return; }

    setSaving(true);
    try {
      const { data: prescription, error } = await supabase
        .from("prescriptions")
        .insert({
          patient_id: patient.id,
          prescription_date: format(prescriptionDate, "yyyy-MM-dd"),
          prescription_type: "extemporaneous",
          extemporaneous_form_type: formType,
          signa: signa || null,
        })
        .select()
        .single();

      if (error) throw error;

      const { error: ingError } = await supabase
        .from("extemporaneous_ingredients")
        .insert(validIngredients.map((ing, idx) => ({
          prescription_id: prescription.id,
          ingredient_name: ing.ingredient_name,
          amount: ing.amount,
          unit: ing.unit,
          sort_order: idx,
        })));

      if (ingError) throw ingError;

      setSavedPrescription({
        ...prescription,
        patient,
        ingredients: validIngredients,
        signa,
        extemporaneous_form_type: formType,
      });

      toast.success("Экстемпоральный рецепт сохранён");
    } catch (err: any) {
      toast.error("Ошибка: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Рецепт</title>
      <style>@page{size:A4 portrait;margin:0}body{margin:0;padding:0;display:flex;justify-content:flex-end}*{box-sizing:border-box}</style>
      </head><body>${printContent.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const buildPrescriptionData = () => ({
    prescription_date: format(prescriptionDate, "yyyy-MM-dd"),
    doctor_name: "Профессор, д.м.н. Тарусин Дмитрий Игоревич",
    prescription_type: "extemporaneous",
    patient: patient!,
    ingredients,
    signa,
    extemporaneous_form_type: formType,
  });

  if (savedPrescription) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Печать рецепта
          </Button>
          <Button variant="outline" onClick={() => { setSavedPrescription(null); setIngredients([{ ingredient_name: "", amount: "", unit: "г" }]); setSigna(""); }}>
            Новый рецепт
          </Button>
          <Button variant="outline" onClick={onSaved}>К истории</Button>
        </div>
        <div ref={printRef}>
          <PrescriptionPrint prescription={savedPrescription} />
        </div>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    base: "Основа", antiseptic: "Антисептик", antiinflammatory: "Противовоспалит.",
    drying: "Подсушивающее", antibiotic: "Антибиотик", antifungal: "Противогрибковое",
    anesthetic: "Анестетик", keratolytic: "Кератолитик", astringent: "Вяжущее",
    vitamin: "Витамин", herbal: "Растительное", regenerative: "Регенерирующее",
    antispasmodic: "Спазмолитик", hemostatic: "Гемостатик", emulsifier: "Эмульгатор",
    preservative: "Консервант", mineral: "Минеральное", analgesic: "Анальгетик",
    sedative: "Седативное", expectorant: "Отхаркивающее", antihistamine: "Антигистамин",
    hormone: "Гормон", active: "Активное", dye: "Краситель", corrective: "Корригент",
    emollient: "Смягчающее", vasoconstrictor: "Сосудосуж.", other: "Прочее",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Экстемпоральная пропись</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date */}
          <div className="space-y-2">
            <Label>Дата рецепта</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[240px] justify-start text-left")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(prescriptionDate, "dd.MM.yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={prescriptionDate} onSelect={(d) => d && setPrescriptionDate(d)} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <PatientSelect selectedPatient={patient} onSelect={setPatient} />

          <div className="space-y-2">
            <Label>Врач</Label>
            <Input value="Профессор, д.м.н. Тарусин Дмитрий Игоревич" readOnly className="bg-secondary/30" />
          </div>

          {/* Form type selector */}
          <div className="space-y-2">
            <Label>Лекарственная форма</Label>
            <Select value={formType} onValueChange={setFormType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORM_TYPES.map(ft => (
                  <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ingredients with autocomplete */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Rp: Ингредиенты</h3>
              <Button variant="outline" size="sm" onClick={addIngredient}>
                <Plus className="h-4 w-4 mr-1" /> Добавить
              </Button>
            </div>

            {ingredients.map((ing, idx) => (
              <div key={idx} className="relative">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Наименование (лат. или рус.)</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={ing.ingredient_name}
                        onChange={(e) => handleIngredientNameChange(idx, e.target.value)}
                        onFocus={() => setActiveIngIdx(idx)}
                        onBlur={() => setTimeout(() => setActiveIngIdx(null), 200)}
                        placeholder="Начните вводить название..."
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">Кол-во</Label>
                    <Input value={ing.amount} onChange={(e) => updateIngredient(idx, "amount", e.target.value)} placeholder="10,0" />
                  </div>
                  <div className="w-20 space-y-1">
                    <Label className="text-xs">Ед.</Label>
                    <Input value={ing.unit} onChange={(e) => updateIngredient(idx, "unit", e.target.value)} placeholder="г" />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeIngredient(idx)} disabled={ingredients.length <= 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {/* Autocomplete dropdown */}
                {activeIngIdx === idx && suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-24 top-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map(sub => (
                      <button
                        key={sub.id}
                        className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm flex items-center justify-between gap-2"
                        onMouseDown={(e) => { e.preventDefault(); selectSuggestion(idx, sub); }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{sub.latin_name}</div>
                          <div className="text-xs text-muted-foreground truncate">{sub.russian_name}</div>
                        </div>
                        <span className="text-xs px-1.5 py-0.5 bg-muted rounded shrink-0">
                          {categoryLabels[sub.category] || sub.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Misce ut fiat - static */}
            <div className="border-t pt-3 mt-3">
              <p className="font-semibold text-sm italic text-muted-foreground">
                {getMisceText()}
              </p>
              <p className="text-xs text-muted-foreground">
                Misce ut fiat — Смешай, чтобы получилось ({FORM_TYPES.find(f => f.value === formType)?.label.split(" (")[0].toLowerCase()})
              </p>
            </div>
          </div>

          {/* Signa (D.S.) */}
          <div className="space-y-2">
            <Label className="font-semibold">D.S. (Signa — способ применения)</Label>
            <Select onValueChange={(v) => setSigna(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите шаблон или введите вручную" />
              </SelectTrigger>
              <SelectContent>
                {SIGNA_TEMPLATES.map((tpl, i) => (
                  <SelectItem key={i} value={tpl}>{tpl}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={signa}
              onChange={(e) => setSigna(e.target.value)}
              placeholder="Или введите способ применения вручную"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {patient && ingredients.some(i => i.ingredient_name) && (
              <PrescriptionPreview
                prescription={buildPrescriptionData()}
                trigger={
                  <Button variant="outline" type="button">
                    <Eye className="h-4 w-4 mr-2" /> Предпросмотр
                  </Button>
                }
              />
            )}
            <Button onClick={handleSave} disabled={saving || !patient} className="flex-1">
              {saving ? "Сохранение..." : "Сохранить рецепт"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
