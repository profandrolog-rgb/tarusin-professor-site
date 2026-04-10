import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Loader2, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import PageMeta from "@/components/PageMeta";
import ConsultationForm from "@/components/consultation/ConsultationForm";
import ConsultationTimeline from "@/components/consultation/ConsultationTimeline";
import AddRoundForm from "@/components/consultation/AddRoundForm";

const statusLabels: Record<string, { en: string; ru: string; color: string }> = {
  draft: { en: "Draft", ru: "Черновик", color: "bg-muted text-muted-foreground" },
  submitted: { en: "Submitted", ru: "Отправлена", color: "bg-yellow-500/10 text-yellow-700" },
  paid: { en: "Paid", ru: "Оплачена", color: "bg-blue-500/10 text-blue-700" },
  in_review: { en: "Under Review", ru: "На рассмотрении", color: "bg-purple-500/10 text-purple-700" },
  completed: { en: "Completed", ru: "Завершена", color: "bg-green-500/10 text-green-700" },
  acknowledged: { en: "Acknowledged", ru: "Ознакомлен", color: "bg-green-600/10 text-green-800" },
  closed: { en: "Closed", ru: "Закрыта", color: "bg-muted text-muted-foreground" },
};

const PatientPortal = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const qc = useQueryClient();

  const [view, setView] = useState<"list" | "new" | "detail">("list");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showAddRound, setShowAddRound] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/portal");
  }, [authLoading, user, navigate]);

  // All cases for this user
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["my-consultations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("consultation_cases")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const selectedCase = cases.find((c: any) => c.id === selectedCaseId);

  // Get rounds count for add-round
  const { data: rounds = [] } = useQuery({
    queryKey: ["consultation-rounds", selectedCaseId],
    queryFn: async () => {
      if (!selectedCaseId) return [];
      const { data, error } = await supabase
        .from("consultation_rounds")
        .select("id, round_number")
        .eq("case_id", selectedCaseId)
        .order("round_number", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCaseId,
  });

  const handleAcknowledge = async () => {
    if (!selectedCaseId) return;
    await supabase
      .from("consultation_cases")
      .update({ status: "acknowledged", patient_acknowledged_at: new Date().toISOString() })
      .eq("id", selectedCaseId);
    qc.invalidateQueries({ queryKey: ["my-consultations"] });
    toast({ title: isEn ? "Acknowledged" : "Ознакомление подтверждено" });
  };

  const handleNextStep = async (step: string) => {
    if (!selectedCaseId) return;
    await supabase
      .from("consultation_cases")
      .update({ patient_next_step: step, status: "closed" })
      .eq("id", selectedCaseId);
    qc.invalidateQueries({ queryKey: ["my-consultations"] });
    toast({
      title: isEn
        ? step === "appointment" ? "Appointment request sent" : "Planning request sent"
        : step === "appointment" ? "Заявка на приём отправлена" : "Заявка на планирование отправлена",
    });
  };

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["my-consultations"] });
    qc.invalidateQueries({ queryKey: ["consultation-rounds"] });
    qc.invalidateQueries({ queryKey: ["consultation-docs"] });
  };

  const canAddRound = selectedCase && ["closed", "acknowledged"].includes(selectedCase.status);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={isEn ? "Patient Portal — Prof. Tarusin" : "Личный кабинет — Проф. Тарусин"}
        description={isEn ? "Online consultation portal" : "Портал онлайн-консультаций"}
        path="/portal"
      />

      <header className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {isEn ? "Home" : "На главную"}
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">
            {isEn ? "Online Consultation Portal" : "Портал онлайн-консультаций"}
          </h1>
          <p className="text-primary-foreground/80 mt-1">{user.email}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* List view */}
        {view === "list" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {isEn ? "My Consultations" : "Мои консультации"}
              </h2>
              <Button onClick={() => setView("new")}>
                <Plus className="w-4 h-4 mr-2" />
                {isEn ? "New Consultation" : "Новая консультация"}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : cases.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {isEn ? "No consultations yet" : "Консультаций пока нет"}
                  </p>
                  <Button onClick={() => setView("new")}>
                    {isEn ? "Create your first consultation" : "Создать первую консультацию"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {cases.map((c: any) => {
                  const s = statusLabels[c.status] || statusLabels.submitted;
                  return (
                    <Card
                      key={c.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => {
                        setSelectedCaseId(c.id);
                        setView("detail");
                      }}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{c.patient_full_name || (isEn ? "Unnamed" : "Без имени")}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(c.created_at).toLocaleDateString(isEn ? "en-US" : "ru-RU")}
                            </p>
                          </div>
                          <Badge className={s.color}>{isEn ? s.en : s.ru}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* New consultation form */}
        {view === "new" && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setView("list")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isEn ? "Back" : "Назад"}
            </Button>
            <ConsultationForm
              userId={user.id}
              isEn={isEn}
              onCreated={() => {
                refresh();
                setView("list");
              }}
            />
          </div>
        )}

        {/* Case detail */}
        {view === "detail" && selectedCase && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => { setView("list"); setShowAddRound(false); }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isEn ? "Back to list" : "К списку"}
            </Button>

            <ConsultationTimeline
              caseId={selectedCase.id}
              caseStatus={selectedCase.status}
              isEn={isEn}
              userId={user.id}
              onAcknowledge={handleAcknowledge}
              onNextStep={handleNextStep}
            />

            {/* Add round (reopen) */}
            {canAddRound && !showAddRound && (
              <Button variant="outline" className="w-full" onClick={() => setShowAddRound(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {isEn ? "Submit new results / Re-open case" : "Загрузить новые результаты / Повторное обращение"}
              </Button>
            )}

            {showAddRound && (
              <AddRoundForm
                caseId={selectedCase.id}
                userId={user.id}
                nextRoundNumber={(rounds[0]?.round_number || 0) + 1}
                isEn={isEn}
                onCreated={() => {
                  refresh();
                  setShowAddRound(false);
                }}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientPortal;
