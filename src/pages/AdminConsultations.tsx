import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, FileText, Download, Brain, CheckCircle2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Черновик", color: "bg-muted text-muted-foreground" },
  submitted: { label: "Новая", color: "bg-yellow-500/10 text-yellow-700" },
  paid: { label: "Оплачена", color: "bg-blue-500/10 text-blue-700" },
  in_review: { label: "На рассмотрении", color: "bg-purple-500/10 text-purple-700" },
  completed: { label: "Завершена", color: "bg-green-500/10 text-green-700" },
  acknowledged: { label: "Ознакомлен", color: "bg-green-600/10 text-green-800" },
  closed: { label: "Закрыта", color: "bg-muted text-muted-foreground" },
};

const AdminConsultations = () => {
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["admin-consultations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultation_cases")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const selectedCase = cases.find((c: any) => c.id === selectedId);

  const { data: rounds = [] } = useQuery({
    queryKey: ["admin-rounds", selectedId],
    queryFn: async () => {
      if (!selectedId) return [];
      const { data, error } = await supabase
        .from("consultation_rounds")
        .select("*")
        .eq("case_id", selectedId)
        .order("round_number");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedId,
  });

  const { data: allDocs = [] } = useQuery({
    queryKey: ["admin-docs", selectedId],
    queryFn: async () => {
      const roundIds = rounds.map((r: any) => r.id);
      if (!roundIds.length) return [];
      const { data, error } = await supabase
        .from("consultation_documents")
        .select("*")
        .in("round_id", roundIds);
      if (error) throw error;
      return data;
    },
    enabled: rounds.length > 0,
  });

  const getDocUrl = async (path: string) => {
    const { data } = await supabase.storage.from("patient-documents").createSignedUrl(path, 3600);
    return data?.signedUrl;
  };

  const runAiAnalysis = async (roundId: string) => {
    setAiLoading(true);
    try {
      const round = rounds.find((r: any) => r.id === roundId);
      if (!round) return;

      const { data, error } = await supabase.functions.invoke("analyze-consultation", {
        body: {
          complaints: round.complaints,
          medical_history: round.medical_history,
          patient_name: selectedCase?.patient_full_name,
        },
      });

      if (error) throw error;

      await supabase
        .from("consultation_rounds")
        .update({
          ai_assessment: data.assessment,
          ai_assessment_date: new Date().toISOString(),
        })
        .eq("id", roundId);

      qc.invalidateQueries({ queryKey: ["admin-rounds"] });
      toast({ title: "ИИ-анализ завершён" });
    } catch (err: any) {
      toast({ title: "Ошибка ИИ", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const updateRound = async (roundId: string, fields: Record<string, any>) => {
    await supabase.from("consultation_rounds").update(fields).eq("id", roundId);
    qc.invalidateQueries({ queryKey: ["admin-rounds"] });
  };

  const updateCaseStatus = async (status: string) => {
    if (!selectedId) return;
    await supabase.from("consultation_cases").update({ status }).eq("id", selectedId);
    qc.invalidateQueries({ queryKey: ["admin-consultations"] });
    toast({ title: `Статус: ${statusLabels[status]?.label || status}` });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-destructive">Доступ запрещён</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <Link to="/admin" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-2">
            <ArrowLeft className="w-4 h-4" />К панели управления
          </Link>
          <h1 className="text-2xl font-bold">Онлайн-консультации</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!selectedId ? (
          /* Case list */
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : cases.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">Нет консультаций</p>
            ) : (
              cases.map((c: any) => {
                const s = statusLabels[c.status] || statusLabels.submitted;
                return (
                  <Card key={c.id} className="cursor-pointer hover:border-primary" onClick={() => setSelectedId(c.id)}>
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{c.patient_full_name || "Без имени"}</p>
                        <p className="text-sm text-muted-foreground">
                          {c.parent_name && `Родитель: ${c.parent_name} · `}
                          {new Date(c.created_at).toLocaleDateString("ru-RU")}
                          {c.patient_next_step && ` · Выбор: ${c.patient_next_step === "appointment" ? "Очный приём" : "Планирование"}`}
                        </p>
                      </div>
                      <Badge className={s.color}>{s.label}</Badge>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          /* Case detail */
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setSelectedId(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />Назад к списку
            </Button>

            {/* Patient info */}
            {selectedCase && (
              <Card>
                <CardHeader><CardTitle>Пациент: {selectedCase.patient_full_name}</CardTitle></CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Родитель:</span> {selectedCase.parent_name || "—"}</div>
                  <div><span className="text-muted-foreground">Телефон:</span> {selectedCase.parent_phone || "—"}</div>
                  <div><span className="text-muted-foreground">WhatsApp род.:</span> {selectedCase.parent_whatsapp || "—"}</div>
                  <div><span className="text-muted-foreground">Telegram род.:</span> {selectedCase.parent_telegram || "—"}</div>
                  <div><span className="text-muted-foreground">WhatsApp пац.:</span> {selectedCase.patient_whatsapp || "—"}</div>
                  <div><span className="text-muted-foreground">Telegram пац.:</span> {selectedCase.patient_telegram || "—"}</div>
                  <div><span className="text-muted-foreground">ОМС:</span> {selectedCase.has_insurance ? "Да" : "Нет"}</div>
                  <div><span className="text-muted-foreground">Статус:</span> <Badge className={statusLabels[selectedCase.status]?.color}>{statusLabels[selectedCase.status]?.label}</Badge></div>
                </CardContent>
              </Card>
            )}

            {/* Status actions */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => updateCaseStatus("in_review")}>На рассмотрение</Button>
              <Button size="sm" variant="outline" onClick={() => updateCaseStatus("completed")} className="text-green-700">
                <CheckCircle2 className="w-4 h-4 mr-1" />Завершить
              </Button>
              <Button size="sm" variant="outline" onClick={() => updateCaseStatus("closed")}>Закрыть</Button>
            </div>

            {/* Rounds */}
            {rounds.map((round: any) => {
              const docs = allDocs.filter((d: any) => d.round_id === round.id);
              return (
                <Card key={round.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm">{round.round_number}</span>
                      Обращение {round.round_number}
                      <span className="text-sm text-muted-foreground font-normal ml-auto">
                        {new Date(round.created_at).toLocaleDateString("ru-RU")}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {round.complaints && (
                      <div>
                        <Label className="text-muted-foreground">Жалобы</Label>
                        <p className="text-sm whitespace-pre-wrap">{round.complaints}</p>
                      </div>
                    )}
                    {round.medical_history && (
                      <div>
                        <Label className="text-muted-foreground">Анамнез</Label>
                        <p className="text-sm whitespace-pre-wrap">{round.medical_history}</p>
                      </div>
                    )}

                    {/* Documents */}
                    {docs.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Документы</Label>
                        <div className="space-y-1 mt-1">
                          {docs.map((d: any) => (
                            <div key={d.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                              <FileText className="w-4 h-4 text-primary shrink-0" />
                              <span className="text-sm truncate flex-1">{d.file_name}</span>
                              <Button variant="ghost" size="sm" onClick={async () => {
                                const url = await getDocUrl(d.file_path);
                                if (url) window.open(url, "_blank");
                              }}><Download className="w-4 h-4" /></Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Analysis */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-1"><Brain className="w-4 h-4" />Оценка ИИ</Label>
                        <Button size="sm" onClick={() => runAiAnalysis(round.id)} disabled={aiLoading}>
                          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Brain className="w-4 h-4 mr-1" />}
                          Запустить ИИ
                        </Button>
                      </div>
                      {round.ai_assessment ? (
                        <div className="bg-primary/5 p-3 rounded text-sm whitespace-pre-wrap">
                          {round.ai_assessment_date && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {new Date(round.ai_assessment_date).toLocaleString("ru-RU")}
                            </p>
                          )}
                          {round.ai_assessment}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Ещё не проводился</p>
                      )}
                    </div>

                    {/* Doctor conclusion */}
                    <div className="space-y-2">
                      <Label>Заключение врача</Label>
                      <Textarea
                        defaultValue={round.doctor_conclusion || ""}
                        rows={4}
                        onBlur={e => {
                          if (e.target.value !== (round.doctor_conclusion || "")) {
                            updateRound(round.id, {
                              doctor_conclusion: e.target.value,
                              doctor_conclusion_date: new Date().toISOString(),
                            });
                          }
                        }}
                        placeholder="Введите заключение..."
                      />
                    </div>

                    {/* Mark complete */}
                    {!round.is_complete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateRound(round.id, { is_complete: true })}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Показать пациенту (завершить раунд)
                      </Button>
                    )}
                    {round.is_complete && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Виден пациенту</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminConsultations;
