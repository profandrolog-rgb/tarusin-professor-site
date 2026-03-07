import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Printer, Plus, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { PatientSelect } from "./PatientSelect";
import { PrescriptionPrint } from "./PrescriptionPrint";
import { Textarea } from "@/components/ui/textarea";

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

interface ExtemporaneousFormProps {
  onSaved: () => void;
}

export function ExtemporaneousForm({ onSaved }: ExtemporaneousFormProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptionDate, setPrescriptionDate] = useState<Date>(new Date());
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ ingredient_name: "", amount: "", unit: "г" }]);
  const [signa, setSigna] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedPrescription, setSavedPrescription] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

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
      <style>@page{size:148.5mm 105mm;margin:0}body{margin:0;padding:0}*{box-sizing:border-box}</style>
      </head><body>${printContent.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (savedPrescription) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Печать рецепта
          </Button>
          <Button variant="outline" onClick={() => { setSavedPrescription(null); setIngredients([{ ingredient_name: "", amount: "", unit: "г" }]); }}>
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

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Экстемпоральная пропись</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Rp: Ингредиенты</h3>
              <Button variant="outline" size="sm" onClick={addIngredient}>
                <Plus className="h-4 w-4 mr-1" /> Добавить
              </Button>
            </div>

            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Наименование (лат.)</Label>
                  <Input value={ing.ingredient_name} onChange={(e) => updateIngredient(idx, "ingredient_name", e.target.value)} placeholder="Zinci oxydi" />
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
            ))}
          </div>

          <Button onClick={handleSave} disabled={saving || !patient} className="w-full">
            {saving ? "Сохранение..." : "Сохранить рецепт"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
