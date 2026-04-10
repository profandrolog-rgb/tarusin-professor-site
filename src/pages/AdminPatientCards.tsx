import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, User, FileText, MessageCircle, Upload, Loader2, Save, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const AdminPatientCards = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<any>(null);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["admin-patient-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_cards")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const filtered = cards.filter((c: any) =>
    c.patient_full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.parent_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return <div className="p-8 text-center text-muted-foreground">Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <Link to="/admin" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {isEn ? "Admin Panel" : "Панель управления"}
          </Link>
          <h1 className="text-2xl font-bold">{isEn ? "Patient Cards" : "Карточки пациентов"}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isEn ? "Search patients..." : "Поиск пациентов..."}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            {isEn ? "No patient cards yet" : "Карточек пока нет"}
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((card: any) => (
              <Card key={card.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedCard(card)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">{card.patient_full_name || "—"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{isEn ? "Parent" : "Родитель"}: {card.parent_name || "—"}</p>
                  {card.diagnosis && <p className="text-sm text-muted-foreground mt-1">{isEn ? "Diagnosis" : "Диагноз"}: {card.diagnosis.substring(0, 50)}...</p>}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(card.updated_at).toLocaleDateString(isEn ? "en-US" : "ru-RU")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        {selectedCard && (
          <PatientCardDetail
            card={selectedCard}
            isEn={isEn}
            onClose={() => setSelectedCard(null)}
            onSave={() => {
              qc.invalidateQueries({ queryKey: ["admin-patient-cards"] });
              setSelectedCard(null);
            }}
          />
        )}
      </main>
    </div>
  );
};

function PatientCardDetail({ card, isEn, onClose, onSave }: { card: any; isEn: boolean; onClose: () => void; onSave: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ ...card });
  const [uploading, setUploading] = useState(false);

  // Chat history
  const { data: chatMessages = [] } = useQuery({
    queryKey: ["admin-chat", card.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_chat_messages")
        .select("*")
        .eq("user_id", card.user_id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Documents
  const { data: docs = [] } = useQuery({
    queryKey: ["admin-docs", card.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_documents")
        .select("*")
        .eq("card_id", card.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { id, created_at, updated_at, ...updateData } = form;
      const { error } = await supabase.from("patient_cards").update(updateData).eq("id", card.id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: isEn ? "Saved" : "Сохранено" }); onSave(); },
    onError: () => toast({ title: isEn ? "Error" : "Ошибка", variant: "destructive" }),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const filePath = `${card.user_id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("patient-documents").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from("patient_documents").insert({
        card_id: card.id,
        user_id: card.user_id,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type || "application/pdf",
        uploaded_by: "admin",
      });
      if (insertError) throw insertError;
      toast({ title: isEn ? "File uploaded" : "Файл загружен" });
    } catch {
      toast({ title: isEn ? "Upload error" : "Ошибка загрузки", variant: "destructive" });
    }
    setUploading(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.patient_full_name || (isEn ? "Patient Card" : "Карточка пациента")}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="doctor" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="doctor">{isEn ? "Doctor Notes" : "Заметки врача"}</TabsTrigger>
            <TabsTrigger value="contacts">{isEn ? "Contacts" : "Контакты"}</TabsTrigger>
            <TabsTrigger value="docs">{isEn ? "Documents" : "Документы"} ({docs.length})</TabsTrigger>
            <TabsTrigger value="chat">{isEn ? "Chat" : "Чат"} ({chatMessages.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="doctor" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{isEn ? "Diagnosis" : "Диагноз"}</Label>
              <Textarea value={form.diagnosis} onChange={(e) => setForm((p: any) => ({ ...p, diagnosis: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{isEn ? "Treatment Tactics" : "Тактика лечения"}</Label>
              <Textarea value={form.treatment_tactics} onChange={(e) => setForm((p: any) => ({ ...p, treatment_tactics: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{isEn ? "Treatment Plan (what's next)" : "План лечения (что дальше)"}</Label>
              <Textarea value={form.treatment_plan} onChange={(e) => setForm((p: any) => ({ ...p, treatment_plan: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>{isEn ? "Patient Specifics" : "Особенности пациента"}</Label>
              <Textarea value={form.patient_specifics} onChange={(e) => setForm((p: any) => ({ ...p, patient_specifics: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{isEn ? "Communication Notes" : "Особенности коммуникации"}</Label>
              <Textarea value={form.communication_notes} onChange={(e) => setForm((p: any) => ({ ...p, communication_notes: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{isEn ? "AI Reasoning" : "Рассуждения ИИ"}</Label>
              <Textarea value={form.ai_reasoning} onChange={(e) => setForm((p: any) => ({ ...p, ai_reasoning: e.target.value }))} rows={3} className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>{isEn ? "Notes" : "Примечания"}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((p: any) => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" /> {isEn ? "Save" : "Сохранить"}
            </Button>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4 mt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>{isEn ? "Patient Name" : "ФИО пациента"}</Label><Input value={form.patient_full_name} readOnly className="bg-muted/30" /></div>
              <div><Label>{isEn ? "Parent" : "Родитель"}</Label><Input value={form.parent_name} readOnly className="bg-muted/30" /></div>
              <div><Label>{isEn ? "Phone" : "Телефон"}</Label><Input value={form.parent_phone} readOnly className="bg-muted/30" /></div>
              <div><Label>WhatsApp</Label><Input value={form.parent_whatsapp} readOnly className="bg-muted/30" /></div>
              <div><Label>Telegram</Label><Input value={form.parent_telegram} readOnly className="bg-muted/30" /></div>
              <div><Label>{isEn ? "Insurance" : "Полис ОМС"}</Label><Input value={form.has_insurance ? "✅" : "❌"} readOnly className="bg-muted/30" /></div>
            </div>
          </TabsContent>

          <TabsContent value="docs" className="mt-4">
            <div className="mb-4">
              <Label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isEn ? "Upload Document" : "Загрузить документ"}
              </Label>
              <input id="file-upload" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} />
            </div>
            {docs.length === 0 ? (
              <p className="text-muted-foreground text-sm">{isEn ? "No documents" : "Нет документов"}</p>
            ) : (
              <div className="space-y-2">
                {docs.map((d: any) => (
                  <div key={d.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm flex-1">{d.file_name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            {chatMessages.length === 0 ? (
              <p className="text-muted-foreground text-sm">{isEn ? "No messages" : "Нет сообщений"}</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {chatMessages.map((m: any) => (
                  <div key={m.id} className={`p-3 rounded-lg text-sm ${m.role === "user" ? "bg-primary/5 border-l-2 border-primary" : "bg-muted"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{m.role === "user" ? (isEn ? "Patient" : "Пациент") : "AI"}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default AdminPatientCards;
