import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, MessageCircle, Calendar, User, Save, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import PageMeta from "@/components/PageMeta";
import PatientPortalChat from "@/components/portal/PatientPortalChat";

const statusLabels: Record<string, { en: string; ru: string; color: string }> = {
  pending: { en: "Pending", ru: "Новая", color: "bg-yellow-500/10 text-yellow-700" },
  confirmed: { en: "Confirmed", ru: "Подтверждена", color: "bg-green-500/10 text-green-700" },
  completed: { en: "Completed", ru: "Завершена", color: "bg-muted text-muted-foreground" },
  cancelled: { en: "Cancelled", ru: "Отменена", color: "bg-destructive/10 text-destructive" },
};

const PatientPortal = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/portal");
  }, [authLoading, user, navigate]);

  // Patient card
  const { data: card, isLoading: cardLoading } = useQuery({
    queryKey: ["patient-card", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("patient_cards")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Appointment requests by email
  const { data: appointments = [] } = useQuery({
    queryKey: ["my-appointments", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from("appointment_requests")
        .select("*")
        .eq("contact_email", user.email)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.email,
  });

  // Documents
  const { data: documents = [] } = useQuery({
    queryKey: ["patient-documents", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("patient_documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Contact form state
  const [contactForm, setContactForm] = useState({
    patient_full_name: "",
    parent_name: "",
    parent_phone: "",
    parent_whatsapp: "",
    parent_telegram: "",
    patient_whatsapp: "",
    patient_telegram: "",
    has_insurance: false,
  });

  useEffect(() => {
    if (card) {
      setContactForm({
        patient_full_name: card.patient_full_name || "",
        parent_name: card.parent_name || "",
        parent_phone: card.parent_phone || "",
        parent_whatsapp: card.parent_whatsapp || "",
        parent_telegram: card.parent_telegram || "",
        patient_whatsapp: card.patient_whatsapp || "",
        patient_telegram: card.patient_telegram || "",
        has_insurance: card.has_insurance || false,
      });
    }
  }, [card]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (card) {
        const { error } = await supabase
          .from("patient_cards")
          .update(contactForm)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("patient_cards")
          .insert({ ...contactForm, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient-card"] });
      toast({ title: isEn ? "Saved" : "Сохранено" });
    },
    onError: () => toast({ title: isEn ? "Error saving" : "Ошибка сохранения", variant: "destructive" }),
  });

  const getDocumentUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("patient-documents")
      .createSignedUrl(filePath, 3600);
    if (error || !data) return null;
    return data.signedUrl;
  };

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
        description={isEn ? "Your personal patient portal" : "Ваш личный кабинет пациента"}
        path="/portal"
      />

      <header className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {isEn ? "Home" : "На главную"}
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">
            {isEn ? "Patient Portal" : "Личный кабинет"}
          </h1>
          <p className="text-primary-foreground/80 mt-1">{user.email}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">{isEn ? "Profile" : "Профиль"}</span>
            </TabsTrigger>
            <TabsTrigger value="appointments">
              <Calendar className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">{isEn ? "Visits" : "Визиты"}</span>
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">{isEn ? "Documents" : "Документы"}</span>
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageCircle className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">{isEn ? "Chat" : "Чат"}</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{isEn ? "Contact Information" : "Контактные данные"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isEn ? "Patient Full Name" : "ФИО пациента"}</Label>
                    <Input
                      value={contactForm.patient_full_name}
                      onChange={(e) => setContactForm(p => ({ ...p, patient_full_name: e.target.value }))}
                      placeholder={isEn ? "Full name" : "Иванов Иван Иванович"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isEn ? "Parent Name" : "Имя-отчество родителя"}</Label>
                    <Input
                      value={contactForm.parent_name}
                      onChange={(e) => setContactForm(p => ({ ...p, parent_name: e.target.value }))}
                      placeholder={isEn ? "Parent name" : "Мария Ивановна"}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{isEn ? "Phone" : "Телефон"}</Label>
                    <Input
                      value={contactForm.parent_phone}
                      onChange={(e) => setContactForm(p => ({ ...p, parent_phone: e.target.value }))}
                      placeholder="+7..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isEn ? "Parent WhatsApp" : "WhatsApp родителя"}</Label>
                    <Input
                      value={contactForm.parent_whatsapp}
                      onChange={(e) => setContactForm(p => ({ ...p, parent_whatsapp: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isEn ? "Parent Telegram" : "Telegram родителя"}</Label>
                    <Input
                      value={contactForm.parent_telegram}
                      onChange={(e) => setContactForm(p => ({ ...p, parent_telegram: e.target.value }))}
                      placeholder="@username"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isEn ? "Patient WhatsApp" : "WhatsApp пациента"}</Label>
                    <Input
                      value={contactForm.patient_whatsapp}
                      onChange={(e) => setContactForm(p => ({ ...p, patient_whatsapp: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isEn ? "Patient Telegram" : "Telegram пациента"}</Label>
                    <Input
                      value={contactForm.patient_telegram}
                      onChange={(e) => setContactForm(p => ({ ...p, patient_telegram: e.target.value }))}
                      placeholder="@username"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={contactForm.has_insurance}
                    onCheckedChange={(c) => setContactForm(p => ({ ...p, has_insurance: c === true }))}
                  />
                  <Label>{isEn ? "Patient has health insurance (OMS)" : "У пациента есть полис ОМС"}</Label>
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {isEn ? "Save" : "Сохранить"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>{isEn ? "My Appointment Requests" : "Мои заявки на приём"}</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {isEn ? "No appointment requests yet" : "Заявок пока нет"}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((a: any) => {
                      const s = statusLabels[a.status] || statusLabels.pending;
                      return (
                        <div key={a.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">
                              {new Date(a.created_at).toLocaleDateString(isEn ? "en-US" : "ru-RU")}
                            </span>
                            <Badge variant="secondary" className={s.color}>
                              {isEn ? s.en : s.ru}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground">{a.problem_description}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>{isEn ? "My Documents" : "Мои документы"}</CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {isEn ? "No documents uploaded yet. Your doctor will upload results here." : "Документов пока нет. Врач загрузит сюда результаты обследований."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(doc.created_at).toLocaleDateString(isEn ? "en-US" : "ru-RU")}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const url = await getDocumentUrl(doc.file_path);
                            if (url) window.open(url, "_blank");
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <PatientPortalChat userId={user.id} isEn={isEn} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PatientPortal;
