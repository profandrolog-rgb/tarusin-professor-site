import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { u as useHashOpen } from "./useHashOpen-DHCIwQ6Z.js";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Shield, Plus, Loader2, ChevronDown, ChevronRight, Trash2, Image } from "lucide-react";
import { Link } from "react-router-dom";
import { e as useToast, u as useAuth, s as supabase, P as PageMeta, D as Dialog, f as DialogTrigger, B as Button, h as DialogContent, i as DialogHeader, j as DialogTitle, L as Label, I as Input, T as Textarea, b as Badge, C as Card, c as CardHeader, d as CardTitle, a as CardContent } from "../main.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-DUtqt5i7.js";
import { u as useAutoSave } from "./useAutoSave-DcIiKxWj.js";
import { toast } from "sonner";
import { J as JsonLd } from "./JsonLd-BQQYXoxB.js";
import { A as AgeConfirmationModal } from "./AgeConfirmationModal-COJlSvbH.js";
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
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
import "react-helmet-async";
import "@radix-ui/react-select";
import "@radix-ui/react-collapsible";
const categoryLabels = {
  infertility: { ru: "Бесплодие", en: "Infertility" },
  scrotal_pain: { ru: "Боль в мошонке", en: "Scrotal Pain" },
  varicocele: { ru: "Варикоцеле", en: "Varicocele" },
  hydrocele: { ru: "Гидроцеле", en: "Hydrocele" },
  hypospadias: { ru: "Гипоспадия", en: "Hypospadias" },
  hernia: { ru: "Грыжи", en: "Hernias" },
  cryptorchidism: { ru: "Крипторхизм", en: "Cryptorchidism" },
  complications: { ru: "Осложнения", en: "Complications" },
  psychology: { ru: "Психология", en: "Psychology" },
  rarities: { ru: "Раритеты", en: "Rare Cases" },
  sexology: { ru: "Сексология", en: "Sexology" },
  pelvic_pain: { ru: "Тазовая боль", en: "Pelvic Pain" },
  phimosis: { ru: "Фимоз", en: "Phimosis" },
  enuresis: { ru: "Энурез", en: "Enuresis" },
  erectile_dysfunction: { ru: "Эректильная дисфункция", en: "Erectile Dysfunction" },
  other: { ru: "Другое", en: "Other" }
};
const categoryColors = {
  hydrocele: "bg-blue-100 text-blue-800",
  cryptorchidism: "bg-green-100 text-green-800",
  hypospadias: "bg-purple-100 text-purple-800",
  varicocele: "bg-orange-100 text-orange-800",
  phimosis: "bg-pink-100 text-pink-800",
  sexology: "bg-rose-100 text-rose-800",
  psychology: "bg-indigo-100 text-indigo-800",
  infertility: "bg-amber-100 text-amber-800",
  erectile_dysfunction: "bg-red-100 text-red-800",
  enuresis: "bg-cyan-100 text-cyan-800",
  pelvic_pain: "bg-teal-100 text-teal-800",
  scrotal_pain: "bg-yellow-100 text-yellow-800",
  hernia: "bg-lime-100 text-lime-800",
  complications: "bg-fuchsia-100 text-fuchsia-800",
  rarities: "bg-violet-100 text-violet-800",
  other: "bg-gray-100 text-gray-800"
};
const ClinicalCases = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [cases, setCases] = useState([]);
  const [caseImages, setCaseImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedCases, setExpandedCases] = useState(/* @__PURE__ */ new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [newCase, setNewCase] = useState({
    title: "",
    category: "other",
    history: "",
    conclusions: "",
    recommendations: ""
  });
  const [pendingImages, setPendingImages] = useState([]);
  const { toast: toast$1 } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();
  const { save: saveCaseDraft, loadDraft: loadCaseDraft, clearDraft: clearCaseDraft } = useAutoSave({
    key: "clinical_case_new",
    data: newCase,
    enabled: dialogOpen
  });
  useEffect(() => {
    fetchCases();
  }, []);
  useHashOpen("case", cases.length > 0, useCallback((id) => {
    setExpandedCases((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []));
  const fetchCases = async () => {
    try {
      const { data, error } = await supabase.from("clinical_cases").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const typedCases = (data || []).map((c) => ({
        ...c,
        category: c.category
      }));
      setCases(typedCases);
      if (typedCases.length > 0) {
        const { data: imagesData, error: imagesError } = await supabase.from("clinical_case_images").select("*").order("sort_order", { ascending: true });
        if (!imagesError && imagesData) {
          const imagesByCase = {};
          imagesData.forEach((img) => {
            if (!imagesByCase[img.case_id]) {
              imagesByCase[img.case_id] = [];
            }
            imagesByCase[img.case_id].push(img);
          });
          setCaseImages(imagesByCase);
        }
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
      toast$1({
        title: "Ошибка",
        description: "Не удалось загрузить клинические случаи",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const getPublicUrl = (path) => {
    const { data } = supabase.storage.from("case-images").getPublicUrl(path);
    return data.publicUrl;
  };
  const toggleCase = (caseId) => {
    const newExpanded = new Set(expandedCases);
    if (newExpanded.has(caseId)) {
      newExpanded.delete(caseId);
    } else {
      newExpanded.add(caseId);
    }
    setExpandedCases(newExpanded);
  };
  const handleCreateCase = async () => {
    if (!newCase.title || !newCase.history) {
      toast$1({
        title: "Заполните обязательные поля",
        description: "Укажите название и историю случая",
        variant: "destructive"
      });
      return;
    }
    setUploading(true);
    try {
      const { data: caseData, error: caseError } = await supabase.from("clinical_cases").insert({
        title: newCase.title,
        category: newCase.category,
        history: newCase.history,
        conclusions: newCase.conclusions || null,
        recommendations: newCase.recommendations || null
      }).select().single();
      if (caseError) throw caseError;
      if (pendingImages.length > 0) {
        setImageUploading(true);
        for (let i = 0; i < pendingImages.length; i++) {
          const file = pendingImages[i];
          const fileName = `${caseData.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
          const { error: uploadError } = await supabase.storage.from("case-images").upload(fileName, file);
          if (uploadError) {
            console.error("Image upload error:", uploadError);
            continue;
          }
          await supabase.from("clinical_case_images").insert({
            case_id: caseData.id,
            image_path: fileName,
            sort_order: i
          });
        }
        setImageUploading(false);
      }
      toast$1({
        title: "Успешно",
        description: "Клинический случай добавлен"
      });
      setNewCase({
        title: "",
        category: "other",
        history: "",
        conclusions: "",
        recommendations: ""
      });
      setPendingImages([]);
      clearCaseDraft();
      setDialogOpen(false);
      fetchCases();
    } catch (error) {
      console.error("Create error:", error);
      toast$1({
        title: "Ошибка",
        description: error.message || "Не удалось создать случай",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  const handleDeleteCase = async (caseId) => {
    try {
      const images = caseImages[caseId] || [];
      if (images.length > 0) {
        await supabase.storage.from("case-images").remove(images.map((img) => img.image_path));
      }
      const { error } = await supabase.from("clinical_cases").delete().eq("id", caseId);
      if (error) throw error;
      toast$1({
        title: "Удалено",
        description: "Клинический случай удалён"
      });
      fetchCases();
    } catch (error) {
      console.error("Delete error:", error);
      toast$1({
        title: "Ошибка удаления",
        description: error.message || "Не удалось удалить случай",
        variant: "destructive"
      });
    }
  };
  const groupedCases = cases.reduce((acc, c) => {
    if (!acc[c.category]) {
      acc[c.category] = [];
    }
    acc[c.category].push(c);
    return acc;
  }, {});
  return /* @__PURE__ */ jsx(AgeConfirmationModal, { children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(PageMeta, { title: isEn ? "Clinical Cases — Prof. Tarusin" : "Клинические случаи — Проф. Тарусин Д.И.", description: isEn ? "Clinical case descriptions from Professor Tarusin's practice with illustrations and conclusions." : "Описания клинических случаев из практики профессора Тарусина Д.И. с иллюстрациями и выводами.", path: "/clinical-cases" }),
    cases.length > 0 && /* @__PURE__ */ jsx(
      JsonLd,
      {
        data: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Клинические случаи — Проф. Тарусин Д.И.",
          url: "https://tarusin.pro/clinical-cases",
          author: { "@type": "Person", name: "Тарусин Дмитрий Игоревич" },
          hasPart: cases.slice(0, 30).map((c) => ({
            "@type": "Article",
            headline: c.title,
            datePublished: c.created_at,
            author: { "@type": "Person", name: "Тарусин Дмитрий Игоревич" },
            about: c.category
          }))
        }
      }
    ),
    /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-12 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: isAdmin ? "/admin" : "/", className: "inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        isAdmin ? isEn ? "Admin Panel" : "К панели администратора" : isEn ? "Home" : "На главную"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-bold mb-4", children: isEn ? "Clinical Cases" : "Клинические случаи" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-primary-foreground/80 max-w-2xl", children: isEn ? "Clinical case descriptions from my practice" : "Описания клинических случаев из моей практики" })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-12 md:py-16", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-12", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: isEn ? "All Cases" : "Все случаи" }),
        !authLoading && isAdmin && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Shield, { className: "w-4 h-4 text-primary" }),
            "Администратор"
          ] }),
          /* @__PURE__ */ jsxs(Dialog, { open: dialogOpen, onOpenChange: (open) => {
            setDialogOpen(open);
            if (open) {
              const draft = loadCaseDraft();
              if (draft && (draft.title || draft.history)) {
                toast("Найден черновик", {
                  description: "Восстановить несохранённые изменения?",
                  action: { label: "Восстановить", onClick: () => {
                    setNewCase((prev) => ({ ...prev, ...draft }));
                    toast.success("Черновик восстановлен");
                  } },
                  cancel: { label: "Отклонить", onClick: () => clearCaseDraft() },
                  duration: 1e4
                });
              }
            }
          }, children: [
            /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
              "Добавить случай"
            ] }) }),
            /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
              /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Новый клинический случай" }) }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4 mt-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "col-span-2 sm:col-span-1", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "case-title", children: "Название *" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        id: "case-title",
                        value: newCase.title,
                        onChange: (e) => setNewCase({ ...newCase, title: e.target.value }),
                        placeholder: "Название случая"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "col-span-2 sm:col-span-1", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "case-category", children: "Категория" }),
                    /* @__PURE__ */ jsxs(
                      Select,
                      {
                        value: newCase.category,
                        onValueChange: (val) => setNewCase({ ...newCase, category: val }),
                        children: [
                          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                          /* @__PURE__ */ jsx(SelectContent, { children: Object.entries(categoryLabels).map(([key, label]) => /* @__PURE__ */ jsx(SelectItem, { value: key, children: isEn ? label.en : label.ru }, key)) })
                        ]
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx(Label, { htmlFor: "case-history", children: "История *" }),
                  /* @__PURE__ */ jsx(
                    Textarea,
                    {
                      id: "case-history",
                      value: newCase.history,
                      onChange: (e) => setNewCase({ ...newCase, history: e.target.value }),
                      placeholder: "Описание случая, анамнез, жалобы...",
                      rows: 5
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx(Label, { htmlFor: "case-images", children: "Иллюстрации" }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      id: "case-images",
                      type: "file",
                      accept: "image/*",
                      multiple: true,
                      onChange: (e) => {
                        const files = Array.from(e.target.files || []);
                        setPendingImages(files);
                      }
                    }
                  ),
                  pendingImages.length > 0 && /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
                    "Выбрано файлов: ",
                    pendingImages.length
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx(Label, { htmlFor: "case-conclusions", children: "Выводы" }),
                  /* @__PURE__ */ jsx(
                    Textarea,
                    {
                      id: "case-conclusions",
                      value: newCase.conclusions,
                      onChange: (e) => setNewCase({ ...newCase, conclusions: e.target.value }),
                      placeholder: "Выводы по случаю...",
                      rows: 3
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx(Label, { htmlFor: "case-recommendations", children: "Советы" }),
                  /* @__PURE__ */ jsx(
                    Textarea,
                    {
                      id: "case-recommendations",
                      value: newCase.recommendations,
                      onChange: (e) => setNewCase({ ...newCase, recommendations: e.target.value }),
                      placeholder: "Рекомендации...",
                      rows: 3
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    onClick: handleCreateCase,
                    disabled: uploading,
                    className: "w-full",
                    children: uploading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                      imageUploading ? "Загрузка изображений..." : "Сохранение..."
                    ] }) : "Создать"
                  }
                )
              ] })
            ] })
          ] })
        ] })
      ] }) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) }) : cases.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-20", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 mx-auto text-muted-foreground mb-4", children: "📋" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground", children: isEn ? "No clinical cases added yet" : "Клинические случаи пока не добавлены" }),
        isAdmin && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "Нажмите «Добавить случай» чтобы создать первый" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-8", children: Object.entries(groupedCases).map(([category, categoryCases]) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
          /* @__PURE__ */ jsx(Badge, { className: categoryColors[category], children: isEn ? categoryLabels[category].en : categoryLabels[category].ru }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
            "(",
            categoryCases.length,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: categoryCases.map((clinicalCase) => {
          var _a;
          return /* @__PURE__ */ jsx(Card, { id: `case-${clinicalCase.id}`, className: "overflow-hidden scroll-mt-24", children: /* @__PURE__ */ jsxs(
            Collapsible,
            {
              open: expandedCases.has(clinicalCase.id),
              onOpenChange: () => toggleCase(clinicalCase.id),
              children: [
                /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsx(CardHeader, { className: "cursor-pointer hover:bg-muted/50 transition-colors", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
                    expandedCases.has(clinicalCase.id) ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-5 h-5 text-primary" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-5 h-5 text-muted-foreground" }),
                    clinicalCase.title
                  ] }),
                  isAdmin && /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "text-muted-foreground hover:text-destructive",
                      onClick: (e) => {
                        e.stopPropagation();
                        handleDeleteCase(clinicalCase.id);
                      },
                      children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                    }
                  )
                ] }) }) }),
                /* @__PURE__ */ jsx(CollapsibleContent, { children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-0 space-y-6", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h4", { className: "font-semibold text-foreground mb-2", children: isEn ? "History" : "История" }),
                    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground whitespace-pre-wrap", children: clinicalCase.history })
                  ] }),
                  ((_a = caseImages[clinicalCase.id]) == null ? void 0 : _a.length) > 0 && /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsxs("h4", { className: "font-semibold text-foreground mb-2 flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(Image, { className: "w-4 h-4" }),
                      isEn ? "Illustrations" : "Иллюстрации"
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3", children: caseImages[clinicalCase.id].map((img) => /* @__PURE__ */ jsx(
                      "a",
                      {
                        href: getPublicUrl(img.image_path),
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "block aspect-square rounded-lg overflow-hidden border hover:shadow-md transition-shadow",
                        children: /* @__PURE__ */ jsx(
                          "img",
                          {
                            src: getPublicUrl(img.image_path),
                            alt: img.caption || "Иллюстрация",
                            className: "w-full h-full object-cover"
                          }
                        )
                      },
                      img.id
                    )) })
                  ] }),
                  clinicalCase.conclusions && /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h4", { className: "font-semibold text-foreground mb-2", children: isEn ? "Conclusions" : "Выводы" }),
                    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground whitespace-pre-wrap", children: clinicalCase.conclusions })
                  ] }),
                  clinicalCase.recommendations && /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h4", { className: "font-semibold text-foreground mb-2", children: isEn ? "Recommendations" : "Советы" }),
                    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground whitespace-pre-wrap", children: clinicalCase.recommendations })
                  ] })
                ] }) })
              ]
            }
          ) }, clinicalCase.id);
        }) })
      ] }, category)) })
    ] })
  ] }) });
};
export {
  ClinicalCases as default
};
