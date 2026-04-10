import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, CheckCircle2, Clock, AlertCircle, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ConsultationTimelineProps {
  caseId: string;
  caseStatus: string;
  isEn: boolean;
  userId: string;
  onAcknowledge: () => void;
  onNextStep: (step: string) => void;
}

const statusConfig: Record<string, { en: string; ru: string; color: string; icon: any }> = {
  draft: { en: "Draft", ru: "Черновик", color: "bg-muted text-muted-foreground", icon: Clock },
  submitted: { en: "Submitted", ru: "Отправлена", color: "bg-yellow-500/10 text-yellow-700", icon: Clock },
  paid: { en: "Paid", ru: "Оплачена", color: "bg-blue-500/10 text-blue-700", icon: CheckCircle2 },
  in_review: { en: "Under Review", ru: "На рассмотрении", color: "bg-purple-500/10 text-purple-700", icon: AlertCircle },
  completed: { en: "Completed", ru: "Завершена", color: "bg-green-500/10 text-green-700", icon: CheckCircle2 },
  acknowledged: { en: "Acknowledged", ru: "Ознакомлен", color: "bg-green-600/10 text-green-800", icon: CheckCircle2 },
  closed: { en: "Closed", ru: "Закрыта", color: "bg-muted text-muted-foreground", icon: CheckCircle2 },
};

export default function ConsultationTimeline({
  caseId,
  caseStatus,
  isEn,
  onAcknowledge,
  onNextStep,
}: ConsultationTimelineProps) {
  const { data: rounds = [] } = useQuery({
    queryKey: ["consultation-rounds", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultation_rounds")
        .select("*")
        .eq("case_id", caseId)
        .order("round_number", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: allDocs = [] } = useQuery({
    queryKey: ["consultation-docs", caseId],
    queryFn: async () => {
      const roundIds = rounds.map(r => r.id);
      if (roundIds.length === 0) return [];
      const { data, error } = await supabase
        .from("consultation_documents")
        .select("*")
        .in("round_id", roundIds)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: rounds.length > 0,
  });

  const getDocUrl = async (path: string) => {
    const { data } = await supabase.storage.from("patient-documents").createSignedUrl(path, 3600);
    return data?.signedUrl;
  };

  const sc = statusConfig[caseStatus] || statusConfig.submitted;
  const showAcknowledge = caseStatus === "completed";
  const showNextStepChoice = caseStatus === "acknowledged";

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <sc.icon className="w-5 h-5" />
          <span className="font-medium">{isEn ? "Status" : "Статус"}:</span>
          <Badge className={sc.color}>{isEn ? sc.en : sc.ru}</Badge>
        </CardContent>
      </Card>

      {/* Timeline */}
      {rounds.map((round: any) => {
        const docs = allDocs.filter((d: any) => d.round_id === round.id);
        return (
          <Card key={round.id}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm">
                  {round.round_number}
                </span>
                {isEn ? `Round ${round.round_number}` : `Обращение ${round.round_number}`}
                <span className="text-sm text-muted-foreground font-normal ml-auto">
                  {new Date(round.created_at).toLocaleDateString(isEn ? "en-US" : "ru-RU")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Complaints */}
              {round.complaints && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                    {isEn ? "Complaints" : "Жалобы"}
                  </h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{round.complaints}</p>
                </div>
              )}

              {/* History */}
              {round.medical_history && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                    {isEn ? "Medical History" : "Анамнез"}
                  </h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{round.medical_history}</p>
                </div>
              )}

              {/* Documents */}
              {docs.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    {isEn ? "Documents" : "Документы"}
                  </h4>
                  <div className="space-y-1">
                    {docs.map((doc: any) => (
                      <div key={doc.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm truncate flex-1">{doc.file_name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const url = await getDocUrl(doc.file_path);
                            if (url) window.open(url, "_blank");
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Assessment (visible only when completed) */}
              {round.ai_assessment && round.is_complete && (
                <div className="border-l-4 border-primary pl-4 py-2 bg-primary/5 rounded-r">
                  <h4 className="text-sm font-semibold text-primary mb-1 flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {isEn ? "AI Preliminary Assessment" : "Предварительная оценка ИИ"}
                    {round.ai_assessment_date && (
                      <span className="font-normal text-muted-foreground ml-2">
                        {new Date(round.ai_assessment_date).toLocaleDateString(isEn ? "en-US" : "ru-RU")}
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{round.ai_assessment}</p>
                </div>
              )}

              {/* Doctor conclusion (visible only when completed) */}
              {round.doctor_conclusion && round.is_complete && (
                <div className="border-l-4 border-green-600 pl-4 py-2 bg-green-50 dark:bg-green-900/10 rounded-r">
                  <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">
                    {isEn ? "Doctor's Conclusion" : "Заключение врача"}
                    {round.doctor_conclusion_date && (
                      <span className="font-normal text-muted-foreground ml-2">
                        {new Date(round.doctor_conclusion_date).toLocaleDateString(isEn ? "en-US" : "ru-RU")}
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{round.doctor_conclusion}</p>
                </div>
              )}

              {/* Waiting states */}
              {!round.is_complete && caseStatus !== "draft" && (
                <div className="text-sm text-muted-foreground italic py-2">
                  {isEn ? "Awaiting doctor's review..." : "Ожидает рассмотрения врачом..."}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Acknowledge button */}
      {showAcknowledge && (
        <Card className="border-primary">
          <CardContent className="py-6 text-center space-y-4">
            <p className="text-foreground">
              {isEn
                ? "Please confirm that you have reviewed the doctor's conclusion."
                : "Пожалуйста, подтвердите, что вы ознакомились с заключением врача."}
            </p>
            <Button onClick={onAcknowledge} size="lg">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isEn ? "I have reviewed the conclusion" : "Ознакомлен с заключением"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Next step choice */}
      {showNextStepChoice && (
        <Card className="border-primary">
          <CardContent className="py-6 space-y-4">
            <p className="text-center text-foreground font-medium">
              {isEn ? "What would you like to do next?" : "Что вы хотели бы сделать дальше?"}
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Button variant="default" size="lg" onClick={() => onNextStep("appointment")} className="h-auto py-4">
                <div className="text-center">
                  <div className="font-semibold">{isEn ? "Book an in-person visit" : "Записаться на очный приём"}</div>
                  <div className="text-xs opacity-80 mt-1">
                    {isEn ? "Schedule a consultation at the clinic" : "Запланировать консультацию в клинике"}
                  </div>
                </div>
              </Button>
              <Button variant="outline" size="lg" onClick={() => onNextStep("planning")} className="h-auto py-4">
                <div className="text-center">
                  <div className="font-semibold">
                    {isEn ? "Connect with assistant" : "Связаться с помощником"}
                  </div>
                  <div className="text-xs opacity-80 mt-1">
                    {isEn ? "For treatment or surgery planning" : "По поводу планирования лечения или операции"}
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
