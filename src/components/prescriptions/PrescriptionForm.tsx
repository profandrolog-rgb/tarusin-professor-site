import { useState, useEffect, useRef } from "react";
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
import { MedicationSearch } from "./MedicationSearch";
import { PrescriptionPrint } from "./PrescriptionPrint";
import { PrescriptionPreview } from "./PrescriptionPreview";

interface PrescriptionItem {
  medication_latin_name: string;
  dosage_form: string;
  dose: string;
  quantity: number;
  frequency: string;
  duration: string;
}

interface Patient {
  id: string;
  full_name: string;
  birth_date: string;
}

interface PrescriptionFormProps {
  repeatPrescriptionId?: string | null;
  repeatWithoutPatient?: boolean;
  onSaved: () => void;
}

export function PrescriptionForm({ repeatPrescriptionId, repeatWithoutPatient, onSaved }: PrescriptionFormProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptionDate, setPrescriptionDate] = useState<Date>(new Date());
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedPrescription, setSavedPrescription] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Load repeat prescription data
  useEffect(() => {
    if (repeatPrescriptionId) {
      loadRepeatPrescription(repeatPrescriptionId);
    }
  }, [repeatPrescriptionId, repeatWithoutPatient]);

  const loadRepeatPrescription = async (id: string) => {
    const { data: prescription } = await supabase
      .from("prescriptions")
      .select("*, patients(*)")
      .eq("id", id)
      .single();

    if (prescription) {
      setPatient({
        id: (prescription as any).patients.id,
        full_name: (prescription as any).patients.full_name,
        birth_date: (prescription as any).patients.birth_date,
      });
      setPrescriptionDate(new Date());

      const { data: prescItems } = await supabase
        .from("prescription_items")
        .select("*")
        .eq("prescription_id", id)
        .order("sort_order");

      if (prescItems) {
        setItems(prescItems.map((item) => ({
          medication_latin_name: item.medication_latin_name,
          dosage_form: item.dosage_form || "",
          dose: item.dose || "",
          quantity: item.quantity,
          frequency: item.frequency || "",
          duration: item.duration || "",
        })));
      }
    }
  };

  const addItem = (med: { latin_name: string; dosage_form: string; dose: string }) => {
    setItems([...items, {
      medication_latin_name: med.latin_name,
      dosage_form: med.dosage_form,
      dose: med.dose,
      quantity: 1,
      frequency: "",
      duration: "",
    }]);
  };

  const updateItem = (index: number, field: keyof PrescriptionItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!patient) { toast.error("Выберите пациента"); return; }
    if (items.length === 0) { toast.error("Добавьте хотя бы один препарат"); return; }

    setSaving(true);
    try {
      const { data: prescription, error } = await supabase
        .from("prescriptions")
        .insert({
          patient_id: patient.id,
          prescription_date: format(prescriptionDate, "yyyy-MM-dd"),
          prescription_type: "standard",
        })
        .select()
        .single();

      if (error) throw error;

      const { error: itemsError } = await supabase
        .from("prescription_items")
        .insert(items.map((item, idx) => ({
          prescription_id: prescription.id,
          medication_latin_name: item.medication_latin_name,
          dosage_form: item.dosage_form || null,
          dose: item.dose || null,
          quantity: item.quantity,
          frequency: item.frequency || null,
          duration: item.duration || null,
          sort_order: idx,
        })));

      if (itemsError) throw itemsError;

      setSavedPrescription({
        ...prescription,
        patient,
        items,
      });

      toast.success("Рецепт сохранён");
    } catch (err: any) {
      toast.error("Ошибка сохранения: " + err.message);
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
      <html>
        <head>
          <title>Рецепт</title>
          <style>
            @page { size: 148.5mm 105mm; margin: 0; }
            body { margin: 0; padding: 0; }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleNewPrescription = () => {
    setSavedPrescription(null);
    setItems([]);
  };

  if (savedPrescription) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Печать рецепта
          </Button>
          <Button variant="outline" onClick={handleNewPrescription}>
            Новый рецепт
          </Button>
          <Button variant="outline" onClick={onSaved}>
            К истории
          </Button>
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
          <CardTitle>Форма 107/у — Стандартный рецепт</CardTitle>
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
                <Calendar
                  mode="single"
                  selected={prescriptionDate}
                  onSelect={(d) => d && setPrescriptionDate(d)}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Patient */}
          <PatientSelect selectedPatient={patient} onSelect={setPatient} />

          {/* Doctor (readonly) */}
          <div className="space-y-2">
            <Label>Врач</Label>
            <Input value="Профессор, д.м.н. Тарусин Дмитрий Игоревич" readOnly className="bg-secondary/30" />
          </div>

          {/* Medications */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Rp: Препараты</h3>
            <MedicationSearch onSelect={addItem} />

            {items.map((item, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium">{item.medication_latin_name}</h4>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Форма выпуска</Label>
                    <Input value={item.dosage_form} onChange={(e) => updateItem(idx, "dosage_form", e.target.value)} placeholder="таблетки" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Доза</Label>
                    <Input value={item.dose} onChange={(e) => updateItem(idx, "dose", e.target.value)} placeholder="500 мг" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Количество (D.t.d. N)</Label>
                    <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Кратность приёма</Label>
                    <Input value={item.frequency} onChange={(e) => updateItem(idx, "frequency", e.target.value)} placeholder="по 1 табл. 3 р/день" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Длительность</Label>
                    <Input value={item.duration} onChange={(e) => updateItem(idx, "duration", e.target.value)} placeholder="7 дней" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-3">
            {patient && items.length > 0 && (
              <PrescriptionPreview
                prescription={{
                  prescription_date: format(prescriptionDate, "yyyy-MM-dd"),
                  doctor_name: "Профессор, д.м.н. Тарусин Дмитрий Игоревич",
                  prescription_type: "standard",
                  patient,
                  items,
                }}
                trigger={
                  <Button variant="outline" type="button">
                    <Eye className="h-4 w-4 mr-2" /> Предпросмотр
                  </Button>
                }
              />
            )}
            <Button onClick={handleSave} disabled={saving || !patient || items.length === 0} className="flex-1">
              {saving ? "Сохранение..." : "Сохранить рецепт"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
