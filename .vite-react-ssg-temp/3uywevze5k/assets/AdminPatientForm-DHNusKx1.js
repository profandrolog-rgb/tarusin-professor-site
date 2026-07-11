import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { u as useAuth, s as supabase, C as Card, c as CardHeader, d as CardTitle, a as CardContent, L as Label, I as Input, B as Button } from "../main.mjs";
import { Helmet } from "react-helmet-async";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import "vite-react-ssg";
import "@tanstack/react-query";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@supabase/supabase-js";
import "i18next";
import "@radix-ui/react-dropdown-menu";
import "react-i18next";
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
function AdminPatientForm({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [historyNumber, setHistoryNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [sex, setSex] = useState("");
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, loading, navigate]);
  useEffect(() => {
    if (mode !== "edit" || !id) return;
    (async () => {
      setBusy(true);
      const { data } = await supabase.from("patients").select("full_name, birth_date, phone, history_number, sex").eq("id", id).maybeSingle();
      if (data) {
        setFullName(data.full_name || "");
        setBirthDate(data.birth_date || "");
        setPhone(data.phone || "");
        setHistoryNumber(data.history_number || "");
        const s = data.sex;
        setSex(s === "M" || s === "F" ? s : "");
      }
      setBusy(false);
    })();
  }, [id, mode]);
  const handleSave = async () => {
    const name = fullName.trim();
    if (!name) {
      toast.error("Укажите ФИО");
      return;
    }
    setSaving(true);
    const payload = {
      full_name: name,
      birth_date: birthDate || null,
      phone: phone.trim() || null,
      history_number: historyNumber.trim() || null,
      sex: sex || null
    };
    if (mode === "create") {
      const { data, error } = await supabase.from("patients").insert(payload).select("id").single();
      setSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Пациент создан");
      navigate(`/admin/patients/${data.id}`);
    } else {
      const { error } = await supabase.from("patients").update(payload).eq("id", id);
      setSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Сохранено");
      navigate(`/admin/patients/${id}`);
    }
  };
  if (loading || busy) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxs(Helmet, { children: [
      /* @__PURE__ */ jsx("title", { children: mode === "create" ? "Новый пациент" : "Редактирование пациента" }),
      /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8 max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/admin/patients", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        "К списку пациентов"
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: mode === "create" ? "Новый пациент" : "Редактирование пациента" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "ФИО *" }),
            /* @__PURE__ */ jsx(Input, { value: fullName, onChange: (e) => setFullName(e.target.value), placeholder: "Иванов Иван Иванович" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { children: "Дата рождения" }),
              /* @__PURE__ */ jsx(Input, { type: "date", value: birthDate, onChange: (e) => setBirthDate(e.target.value) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { children: "№ истории болезни" }),
              /* @__PURE__ */ jsx(Input, { value: historyNumber, onChange: (e) => setHistoryNumber(e.target.value) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { children: "Телефон" }),
              /* @__PURE__ */ jsx(Input, { value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "+7 (___) ___-__-__" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { children: "Пол" }),
              /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: [
                { v: "", label: "не указан" },
                { v: "M", label: "муж" },
                { v: "F", label: "жен" }
              ].map((o) => /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: sex === o.v ? "default" : "outline",
                  size: "sm",
                  onClick: () => setSex(o.v),
                  children: o.label
                },
                o.v || "none"
              )) }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Нужно для женских путей метаболической карты и фильтрации референсов по полу/фазе." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
            /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => navigate(-1), children: "Отмена" }),
            /* @__PURE__ */ jsxs(Button, { onClick: handleSave, disabled: saving, className: "gap-2", children: [
              saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
              "Сохранить"
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  AdminPatientForm as default
};
