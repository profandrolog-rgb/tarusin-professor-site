import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { e as useToast, C as Card, c as CardHeader, d as CardTitle, a as CardContent, L as Label, I as Input, r as Checkbox, T as Textarea, B as Button, s as supabase, b as Badge, u as useAuth, P as PageMeta } from "../main.mjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, X, Loader2, Download, MessageCircle, CheckCircle2, Clock, AlertCircle, ArrowLeft, Plus, FolderOpen } from "lucide-react";
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
function ConsultationForm({ userId, isEn, onCreated }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
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
    medical_history: ""
  });
  const handleFileAdd = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        (f) => f.type === "application/pdf" || f.type.startsWith("image/")
      );
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };
  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const handleSubmit = async () => {
    if (!form.patient_full_name.trim() || !form.complaints.trim()) {
      toast({
        title: isEn ? "Please fill required fields" : "Заполните обязательные поля",
        description: isEn ? "Patient name and complaints are required" : "ФИО пациента и жалобы обязательны",
        variant: "destructive"
      });
      return;
    }
    setSubmitting(true);
    try {
      const { data: caseData, error: caseErr } = await supabase.from("consultation_cases").insert({
        user_id: userId,
        patient_full_name: form.patient_full_name.trim(),
        parent_name: form.parent_name.trim(),
        parent_phone: form.parent_phone.trim(),
        parent_whatsapp: form.parent_whatsapp.trim(),
        parent_telegram: form.parent_telegram.trim(),
        patient_whatsapp: form.patient_whatsapp.trim(),
        patient_telegram: form.patient_telegram.trim(),
        has_insurance: form.has_insurance,
        status: "submitted"
      }).select("id").single();
      if (caseErr) throw caseErr;
      const { data: roundData, error: roundErr } = await supabase.from("consultation_rounds").insert({
        case_id: caseData.id,
        user_id: userId,
        round_number: 1,
        complaints: form.complaints.trim(),
        medical_history: form.medical_history.trim()
      }).select("id").single();
      if (roundErr) throw roundErr;
      for (const file of files) {
        const filePath = `${userId}/${caseData.id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("patient-documents").upload(filePath, file);
        if (uploadErr) {
          console.error("Upload error:", uploadErr);
          continue;
        }
        await supabase.from("consultation_documents").insert({
          round_id: roundData.id,
          user_id: userId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type
        });
      }
      toast({ title: isEn ? "Consultation submitted!" : "Консультация отправлена!" });
      onCreated();
    } catch (err) {
      console.error(err);
      toast({
        title: isEn ? "Error" : "Ошибка",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: isEn ? "New Online Consultation" : "Новая онлайн-консультация" }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground", children: isEn ? "Patient & Parent Information" : "Данные пациента и родителя" }),
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: isEn ? "Patient Full Name *" : "ФИО пациента *" }),
            /* @__PURE__ */ jsx(Input, { value: form.patient_full_name, onChange: (e) => set("patient_full_name", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: isEn ? "Parent Name" : "Имя-отчество родителя" }),
            /* @__PURE__ */ jsx(Input, { value: form.parent_name, onChange: (e) => set("parent_name", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: isEn ? "Phone" : "Телефон" }),
            /* @__PURE__ */ jsx(Input, { value: form.parent_phone, onChange: (e) => set("parent_phone", e.target.value), placeholder: "+7..." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: isEn ? "Parent WhatsApp" : "WhatsApp родителя" }),
            /* @__PURE__ */ jsx(Input, { value: form.parent_whatsapp, onChange: (e) => set("parent_whatsapp", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: isEn ? "Parent Telegram" : "Telegram родителя" }),
            /* @__PURE__ */ jsx(Input, { value: form.parent_telegram, onChange: (e) => set("parent_telegram", e.target.value), placeholder: "@username" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: isEn ? "Patient WhatsApp" : "WhatsApp пациента" }),
            /* @__PURE__ */ jsx(Input, { value: form.patient_whatsapp, onChange: (e) => set("patient_whatsapp", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: isEn ? "Patient Telegram" : "Telegram пациента" }),
            /* @__PURE__ */ jsx(Input, { value: form.patient_telegram, onChange: (e) => set("patient_telegram", e.target.value), placeholder: "@username" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Checkbox, { checked: form.has_insurance, onCheckedChange: (c) => set("has_insurance", c === true) }),
          /* @__PURE__ */ jsx(Label, { children: isEn ? "Patient has health insurance (OMS)" : "У пациента есть полис ОМС" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground", children: isEn ? "Medical Information" : "Медицинская информация" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { children: isEn ? "Complaints *" : "Жалобы *" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: form.complaints,
              onChange: (e) => set("complaints", e.target.value),
              placeholder: isEn ? "Describe the complaints in detail..." : "Опишите жалобы подробно...",
              rows: 4
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { children: isEn ? "Medical History" : "История обращений / анамнез" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: form.medical_history,
              onChange: (e) => set("medical_history", e.target.value),
              placeholder: isEn ? "Previous consultations, treatments, diagnoses..." : "Предыдущие обращения, лечение, диагнозы...",
              rows: 4
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground", children: isEn ? "Documents (analyses, conclusions)" : "Документы (анализы, заключения)" }),
        /* @__PURE__ */ jsxs("div", { className: "border-2 border-dashed border-border rounded-lg p-6 text-center", children: [
          /* @__PURE__ */ jsx(Upload, { className: "w-8 h-8 mx-auto text-muted-foreground mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-3", children: isEn ? "Upload PDF or images" : "Загрузите PDF или изображения" }),
          /* @__PURE__ */ jsxs("label", { className: "cursor-pointer", children: [
            /* @__PURE__ */ jsx(Input, { type: "file", multiple: true, accept: ".pdf,image/*", onChange: handleFileAdd, className: "hidden" }),
            /* @__PURE__ */ jsx(Button, { variant: "outline", type: "button", asChild: true, children: /* @__PURE__ */ jsx("span", { children: isEn ? "Choose files" : "Выбрать файлы" }) })
          ] })
        ] }),
        files.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-2", children: files.map((f, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2 bg-muted rounded", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-primary shrink-0" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm truncate flex-1", children: f.name }),
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: () => removeFile(i), children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: handleSubmit, disabled: submitting, size: "lg", className: "w-full", children: [
        submitting ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : null,
        isEn ? "Submit Consultation Request" : "Отправить заявку на консультацию"
      ] })
    ] })
  ] });
}
const statusConfig = {
  draft: { en: "Draft", ru: "Черновик", color: "bg-muted text-muted-foreground", icon: Clock },
  submitted: { en: "Submitted", ru: "Отправлена", color: "bg-yellow-500/10 text-yellow-700", icon: Clock },
  paid: { en: "Paid", ru: "Оплачена", color: "bg-blue-500/10 text-blue-700", icon: CheckCircle2 },
  in_review: { en: "Under Review", ru: "На рассмотрении", color: "bg-purple-500/10 text-purple-700", icon: AlertCircle },
  completed: { en: "Completed", ru: "Завершена", color: "bg-green-500/10 text-green-700", icon: CheckCircle2 },
  acknowledged: { en: "Acknowledged", ru: "Ознакомлен", color: "bg-green-600/10 text-green-800", icon: CheckCircle2 },
  closed: { en: "Closed", ru: "Закрыта", color: "bg-muted text-muted-foreground", icon: CheckCircle2 }
};
function ConsultationTimeline({
  caseId,
  caseStatus,
  isEn,
  onAcknowledge,
  onNextStep
}) {
  const { data: rounds = [] } = useQuery({
    queryKey: ["consultation-rounds", caseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("consultation_rounds").select("*").eq("case_id", caseId).order("round_number", { ascending: true });
      if (error) throw error;
      return data;
    }
  });
  const { data: allDocs = [] } = useQuery({
    queryKey: ["consultation-docs", caseId],
    queryFn: async () => {
      const roundIds = rounds.map((r) => r.id);
      if (roundIds.length === 0) return [];
      const { data, error } = await supabase.from("consultation_documents").select("*").in("round_id", roundIds).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: rounds.length > 0
  });
  const getDocUrl = async (path) => {
    const { data } = await supabase.storage.from("patient-documents").createSignedUrl(path, 3600);
    return data == null ? void 0 : data.signedUrl;
  };
  const sc = statusConfig[caseStatus] || statusConfig.submitted;
  const showAcknowledge = caseStatus === "completed";
  const showNextStepChoice = caseStatus === "acknowledged";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "flex items-center gap-3 py-4", children: [
      /* @__PURE__ */ jsx(sc.icon, { className: "w-5 h-5" }),
      /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
        isEn ? "Status" : "Статус",
        ":"
      ] }),
      /* @__PURE__ */ jsx(Badge, { className: sc.color, children: isEn ? sc.en : sc.ru })
    ] }) }),
    rounds.map((round) => {
      const docs = allDocs.filter((d) => d.round_id === round.id);
      return /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm", children: round.round_number }),
          isEn ? `Round ${round.round_number}` : `Обращение ${round.round_number}`,
          /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground font-normal ml-auto", children: new Date(round.created_at).toLocaleDateString(isEn ? "en-US" : "ru-RU") })
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          round.complaints && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-muted-foreground mb-1", children: isEn ? "Complaints" : "Жалобы" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground whitespace-pre-wrap", children: round.complaints })
          ] }),
          round.medical_history && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-muted-foreground mb-1", children: isEn ? "Medical History" : "Анамнез" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground whitespace-pre-wrap", children: round.medical_history })
          ] }),
          docs.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-muted-foreground mb-2", children: isEn ? "Documents" : "Документы" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-1", children: docs.map((doc) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2 bg-muted rounded", children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-primary shrink-0" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm truncate flex-1", children: doc.file_name }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  onClick: async () => {
                    const url = await getDocUrl(doc.file_path);
                    if (url) window.open(url, "_blank");
                  },
                  children: /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" })
                }
              )
            ] }, doc.id)) })
          ] }),
          round.ai_assessment && round.is_complete && /* @__PURE__ */ jsxs("div", { className: "border-l-4 border-primary pl-4 py-2 bg-primary/5 rounded-r", children: [
            /* @__PURE__ */ jsxs("h4", { className: "text-sm font-semibold text-primary mb-1 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(MessageCircle, { className: "w-4 h-4" }),
              isEn ? "AI Preliminary Assessment" : "Предварительная оценка ИИ",
              round.ai_assessment_date && /* @__PURE__ */ jsx("span", { className: "font-normal text-muted-foreground ml-2", children: new Date(round.ai_assessment_date).toLocaleDateString(isEn ? "en-US" : "ru-RU") })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground whitespace-pre-wrap", children: round.ai_assessment })
          ] }),
          round.doctor_conclusion && round.is_complete && /* @__PURE__ */ jsxs("div", { className: "border-l-4 border-green-600 pl-4 py-2 bg-green-50 dark:bg-green-900/10 rounded-r", children: [
            /* @__PURE__ */ jsxs("h4", { className: "text-sm font-semibold text-green-700 dark:text-green-400 mb-1", children: [
              isEn ? "Doctor's Conclusion" : "Заключение врача",
              round.doctor_conclusion_date && /* @__PURE__ */ jsx("span", { className: "font-normal text-muted-foreground ml-2", children: new Date(round.doctor_conclusion_date).toLocaleDateString(isEn ? "en-US" : "ru-RU") })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground whitespace-pre-wrap", children: round.doctor_conclusion })
          ] }),
          !round.is_complete && caseStatus !== "draft" && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground italic py-2", children: isEn ? "Awaiting doctor's review..." : "Ожидает рассмотрения врачом..." })
        ] })
      ] }, round.id);
    }),
    showAcknowledge && /* @__PURE__ */ jsx(Card, { className: "border-primary", children: /* @__PURE__ */ jsxs(CardContent, { className: "py-6 text-center space-y-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-foreground", children: isEn ? "Please confirm that you have reviewed the doctor's conclusion." : "Пожалуйста, подтвердите, что вы ознакомились с заключением врача." }),
      /* @__PURE__ */ jsxs(Button, { onClick: onAcknowledge, size: "lg", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 mr-2" }),
        isEn ? "I have reviewed the conclusion" : "Ознакомлен с заключением"
      ] })
    ] }) }),
    showNextStepChoice && /* @__PURE__ */ jsx(Card, { className: "border-primary", children: /* @__PURE__ */ jsxs(CardContent, { className: "py-6 space-y-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-center text-foreground font-medium", children: isEn ? "What would you like to do next?" : "Что вы хотели бы сделать дальше?" }),
      /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsx(Button, { variant: "default", size: "lg", onClick: () => onNextStep("appointment"), className: "h-auto py-4", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold", children: isEn ? "Book an in-person visit" : "Записаться на очный приём" }),
          /* @__PURE__ */ jsx("div", { className: "text-xs opacity-80 mt-1", children: isEn ? "Schedule a consultation at the clinic" : "Запланировать консультацию в клинике" })
        ] }) }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "lg", onClick: () => onNextStep("planning"), className: "h-auto py-4", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold", children: isEn ? "Connect with assistant" : "Связаться с помощником" }),
          /* @__PURE__ */ jsx("div", { className: "text-xs opacity-80 mt-1", children: isEn ? "For treatment or surgery planning" : "По поводу планирования лечения или операции" })
        ] }) })
      ] })
    ] }) })
  ] });
}
function AddRoundForm({ caseId, userId, nextRoundNumber, isEn, onCreated }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [complaints, setComplaints] = useState("");
  const [history, setHistory] = useState("");
  const handleFileAdd = (e) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files).filter((f) => f.type === "application/pdf" || f.type.startsWith("image/"))]);
    }
  };
  const handleSubmit = async () => {
    if (!complaints.trim()) {
      toast({ title: isEn ? "Describe your complaints" : "Опишите жалобы", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: round, error } = await supabase.from("consultation_rounds").insert({
        case_id: caseId,
        user_id: userId,
        round_number: nextRoundNumber,
        complaints: complaints.trim(),
        medical_history: history.trim()
      }).select("id").single();
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
          file_type: file.type
        });
      }
      await supabase.from("consultation_cases").update({ status: "submitted" }).eq("id", caseId);
      toast({ title: isEn ? "New round submitted!" : "Новое обращение отправлено!" });
      onCreated();
    } catch (err) {
      toast({ title: isEn ? "Error" : "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(Card, { className: "border-primary", children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: isEn ? "Submit Additional Information" : "Дополнить консультацию" }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: isEn ? "New Complaints / Updates *" : "Новые жалобы / обновления *" }),
        /* @__PURE__ */ jsx(Textarea, { value: complaints, onChange: (e) => setComplaints(e.target.value), rows: 3 })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: isEn ? "Additional History" : "Дополнительный анамнез" }),
        /* @__PURE__ */ jsx(Textarea, { value: history, onChange: (e) => setHistory(e.target.value), rows: 3 })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: isEn ? "New Documents" : "Новые документы" }),
        /* @__PURE__ */ jsxs("label", { className: "cursor-pointer", children: [
          /* @__PURE__ */ jsx(Input, { type: "file", multiple: true, accept: ".pdf,image/*", onChange: handleFileAdd, className: "hidden" }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", type: "button", asChild: true, children: /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 mr-2" }),
            isEn ? "Upload" : "Загрузить"
          ] }) })
        ] }),
        files.map((f, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2 bg-muted rounded", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-primary shrink-0" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm truncate flex-1", children: f.name }),
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: () => setFiles((prev) => prev.filter((_, j) => j !== i)), children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
        ] }, i))
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: handleSubmit, disabled: submitting, className: "w-full", children: [
        submitting && /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
        isEn ? "Submit" : "Отправить"
      ] })
    ] })
  ] });
}
const statusLabels = {
  draft: { en: "Draft", ru: "Черновик", color: "bg-muted text-muted-foreground" },
  submitted: { en: "Submitted", ru: "Отправлена", color: "bg-yellow-500/10 text-yellow-700" },
  paid: { en: "Paid", ru: "Оплачена", color: "bg-blue-500/10 text-blue-700" },
  in_review: { en: "Under Review", ru: "На рассмотрении", color: "bg-purple-500/10 text-purple-700" },
  completed: { en: "Completed", ru: "Завершена", color: "bg-green-500/10 text-green-700" },
  acknowledged: { en: "Acknowledged", ru: "Ознакомлен", color: "bg-green-600/10 text-green-800" },
  closed: { en: "Closed", ru: "Закрыта", color: "bg-muted text-muted-foreground" }
};
const PatientPortal = () => {
  var _a;
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const qc = useQueryClient();
  const [view, setView] = useState("list");
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [showAddRound, setShowAddRound] = useState(false);
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/portal");
  }, [authLoading, user, navigate]);
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["my-consultations", user == null ? void 0 : user.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("consultation_cases").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  const selectedCase = cases.find((c) => c.id === selectedCaseId);
  const { data: rounds = [] } = useQuery({
    queryKey: ["consultation-rounds", selectedCaseId],
    queryFn: async () => {
      if (!selectedCaseId) return [];
      const { data, error } = await supabase.from("consultation_rounds").select("id, round_number").eq("case_id", selectedCaseId).order("round_number", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCaseId
  });
  const handleAcknowledge = async () => {
    if (!selectedCaseId) return;
    await supabase.from("consultation_cases").update({ status: "acknowledged", patient_acknowledged_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", selectedCaseId);
    qc.invalidateQueries({ queryKey: ["my-consultations"] });
    toast({ title: isEn ? "Acknowledged" : "Ознакомление подтверждено" });
  };
  const handleNextStep = async (step) => {
    if (!selectedCaseId) return;
    await supabase.from("consultation_cases").update({ patient_next_step: step, status: "closed" }).eq("id", selectedCaseId);
    qc.invalidateQueries({ queryKey: ["my-consultations"] });
    toast({
      title: isEn ? step === "appointment" ? "Appointment request sent" : "Planning request sent" : step === "appointment" ? "Заявка на приём отправлена" : "Заявка на планирование отправлена"
    });
  };
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["my-consultations"] });
    qc.invalidateQueries({ queryKey: ["consultation-rounds"] });
    qc.invalidateQueries({ queryKey: ["consultation-docs"] });
  };
  const canAddRound = selectedCase && ["closed", "acknowledged"].includes(selectedCase.status);
  if (authLoading || !user) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: isEn ? "Patient Portal — Prof. Tarusin" : "Личный кабинет — Проф. Тарусин",
        description: isEn ? "Online consultation portal" : "Портал онлайн-консультаций",
        path: "/portal"
      }
    ),
    /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-8", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        isEn ? "Home" : "На главную"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl md:text-3xl font-bold", children: isEn ? "Online Consultation Portal" : "Портал онлайн-консультаций" }),
      /* @__PURE__ */ jsx("p", { className: "text-primary-foreground/80 mt-1", children: user.email })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-8 max-w-3xl", children: [
      view === "list" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: isEn ? "My Consultations" : "Мои консультации" }),
          /* @__PURE__ */ jsxs(Button, { onClick: () => setView("new"), children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
            isEn ? "New Consultation" : "Новая консультация"
          ] })
        ] }),
        isLoading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) }) : cases.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "py-12 text-center", children: [
          /* @__PURE__ */ jsx(FolderOpen, { className: "w-12 h-12 mx-auto text-muted-foreground mb-4" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: isEn ? "No consultations yet" : "Консультаций пока нет" }),
          /* @__PURE__ */ jsx(Button, { onClick: () => setView("new"), children: isEn ? "Create your first consultation" : "Создать первую консультацию" })
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: cases.map((c) => {
          const s = statusLabels[c.status] || statusLabels.submitted;
          return /* @__PURE__ */ jsx(
            Card,
            {
              className: "cursor-pointer hover:border-primary transition-colors",
              onClick: () => {
                setSelectedCaseId(c.id);
                setView("detail");
              },
              children: /* @__PURE__ */ jsx(CardContent, { className: "py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground", children: c.patient_full_name || (isEn ? "Unnamed" : "Без имени") }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: new Date(c.created_at).toLocaleDateString(isEn ? "en-US" : "ru-RU") })
                ] }),
                /* @__PURE__ */ jsx(Badge, { className: s.color, children: isEn ? s.en : s.ru })
              ] }) })
            },
            c.id
          );
        }) })
      ] }),
      view === "new" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", onClick: () => setView("list"), children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
          isEn ? "Back" : "Назад"
        ] }),
        /* @__PURE__ */ jsx(
          ConsultationForm,
          {
            userId: user.id,
            isEn,
            onCreated: () => {
              refresh();
              setView("list");
            }
          }
        )
      ] }),
      view === "detail" && selectedCase && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", onClick: () => {
          setView("list");
          setShowAddRound(false);
        }, children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
          isEn ? "Back to list" : "К списку"
        ] }),
        /* @__PURE__ */ jsx(
          ConsultationTimeline,
          {
            caseId: selectedCase.id,
            caseStatus: selectedCase.status,
            isEn,
            userId: user.id,
            onAcknowledge: handleAcknowledge,
            onNextStep: handleNextStep
          }
        ),
        canAddRound && !showAddRound && /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "w-full", onClick: () => setShowAddRound(true), children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
          isEn ? "Submit new results / Re-open case" : "Загрузить новые результаты / Повторное обращение"
        ] }),
        showAddRound && /* @__PURE__ */ jsx(
          AddRoundForm,
          {
            caseId: selectedCase.id,
            userId: user.id,
            nextRoundNumber: (((_a = rounds[0]) == null ? void 0 : _a.round_number) || 0) + 1,
            isEn,
            onCreated: () => {
              refresh();
              setShowAddRound(false);
            }
          }
        )
      ] })
    ] })
  ] });
};
export {
  PatientPortal as default
};
