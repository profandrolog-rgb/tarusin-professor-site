import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddRoundFormProps {
  caseId: string;
  userId: string;
  nextRoundNumber: number;
  isEn: boolean;
  onCreated: () => void;
}

export default function AddRoundForm({ caseId, userId, nextRoundNumber, isEn, onCreated }: AddRoundFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [complaints, setComplaints] = useState("");
  const [history, setHistory] = useState("");

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!).filter(f => f.type === "application/pdf" || f.type.startsWith("image/"))]);
    }
  };

  const handleSubmit = async () => {
    if (!complaints.trim()) {
      toast({ title: isEn ? "Describe your complaints" : "Опишите жалобы", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: round, error } = await supabase
        .from("consultation_rounds")
        .insert({
          case_id: caseId,
          user_id: userId,
          round_number: nextRoundNumber,
          complaints: complaints.trim(),
          medical_history: history.trim(),
        })
        .select("id")
        .single();
      if (error) throw error;

      for (const file of files) {
        const filePath = `${userId}/${caseId}/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from("patient-documents").upload(filePath, file);
        if (upErr) continue;
        await supabase.from("consultation_documents").insert({
          round_id: round.id,
          user_id: userId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
        });
      }

      // Reopen case
      await supabase.from("consultation_cases").update({ status: "submitted" }).eq("id", caseId);

      toast({ title: isEn ? "New round submitted!" : "Новое обращение отправлено!" });
      onCreated();
    } catch (err: any) {
      toast({ title: isEn ? "Error" : "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle>{isEn ? "Submit Additional Information" : "Дополнить консультацию"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{isEn ? "New Complaints / Updates *" : "Новые жалобы / обновления *"}</Label>
          <Textarea value={complaints} onChange={e => setComplaints(e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>{isEn ? "Additional History" : "Дополнительный анамнез"}</Label>
          <Textarea value={history} onChange={e => setHistory(e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>{isEn ? "New Documents" : "Новые документы"}</Label>
          <label className="cursor-pointer">
            <Input type="file" multiple accept=".pdf,image/*" onChange={handleFileAdd} className="hidden" />
            <Button variant="outline" type="button" asChild><span><Upload className="w-4 h-4 mr-2" />{isEn ? "Upload" : "Загрузить"}</span></Button>
          </label>
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm truncate flex-1">{f.name}</span>
              <Button variant="ghost" size="sm" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}><X className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEn ? "Submit" : "Отправить"}
        </Button>
      </CardContent>
    </Card>
  );
}
