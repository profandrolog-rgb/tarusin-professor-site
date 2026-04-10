import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConsultationFormProps {
  userId: string;
  isEn: boolean;
  onCreated: () => void;
}

export default function ConsultationForm({ userId, isEn, onCreated }: ConsultationFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    patient_full_name: "",
    parent_name: "",
    parent_phone: "",
    parent_whatsapp: "",
    parent_telegram: "",
    patient_whatsapp: "",
    patient_telegram: "",
    has_insurance: false,
    complaints: "",
    medical_history: "",
  });

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        f => f.type === "application/pdf" || f.type.startsWith("image/")
      );
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!form.patient_full_name.trim() || !form.complaints.trim()) {
      toast({
        title: isEn ? "Please fill required fields" : "Заполните обязательные поля",
        description: isEn ? "Patient name and complaints are required" : "ФИО пациента и жалобы обязательны",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create case
      const { data: caseData, error: caseErr } = await supabase
        .from("consultation_cases")
        .insert({
          user_id: userId,
          patient_full_name: form.patient_full_name.trim(),
          parent_name: form.parent_name.trim(),
          parent_phone: form.parent_phone.trim(),
          parent_whatsapp: form.parent_whatsapp.trim(),
          parent_telegram: form.parent_telegram.trim(),
          patient_whatsapp: form.patient_whatsapp.trim(),
          patient_telegram: form.patient_telegram.trim(),
          has_insurance: form.has_insurance,
          status: "submitted",
        })
        .select("id")
        .single();

      if (caseErr) throw caseErr;

      // 2. Create first round
      const { data: roundData, error: roundErr } = await supabase
        .from("consultation_rounds")
        .insert({
          case_id: caseData.id,
          user_id: userId,
          round_number: 1,
          complaints: form.complaints.trim(),
          medical_history: form.medical_history.trim(),
        })
        .select("id")
        .single();

      if (roundErr) throw roundErr;

      // 3. Upload documents
      for (const file of files) {
        const filePath = `${userId}/${caseData.id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("patient-documents")
          .upload(filePath, file);

        if (uploadErr) {
          console.error("Upload error:", uploadErr);
          continue;
        }

        await supabase.from("consultation_documents").insert({
          round_id: roundData.id,
          user_id: userId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
        });
      }

      toast({ title: isEn ? "Consultation submitted!" : "Консультация отправлена!" });
      onCreated();
    } catch (err: any) {
      console.error(err);
      toast({
        title: isEn ? "Error" : "Ошибка",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEn ? "New Online Consultation" : "Новая онлайн-консультация"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">
            {isEn ? "Patient & Parent Information" : "Данные пациента и родителя"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isEn ? "Patient Full Name *" : "ФИО пациента *"}</Label>
              <Input value={form.patient_full_name} onChange={e => set("patient_full_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{isEn ? "Parent Name" : "Имя-отчество родителя"}</Label>
              <Input value={form.parent_name} onChange={e => set("parent_name", e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{isEn ? "Phone" : "Телефон"}</Label>
              <Input value={form.parent_phone} onChange={e => set("parent_phone", e.target.value)} placeholder="+7..." />
            </div>
            <div className="space-y-2">
              <Label>{isEn ? "Parent WhatsApp" : "WhatsApp родителя"}</Label>
              <Input value={form.parent_whatsapp} onChange={e => set("parent_whatsapp", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{isEn ? "Parent Telegram" : "Telegram родителя"}</Label>
              <Input value={form.parent_telegram} onChange={e => set("parent_telegram", e.target.value)} placeholder="@username" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isEn ? "Patient WhatsApp" : "WhatsApp пациента"}</Label>
              <Input value={form.patient_whatsapp} onChange={e => set("patient_whatsapp", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{isEn ? "Patient Telegram" : "Telegram пациента"}</Label>
              <Input value={form.patient_telegram} onChange={e => set("patient_telegram", e.target.value)} placeholder="@username" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.has_insurance} onCheckedChange={c => set("has_insurance", c === true)} />
            <Label>{isEn ? "Patient has health insurance (OMS)" : "У пациента есть полис ОМС"}</Label>
          </div>
        </div>

        {/* Medical info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">
            {isEn ? "Medical Information" : "Медицинская информация"}
          </h3>
          <div className="space-y-2">
            <Label>{isEn ? "Complaints *" : "Жалобы *"}</Label>
            <Textarea
              value={form.complaints}
              onChange={e => set("complaints", e.target.value)}
              placeholder={isEn ? "Describe the complaints in detail..." : "Опишите жалобы подробно..."}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>{isEn ? "Medical History" : "История обращений / анамнез"}</Label>
            <Textarea
              value={form.medical_history}
              onChange={e => set("medical_history", e.target.value)}
              placeholder={isEn ? "Previous consultations, treatments, diagnoses..." : "Предыдущие обращения, лечение, диагнозы..."}
              rows={4}
            />
          </div>
        </div>

        {/* Document upload */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">
            {isEn ? "Documents (analyses, conclusions)" : "Документы (анализы, заключения)"}
          </h3>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              {isEn ? "Upload PDF or images" : "Загрузите PDF или изображения"}
            </p>
            <label className="cursor-pointer">
              <Input type="file" multiple accept=".pdf,image/*" onChange={handleFileAdd} className="hidden" />
              <Button variant="outline" type="button" asChild>
                <span>{isEn ? "Choose files" : "Выбрать файлы"}</span>
              </Button>
            </label>
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm truncate flex-1">{f.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeFile(i)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={submitting} size="lg" className="w-full">
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {isEn ? "Submit Consultation Request" : "Отправить заявку на консультацию"}
        </Button>
      </CardContent>
    </Card>
  );
}
