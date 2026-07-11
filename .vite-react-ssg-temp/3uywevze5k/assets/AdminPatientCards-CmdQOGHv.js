import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { u as useAuth, e as useToast, s as supabase, I as Input, C as Card, a as CardContent, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, L as Label, T as Textarea, B as Button, b as Badge } from "../main.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CJYPrMmK.js";
import { ArrowLeft, Search, Loader2, User, Save, Upload, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@supabase/supabase-js";
import "i18next";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
import "react-helmet-async";
import "@radix-ui/react-tabs";
const AdminPatientCards = () => {
  const { isAdmin } = useAuth();
  useToast();
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["admin-patient-cards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patient_cards").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin
  });
  const filtered = cards.filter(
    (c) => {
      var _a, _b;
      return ((_a = c.patient_full_name) == null ? void 0 : _a.toLowerCase().includes(search.toLowerCase())) || ((_b = c.parent_name) == null ? void 0 : _b.toLowerCase().includes(search.toLowerCase()));
    }
  );
  if (!isAdmin) {
    return /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-muted-foreground", children: "Access denied" });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-6", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-3 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        isEn ? "Admin Panel" : "Панель управления"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: isEn ? "Patient Cards" : "Карточки пациентов" })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex gap-4 mb-6", children: /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-md", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: search,
            onChange: (e) => setSearch(e.target.value),
            placeholder: isEn ? "Search patients..." : "Поиск пациентов...",
            className: "pl-10"
          }
        )
      ] }) }),
      isLoading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) }) : filtered.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground py-12", children: isEn ? "No patient cards yet" : "Карточек пока нет" }) : /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-4", children: filtered.map((card) => /* @__PURE__ */ jsx(Card, { className: "hover:shadow-lg transition-shadow cursor-pointer", onClick: () => setSelectedCard(card), children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
          /* @__PURE__ */ jsx(User, { className: "w-5 h-5 text-primary" }),
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: card.patient_full_name || "—" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          isEn ? "Parent" : "Родитель",
          ": ",
          card.parent_name || "—"
        ] }),
        card.diagnosis && /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
          isEn ? "Diagnosis" : "Диагноз",
          ": ",
          card.diagnosis.substring(0, 50),
          "..."
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-2", children: new Date(card.updated_at).toLocaleDateString(isEn ? "en-US" : "ru-RU") })
      ] }) }, card.id)) }),
      selectedCard && /* @__PURE__ */ jsx(
        PatientCardDetail,
        {
          card: selectedCard,
          isEn,
          onClose: () => setSelectedCard(null),
          onSave: () => {
            qc.invalidateQueries({ queryKey: ["admin-patient-cards"] });
            setSelectedCard(null);
          }
        }
      )
    ] })
  ] });
};
function PatientCardDetail({ card, isEn, onClose, onSave }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ ...card });
  const [uploading, setUploading] = useState(false);
  const { data: chatMessages = [] } = useQuery({
    queryKey: ["admin-chat", card.user_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("patient_chat_messages").select("*").eq("user_id", card.user_id).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    }
  });
  const { data: docs = [] } = useQuery({
    queryKey: ["admin-docs", card.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("patient_documents").select("*").eq("card_id", card.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { id, created_at, updated_at, ...updateData } = form;
      const { error } = await supabase.from("patient_cards").update(updateData).eq("id", card.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: isEn ? "Saved" : "Сохранено" });
      onSave();
    },
    onError: () => toast({ title: isEn ? "Error" : "Ошибка", variant: "destructive" })
  });
  const handleFileUpload = async (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
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
        uploaded_by: "admin"
      });
      if (insertError) throw insertError;
      toast({ title: isEn ? "File uploaded" : "Файл загружен" });
    } catch {
      toast({ title: isEn ? "Upload error" : "Ошибка загрузки", variant: "destructive" });
    }
    setUploading(false);
  };
  return /* @__PURE__ */ jsx(Dialog, { open: true, onOpenChange: onClose, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: form.patient_full_name || (isEn ? "Patient Card" : "Карточка пациента") }) }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "doctor", className: "mt-4", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "doctor", children: isEn ? "Doctor Notes" : "Заметки врача" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "contacts", children: isEn ? "Contacts" : "Контакты" }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "docs", children: [
          isEn ? "Documents" : "Документы",
          " (",
          docs.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "chat", children: [
          isEn ? "Chat" : "Чат",
          " (",
          chatMessages.length,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "doctor", className: "space-y-4 mt-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { children: isEn ? "Diagnosis" : "Диагноз" }),
          /* @__PURE__ */ jsx(Textarea, { value: form.diagnosis, onChange: (e) => setForm((p) => ({ ...p, diagnosis: e.target.value })), rows: 2 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { children: isEn ? "Treatment Tactics" : "Тактика лечения" }),
          /* @__PURE__ */ jsx(Textarea, { value: form.treatment_tactics, onChange: (e) => setForm((p) => ({ ...p, treatment_tactics: e.target.value })), rows: 2 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { children: isEn ? "Treatment Plan (what's next)" : "План лечения (что дальше)" }),
          /* @__PURE__ */ jsx(Textarea, { value: form.treatment_plan, onChange: (e) => setForm((p) => ({ ...p, treatment_plan: e.target.value })), rows: 3 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { children: isEn ? "Patient Specifics" : "Особенности пациента" }),
          /* @__PURE__ */ jsx(Textarea, { value: form.patient_specifics, onChange: (e) => setForm((p) => ({ ...p, patient_specifics: e.target.value })), rows: 2 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { children: isEn ? "Communication Notes" : "Особенности коммуникации" }),
          /* @__PURE__ */ jsx(Textarea, { value: form.communication_notes, onChange: (e) => setForm((p) => ({ ...p, communication_notes: e.target.value })), rows: 2 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { children: isEn ? "AI Reasoning" : "Рассуждения ИИ" }),
          /* @__PURE__ */ jsx(Textarea, { value: form.ai_reasoning, onChange: (e) => setForm((p) => ({ ...p, ai_reasoning: e.target.value })), rows: 3, className: "bg-muted/50" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { children: isEn ? "Notes" : "Примечания" }),
          /* @__PURE__ */ jsx(Textarea, { value: form.notes, onChange: (e) => setForm((p) => ({ ...p, notes: e.target.value })), rows: 2 })
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: () => saveMutation.mutate(), disabled: saveMutation.isPending, children: [
          /* @__PURE__ */ jsx(Save, { className: "w-4 h-4 mr-2" }),
          " ",
          isEn ? "Save" : "Сохранить"
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "contacts", className: "space-y-4 mt-4", children: /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: isEn ? "Patient Name" : "ФИО пациента" }),
          /* @__PURE__ */ jsx(Input, { value: form.patient_full_name, readOnly: true, className: "bg-muted/30" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: isEn ? "Parent" : "Родитель" }),
          /* @__PURE__ */ jsx(Input, { value: form.parent_name, readOnly: true, className: "bg-muted/30" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: isEn ? "Phone" : "Телефон" }),
          /* @__PURE__ */ jsx(Input, { value: form.parent_phone, readOnly: true, className: "bg-muted/30" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "WhatsApp" }),
          /* @__PURE__ */ jsx(Input, { value: form.parent_whatsapp, readOnly: true, className: "bg-muted/30" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Telegram" }),
          /* @__PURE__ */ jsx(Input, { value: form.parent_telegram, readOnly: true, className: "bg-muted/30" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: isEn ? "Insurance" : "Полис ОМС" }),
          /* @__PURE__ */ jsx(Input, { value: form.has_insurance ? "✅" : "❌", readOnly: true, className: "bg-muted/30" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "docs", className: "mt-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsxs(Label, { htmlFor: "file-upload", className: "cursor-pointer inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90", children: [
            uploading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
            isEn ? "Upload Document" : "Загрузить документ"
          ] }),
          /* @__PURE__ */ jsx("input", { id: "file-upload", type: "file", className: "hidden", accept: ".pdf,.jpg,.jpeg,.png", onChange: handleFileUpload })
        ] }),
        docs.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: isEn ? "No documents" : "Нет документов" }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: docs.map((d) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-3 border rounded-lg", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-primary" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm flex-1", children: d.file_name }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: new Date(d.created_at).toLocaleDateString() })
        ] }, d.id)) })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "chat", className: "mt-4", children: chatMessages.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: isEn ? "No messages" : "Нет сообщений" }) : /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-[400px] overflow-y-auto", children: chatMessages.map((m) => /* @__PURE__ */ jsxs("div", { className: `p-3 rounded-lg text-sm ${m.role === "user" ? "bg-primary/5 border-l-2 border-primary" : "bg-muted"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: m.role === "user" ? isEn ? "Patient" : "Пациент" : "AI" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: new Date(m.created_at).toLocaleString() })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-foreground whitespace-pre-wrap", children: m.content })
      ] }, m.id)) }) })
    ] })
  ] }) });
}
export {
  AdminPatientCards as default
};
