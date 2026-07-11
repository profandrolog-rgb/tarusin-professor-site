import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { lazy, useState, Suspense, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Smile, X, Users, Download, Loader2, Mail, Phone, Circle, CloudUpload, Check, AlertCircle, ArrowLeft, ExternalLink, Plus, GripVertical, ImageIcon, Upload, Trash2, Languages, Eye, EyeOff, FileText } from "lucide-react";
import { toast } from "sonner";
import { useSensors, useSensor, PointerSensor, KeyboardSensor, DndContext, closestCenter } from "@dnd-kit/core";
import { sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { B as Button, s as supabase, D as Dialog, f as DialogTrigger, h as DialogContent, i as DialogHeader, j as DialogTitle, b as Badge, n as cn, u as useAuth, C as Card, a as CardContent, I as Input, T as Textarea, L as Label } from "../main.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CJYPrMmK.js";
import { S as Switch } from "./switch-D2b9t4DD.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-DUtqt5i7.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { r as resolveMaterialPreview, d as deleteParentsMedia, f as formatBytes, s as slugify, a as parentsMediaPublicUrl, u as uploadParentsMedia, b as uploadParentsOgImage, c as uploadParentsHandoutPdf } from "./parentsMaterialsBucket-BE8GfiP2.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-C_8nSrct.js";
import { useTheme } from "next-themes";
import "vite-react-ssg";
import "@tanstack/react-query";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
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
import "react-helmet-async";
import "@radix-ui/react-tabs";
import "@radix-ui/react-switch";
import "@radix-ui/react-collapsible";
import "@radix-ui/react-select";
import "@radix-ui/react-popover";
const Picker = lazy(async () => {
  const [{ default: data }, mod] = await Promise.all([
    import("./native-D-bZ0OKf.js"),
    import("@emoji-mart/react")
  ]);
  return {
    default: (props) => /* @__PURE__ */ jsx(mod.default, { data, ...props })
  };
});
const EmojiPickerButton = ({ value, onChange, placeholder = "Эмодзи" }) => {
  const [open, setOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
    /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: setOpen, children: [
      /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          size: "sm",
          className: "h-10 min-w-[64px] justify-center text-xl",
          "aria-label": "Выбрать эмодзи",
          children: value ? /* @__PURE__ */ jsx("span", { children: value }) : /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground inline-flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Smile, { className: "w-4 h-4" }),
            placeholder
          ] })
        }
      ) }),
      /* @__PURE__ */ jsx(PopoverContent, { className: "p-0 border-none bg-transparent shadow-xl w-auto", align: "start", sideOffset: 8, children: /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx("div", { className: "w-[352px] h-[435px] rounded-lg bg-muted animate-pulse" }), children: /* @__PURE__ */ jsx(
        Picker,
        {
          theme: resolvedTheme === "dark" ? "dark" : "light",
          locale: "ru",
          previewPosition: "none",
          skinTonePosition: "search",
          maxFrequentRows: 2,
          onEmojiSelect: (e) => {
            onChange(e.native);
            setOpen(false);
          }
        }
      ) }) })
    ] }),
    value && /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        variant: "ghost",
        size: "sm",
        className: "h-10 px-2 text-muted-foreground hover:text-destructive",
        onClick: () => onChange(null),
        "aria-label": "Очистить эмодзи",
        children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" })
      }
    )
  ] });
};
const MaterialLeadsDialog = ({ materialId, materialTitle }) => {
  const [open, setOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(null);
  const loadCount = async () => {
    const { count: c } = await supabase.from("parents_material_leads").select("id", { count: "exact", head: true }).eq("material_id", materialId);
    setCount(c ?? 0);
  };
  useEffect(() => {
    void loadCount();
  }, [materialId]);
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase.from("parents_material_leads").select("id, name, email, phone, created_at, user_agent, referrer").eq("material_id", materialId).order("created_at", { ascending: false });
      setLeads(data ?? []);
      setLoading(false);
    })();
  }, [open, materialId]);
  const exportCsv = () => {
    const rows = [
      ["Дата", "Имя", "Email", "Телефон", "Referrer"],
      ...leads.map((l) => [
        new Date(l.created_at).toLocaleString("ru-RU"),
        l.name ?? "",
        l.email ?? "",
        l.phone ?? "",
        l.referrer ?? ""
      ])
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${materialId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", className: "h-6 gap-1 px-2 text-xs", children: [
      /* @__PURE__ */ jsx(Users, { className: "w-3 h-3" }),
      "Заявок: ",
      count ?? "…"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-3xl max-h-[85vh] overflow-hidden flex flex-col", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Users, { className: "w-5 h-5" }),
          "Заявки на памятку"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground truncate", children: materialTitle })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 border-b pb-2", children: [
        /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
          "Всего: ",
          leads.length
        ] }),
        /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: exportCsv, disabled: !leads.length, className: "gap-1", children: [
          /* @__PURE__ */ jsx(Download, { className: "w-3.5 h-3.5" }),
          "Экспорт CSV"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto -mx-6 px-6", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) }) : leads.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-muted-foreground py-12", children: "Пока никто не оставлял контакты." }) : /* @__PURE__ */ jsx("div", { className: "divide-y", children: leads.map((l) => /* @__PURE__ */ jsxs("div", { className: "py-3 space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: l.name || /* @__PURE__ */ jsx("span", { className: "text-muted-foreground italic", children: "без имени" }) }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: new Date(l.created_at).toLocaleString("ru-RU") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-sm flex-wrap", children: [
          l.email && /* @__PURE__ */ jsxs("a", { href: `mailto:${l.email}`, className: "inline-flex items-center gap-1 text-primary hover:underline", children: [
            /* @__PURE__ */ jsx(Mail, { className: "w-3.5 h-3.5" }),
            l.email
          ] }),
          l.phone && /* @__PURE__ */ jsxs("a", { href: `tel:${l.phone}`, className: "inline-flex items-center gap-1 text-primary hover:underline", children: [
            /* @__PURE__ */ jsx(Phone, { className: "w-3.5 h-3.5" }),
            l.phone
          ] })
        ] }),
        l.referrer && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground truncate", children: [
          "Источник: ",
          l.referrer
        ] })
      ] }, l.id)) }) })
    ] })
  ] });
};
const AutoSaveIndicator = ({ status, className }) => {
  const map = {
    idle: { icon: /* @__PURE__ */ jsx(Circle, { className: "w-3.5 h-3.5" }), text: "Готово", color: "text-muted-foreground" },
    pending: { icon: /* @__PURE__ */ jsx(CloudUpload, { className: "w-3.5 h-3.5" }), text: "Ожидание…", color: "text-muted-foreground" },
    saving: { icon: /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }), text: "Сохраняется…", color: "text-primary" },
    saved: { icon: /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5" }), text: "Сохранено", color: "text-emerald-600 dark:text-emerald-500" },
    error: { icon: /* @__PURE__ */ jsx(AlertCircle, { className: "w-3.5 h-3.5" }), text: "Ошибка сохранения", color: "text-destructive" }
  };
  const s = map[status];
  return /* @__PURE__ */ jsxs("span", { className: cn("inline-flex items-center gap-1 text-xs", s.color, className), "aria-live": "polite", children: [
    s.icon,
    s.text
  ] });
};
function useDebouncedAutoSave({
  value,
  serverValue,
  onSave,
  delay = 1500,
  enabled = true
}) {
  const [status, setStatus] = useState("idle");
  const timerRef = useRef(null);
  const latestValueRef = useRef(value);
  const savedSerializedRef = useRef(JSON.stringify(serverValue));
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);
  useEffect(() => {
    savedSerializedRef.current = JSON.stringify(serverValue);
  }, [serverValue]);
  const doSave = async (val) => {
    if (savingRef.current) {
      pendingRef.current = true;
      return;
    }
    savingRef.current = true;
    setStatus("saving");
    try {
      const ok = await onSave(val);
      if (ok) {
        savedSerializedRef.current = JSON.stringify(val);
        setStatus("saved");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      savingRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        void doSave(latestValueRef.current);
      }
    }
  };
  useEffect(() => {
    if (!enabled) return;
    const serialized = JSON.stringify(value);
    if (serialized === savedSerializedRef.current) {
      if (status === "pending") setStatus("saved");
      return;
    }
    setStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void doSave(latestValueRef.current);
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, enabled, delay]);
  useEffect(() => {
    if (!enabled) return;
    const flush = () => {
      const serialized = JSON.stringify(latestValueRef.current);
      if (serialized !== savedSerializedRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        void doSave(latestValueRef.current);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("blur", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, [enabled]);
  return { status };
}
const KIND_LABELS = {
  article: "Статьи",
  video: "Видео",
  podcast: "Подкасты",
  handout: "Материалы для скачивания"
};
const KIND_HINTS = {
  article: "Внешние статьи и публикации со ссылкой. Превью — картинка или Unsplash-URL.",
  video: "YouTube-ролики. Превью можно указать URL вида https://img.youtube.com/vi/<id>/maxresdefault.jpg",
  podcast: "Аудио-подкасты и интервью. Обычно без превью — используется иконка наушников.",
  handout: "PDF-памятки и чек-листы со своим лендингом /for-parents/materials/{slug}."
};
const AUDIENCE_OPTIONS = [
  { value: "parent", label: "Родители" },
  { value: "adult_man", label: "Взрослый пациент" },
  { value: "pediatric_patient", label: "Юный пациент" },
  { value: "professional", label: "Врач-профессионал" }
];
function emptyDraft(kind) {
  return {
    kind,
    title: "",
    description: null,
    title_en: null,
    description_en: null,
    url: kind === "handout" ? null : "",
    source: null,
    image_path: null,
    image_url: null,
    emoji: null,
    sort_order: 0,
    is_published: false,
    slug: null,
    file_path: null,
    file_size_bytes: null,
    pages_count: null,
    long_description: null,
    long_description_en: null,
    seo_title: null,
    seo_title_en: null,
    seo_description: null,
    seo_description_en: null,
    og_image_path: null,
    audience: kind === "handout" ? "parent" : null,
    download_count: 0,
    gated: false
  };
}
const AdminParentsMaterials = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeKind, setActiveKind] = useState("article");
  const [savingId, setSavingId] = useState(null);
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/parents-materials" } });
    }
  }, [user, isAdmin, authLoading, navigate]);
  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("parents_materials").select("*").order("kind", { ascending: true }).order("sort_order", { ascending: true });
    if (error) toast.error("Не удалось загрузить материалы: " + error.message);
    else setItems(data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    if (user && isAdmin) load();
  }, [user, isAdmin]);
  const addNew = async () => {
    const draft = emptyDraft(activeKind);
    const maxSort = items.filter((i) => i.kind === activeKind).reduce((m, i) => Math.max(m, i.sort_order), 0);
    draft.sort_order = maxSort + 10;
    draft.title = activeKind === "handout" ? "Новая памятка" : "Новая карточка";
    if (activeKind === "handout") {
      draft.slug = `handout-${Date.now()}`;
    }
    const { data, error } = await supabase.from("parents_materials").insert(draft).select().single();
    if (error) {
      toast.error("Ошибка создания: " + error.message);
      return;
    }
    setItems((prev) => [...prev, data]);
    toast.success("Карточка создана");
  };
  const updateItem = async (id, patch) => {
    setSavingId(id);
    const { error } = await supabase.from("parents_materials").update(patch).eq("id", id);
    setSavingId(null);
    if (error) {
      toast.error("Ошибка сохранения: " + error.message);
      return false;
    }
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i));
    return true;
  };
  const removeItem = async (item) => {
    if (!confirm(`Удалить «${item.title}»? Это действие нельзя отменить.`)) return;
    if (item.image_path) await deleteParentsMedia(item.image_path).catch(() => {
    });
    if (item.file_path) await deleteParentsMedia(item.file_path).catch(() => {
    });
    if (item.og_image_path) await deleteParentsMedia(item.og_image_path).catch(() => {
    });
    const { error } = await supabase.from("parents_materials").delete().eq("id", item.id);
    if (error) {
      toast.error("Ошибка удаления: " + error.message);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toast.success("Удалено");
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const kindItems = items.filter((i) => i.kind === activeKind).sort((a, b) => a.sort_order - b.sort_order);
  const onDragEnd = async (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = kindItems.findIndex((i) => i.id === active.id);
    const newIdx = kindItems.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(kindItems, oldIdx, newIdx);
    const updates = reordered.map((it, idx) => ({ id: it.id, sort_order: (idx + 1) * 10 }));
    setItems((prev) => {
      const map = new Map(updates.map((u) => [u.id, u.sort_order]));
      return prev.map((it) => map.has(it.id) ? { ...it, sort_order: map.get(it.id) } : it);
    });
    await Promise.all(updates.map((u) => supabase.from("parents_materials").update({ sort_order: u.sort_order }).eq("id", u.id)));
  };
  if (authLoading || !user || !isAdmin) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8 max-w-5xl", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      "В админ-панель"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-start justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl md:text-3xl font-bold text-foreground mb-2", children: "Полезные материалы (для родителей)" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground max-w-2xl", children: [
          "Управление карточками во вкладке ",
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: "«Полезные материалы»" }),
          " на странице",
          " ",
          /* @__PURE__ */ jsxs(Link, { to: "/for-parents", target: "_blank", className: "text-primary hover:underline inline-flex items-center gap-1", children: [
            "/for-parents ",
            /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" })
          ] }),
          ". Порядок карточек редактируется перетаскиванием."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: addNew, children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
        "Добавить в «",
        KIND_LABELS[activeKind],
        "»"
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { value: activeKind, onValueChange: (v) => setActiveKind(v), children: [
      /* @__PURE__ */ jsx(TabsList, { className: "mb-4 flex-wrap h-auto", children: Object.keys(KIND_LABELS).map((k) => {
        const count = items.filter((i) => i.kind === k).length;
        return /* @__PURE__ */ jsxs(TabsTrigger, { value: k, children: [
          KIND_LABELS[k],
          " ",
          /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-2", children: count })
        ] }, k);
      }) }),
      Object.keys(KIND_LABELS).map((k) => /* @__PURE__ */ jsxs(TabsContent, { value: k, children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-4", children: KIND_HINTS[k] }),
        loading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) }) : kindItems.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-10 text-center text-muted-foreground", children: "Карточек пока нет. Нажмите «Добавить»." }) }) : /* @__PURE__ */ jsx(DndContext, { sensors, collisionDetection: closestCenter, onDragEnd, children: /* @__PURE__ */ jsx(SortableContext, { items: kindItems.map((i) => i.id), strategy: verticalListSortingStrategy, children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: kindItems.map((it) => it.kind === "handout" ? /* @__PURE__ */ jsx(HandoutRow, { item: it, saving: savingId === it.id, onSave: (p) => updateItem(it.id, p), onDelete: () => removeItem(it), allSlugs: items.filter((x) => x.id !== it.id).map((x) => x.slug).filter(Boolean) }, it.id) : /* @__PURE__ */ jsx(MaterialRow, { item: it, saving: savingId === it.id, onSave: (p) => updateItem(it.id, p), onDelete: () => removeItem(it) }, it.id)) }) }) })
      ] }, k))
    ] })
  ] }) });
};
const MaterialRow = ({ item, saving, onSave, onDelete }) => {
  var _a, _b, _c, _d, _e, _f;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const [draft, setDraft] = useState(item);
  const [uploading, setUploading] = useState(false);
  const [showEn, setShowEn] = useState(false);
  useEffect(() => {
    setDraft(item);
  }, [item.id, item.image_path]);
  const patch = {
    title: draft.title.trim(),
    description: ((_a = draft.description) == null ? void 0 : _a.trim()) || null,
    title_en: ((_b = draft.title_en) == null ? void 0 : _b.trim()) || null,
    description_en: ((_c = draft.description_en) == null ? void 0 : _c.trim()) || null,
    url: ((_d = draft.url) == null ? void 0 : _d.trim()) || null,
    source: ((_e = draft.source) == null ? void 0 : _e.trim()) || null,
    image_url: ((_f = draft.image_url) == null ? void 0 : _f.trim()) || null,
    emoji: draft.emoji || null
  };
  const serverPatch = {
    title: item.title,
    description: item.description ?? null,
    title_en: item.title_en ?? null,
    description_en: item.description_en ?? null,
    url: item.url ?? null,
    source: item.source ?? null,
    image_url: item.image_url ?? null,
    emoji: item.emoji ?? null
  };
  const { status } = useDebouncedAutoSave({
    value: patch,
    serverValue: serverPatch,
    onSave: async (v) => onSave(v)
  });
  const handleUpload = async (file) => {
    setUploading(true);
    try {
      if (item.image_path) await deleteParentsMedia(item.image_path).catch(() => {
      });
      const path = await uploadParentsMedia(file);
      await onSave({ image_path: path });
      toast.success("Картинка загружена");
    } catch (e) {
      toast.error("Ошибка загрузки: " + ((e == null ? void 0 : e.message) || e));
    } finally {
      setUploading(false);
    }
  };
  const preview = resolveMaterialPreview(draft);
  return /* @__PURE__ */ jsx(Card, { ref: setNodeRef, style, className: "overflow-hidden", children: /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-3 items-start", children: [
    /* @__PURE__ */ jsx("button", { ...attributes, ...listeners, className: "mt-1 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing", "aria-label": "Перетащить", type: "button", children: /* @__PURE__ */ jsx(GripVertical, { className: "w-5 h-5" }) }),
    /* @__PURE__ */ jsx("div", { className: "w-24 h-16 rounded-md bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center border", children: preview ? /* @__PURE__ */ jsx("img", { src: preview, alt: "", className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx(ImageIcon, { className: "w-6 h-6 text-muted-foreground" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-[1fr_180px] gap-2", children: [
        /* @__PURE__ */ jsx(Input, { value: draft.title, onChange: (e) => setDraft({ ...draft, title: e.target.value }), placeholder: "Заголовок" }),
        /* @__PURE__ */ jsx(Input, { value: draft.source ?? "", onChange: (e) => setDraft({ ...draft, source: e.target.value }), placeholder: "Источник" })
      ] }),
      /* @__PURE__ */ jsx(Textarea, { value: draft.description ?? "", onChange: (e) => setDraft({ ...draft, description: e.target.value }), placeholder: "Краткое описание", rows: 2 }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsx(Input, { value: draft.url ?? "", onChange: (e) => setDraft({ ...draft, url: e.target.value }), placeholder: "https://…", className: "flex-1 min-w-[220px]" }),
        /* @__PURE__ */ jsx(EmojiPickerButton, { value: draft.emoji, onChange: (v) => setDraft({ ...draft, emoji: v }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Превью:" }),
        /* @__PURE__ */ jsxs("label", { className: "inline-flex", children: [
          /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", className: "hidden", disabled: uploading, onChange: (e) => {
            var _a2;
            const f = (_a2 = e.target.files) == null ? void 0 : _a2[0];
            if (f) handleUpload(f);
            e.currentTarget.value = "";
          } }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", size: "sm", disabled: uploading, children: /* @__PURE__ */ jsxs("span", { children: [
            uploading ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin mr-1" }) : /* @__PURE__ */ jsx(Upload, { className: "w-3.5 h-3.5 mr-1" }),
            "Загрузить"
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "или" }),
        /* @__PURE__ */ jsx(Input, { value: draft.image_url ?? "", onChange: (e) => setDraft({ ...draft, image_url: e.target.value }), placeholder: "URL картинки", className: "flex-1 min-w-[220px]" }),
        item.image_path && /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: async () => {
          await deleteParentsMedia(item.image_path);
          await onSave({ image_path: null });
        }, className: "text-destructive", children: [
          /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5 mr-1" }),
          "Убрать файл"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Collapsible, { open: showEn, onOpenChange: setShowEn, children: [
        /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "text-xs", children: [
          /* @__PURE__ */ jsx(Languages, { className: "w-3.5 h-3.5 mr-1" }),
          showEn ? "Скрыть EN" : "Английский (EN)"
        ] }) }),
        /* @__PURE__ */ jsxs(CollapsibleContent, { className: "space-y-2 pt-2", children: [
          /* @__PURE__ */ jsx(Input, { value: draft.title_en ?? "", onChange: (e) => setDraft({ ...draft, title_en: e.target.value }), placeholder: "Title (EN)" }),
          /* @__PURE__ */ jsx(Textarea, { value: draft.description_en ?? "", onChange: (e) => setDraft({ ...draft, description_en: e.target.value }), placeholder: "Description (EN)", rows: 2 })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap pt-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Switch, { checked: draft.is_published, onCheckedChange: (v) => {
              setDraft({ ...draft, is_published: v });
              onSave({ is_published: v });
            } }),
            /* @__PURE__ */ jsx(Label, { className: "text-xs cursor-pointer flex items-center gap-1", children: draft.is_published ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Eye, { className: "w-3.5 h-3.5" }),
              "Опубликовано"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(EyeOff, { className: "w-3.5 h-3.5" }),
              "Черновик"
            ] }) })
          ] }),
          /* @__PURE__ */ jsx(AutoSaveIndicator, { status: saving ? "saving" : status })
        ] }),
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: onDelete, className: "text-destructive hover:text-destructive", children: [
          /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5 mr-1" }),
          "Удалить"
        ] })
      ] })
    ] })
  ] }) }) });
};
const HandoutRow = ({ item, saving, onSave, onDelete, allSlugs }) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const [draft, setDraft] = useState(item);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [showEn, setShowEn] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [showLong, setShowLong] = useState(false);
  useEffect(() => {
    setDraft(item);
  }, [item.id, item.image_path, item.file_path, item.og_image_path]);
  const slugConflict = draft.slug && allSlugs.includes(draft.slug);
  const patch = {
    title: draft.title.trim(),
    slug: ((_a = draft.slug) == null ? void 0 : _a.trim()) || null,
    description: ((_b = draft.description) == null ? void 0 : _b.trim()) || null,
    long_description: draft.long_description || null,
    title_en: ((_c = draft.title_en) == null ? void 0 : _c.trim()) || null,
    description_en: ((_d = draft.description_en) == null ? void 0 : _d.trim()) || null,
    long_description_en: draft.long_description_en || null,
    seo_title: ((_e = draft.seo_title) == null ? void 0 : _e.trim()) || null,
    seo_title_en: ((_f = draft.seo_title_en) == null ? void 0 : _f.trim()) || null,
    seo_description: ((_g = draft.seo_description) == null ? void 0 : _g.trim()) || null,
    seo_description_en: ((_h = draft.seo_description_en) == null ? void 0 : _h.trim()) || null,
    audience: draft.audience,
    pages_count: draft.pages_count,
    image_url: ((_i = draft.image_url) == null ? void 0 : _i.trim()) || null,
    emoji: draft.emoji || null
  };
  const serverPatch = {
    title: item.title,
    slug: item.slug ?? null,
    description: item.description ?? null,
    long_description: item.long_description ?? null,
    title_en: item.title_en ?? null,
    description_en: item.description_en ?? null,
    long_description_en: item.long_description_en ?? null,
    seo_title: item.seo_title ?? null,
    seo_title_en: item.seo_title_en ?? null,
    seo_description: item.seo_description ?? null,
    seo_description_en: item.seo_description_en ?? null,
    audience: item.audience,
    pages_count: item.pages_count,
    image_url: item.image_url ?? null,
    emoji: item.emoji ?? null
  };
  const { status } = useDebouncedAutoSave({
    value: patch,
    serverValue: serverPatch,
    enabled: !slugConflict,
    // don't save while slug conflicts
    onSave: async (v) => onSave(v)
  });
  const preview = resolveMaterialPreview(draft);
  const handleImageUpload = async (file) => {
    setUploadingImg(true);
    try {
      if (item.image_path) await deleteParentsMedia(item.image_path).catch(() => {
      });
      const path = await uploadParentsMedia(file);
      await onSave({ image_path: path });
      toast.success("Обложка загружена");
    } catch (e) {
      toast.error("Ошибка: " + ((e == null ? void 0 : e.message) || e));
    } finally {
      setUploadingImg(false);
    }
  };
  const handleOgUpload = async (file) => {
    setUploadingOg(true);
    try {
      if (item.og_image_path) await deleteParentsMedia(item.og_image_path).catch(() => {
      });
      const path = await uploadParentsOgImage(file);
      await onSave({ og_image_path: path });
      toast.success("OG-картинка загружена");
    } catch (e) {
      toast.error("Ошибка: " + ((e == null ? void 0 : e.message) || e));
    } finally {
      setUploadingOg(false);
    }
  };
  const handlePdfUpload = async (file) => {
    setUploadingPdf(true);
    try {
      if (item.file_path) await deleteParentsMedia(item.file_path).catch(() => {
      });
      const { path, size } = await uploadParentsHandoutPdf(file, draft.slug || void 0);
      await onSave({ file_path: path, file_size_bytes: size });
      toast.success("PDF загружен");
    } catch (e) {
      toast.error("Ошибка: " + ((e == null ? void 0 : e.message) || e));
    } finally {
      setUploadingPdf(false);
    }
  };
  const seoTitleLen = (draft.seo_title || "").length;
  const seoDescLen = (draft.seo_description || "").length;
  return /* @__PURE__ */ jsx(Card, { ref: setNodeRef, style, className: "overflow-hidden border-primary/20", children: /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-3 items-start", children: [
    /* @__PURE__ */ jsx("button", { ...attributes, ...listeners, className: "mt-1 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing", "aria-label": "Перетащить", type: "button", children: /* @__PURE__ */ jsx(GripVertical, { className: "w-5 h-5" }) }),
    /* @__PURE__ */ jsx("div", { className: "w-24 h-32 rounded-md bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center border", children: preview ? /* @__PURE__ */ jsx("img", { src: preview, alt: "", className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx(FileText, { className: "w-8 h-8 text-muted-foreground" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "gap-1", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-3 h-3" }),
          "PDF"
        ] }),
        item.file_size_bytes ? /* @__PURE__ */ jsx(Badge, { variant: "outline", children: formatBytes(item.file_size_bytes) }) : /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-amber-600", children: "PDF не загружен" }),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "gap-1", children: [
          /* @__PURE__ */ jsx(Download, { className: "w-3 h-3" }),
          item.download_count,
          " скачив."
        ] }),
        /* @__PURE__ */ jsx(MaterialLeadsDialog, { materialId: item.id, materialTitle: item.title }),
        draft.slug && /* @__PURE__ */ jsxs(Link, { to: `/for-parents/materials/${draft.slug}`, target: "_blank", className: "text-primary hover:underline inline-flex items-center gap-1", children: [
          "/for-parents/materials/",
          draft.slug,
          " ",
          /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Input, { value: draft.title, onChange: (e) => setDraft({ ...draft, title: e.target.value }), placeholder: "Заголовок памятки", className: "text-base font-medium" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-[1fr_160px_120px] gap-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              value: draft.slug ?? "",
              onChange: (e) => setDraft({ ...draft, slug: e.target.value }),
              placeholder: "url-slug",
              className: slugConflict ? "border-destructive" : ""
            }
          ),
          slugConflict && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive mt-1", children: "Slug уже занят" })
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: draft.audience ?? "parent", onValueChange: (v) => setDraft({ ...draft, audience: v }), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Аудитория" }) }),
          /* @__PURE__ */ jsx(SelectContent, { children: AUDIENCE_OPTIONS.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o.value, children: o.label }, o.value)) })
        ] }),
        /* @__PURE__ */ jsx(Input, { type: "number", min: 1, value: draft.pages_count ?? "", onChange: (e) => setDraft({ ...draft, pages_count: e.target.value ? Number(e.target.value) : null }), placeholder: "Стр." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => setDraft({ ...draft, slug: slugify(draft.title) }), children: "Сгенерировать slug из заголовка" }) }),
      /* @__PURE__ */ jsx(Textarea, { value: draft.description ?? "", onChange: (e) => setDraft({ ...draft, description: e.target.value }), placeholder: "Краткое описание (для карточки на /for-parents)", rows: 2 }),
      /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-3 bg-muted/30 space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs font-medium", children: "PDF-файл памятки:" }),
          item.file_path && /* @__PURE__ */ jsxs("a", { href: parentsMediaPublicUrl(item.file_path), target: "_blank", rel: "noopener noreferrer", className: "text-xs text-primary hover:underline inline-flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Download, { className: "w-3 h-3" }),
            "Скачать текущий"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("label", { className: "inline-flex", children: [
            /* @__PURE__ */ jsx("input", { type: "file", accept: "application/pdf", className: "hidden", disabled: uploadingPdf, onChange: (e) => {
              var _a2;
              const f = (_a2 = e.target.files) == null ? void 0 : _a2[0];
              if (f) handlePdfUpload(f);
              e.currentTarget.value = "";
            } }),
            /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", size: "sm", disabled: uploadingPdf, children: /* @__PURE__ */ jsxs("span", { children: [
              uploadingPdf ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin mr-1" }) : /* @__PURE__ */ jsx(Upload, { className: "w-3.5 h-3.5 mr-1" }),
              item.file_path ? "Заменить PDF" : "Загрузить PDF"
            ] }) })
          ] }),
          item.file_path && /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: async () => {
            await deleteParentsMedia(item.file_path);
            await onSave({ file_path: null, file_size_bytes: null });
          }, className: "text-destructive", children: [
            /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5 mr-1" }),
            "Удалить PDF"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Макс 20 МБ, только PDF" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Обложка карточки:" }),
        /* @__PURE__ */ jsxs("label", { className: "inline-flex", children: [
          /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", className: "hidden", disabled: uploadingImg, onChange: (e) => {
            var _a2;
            const f = (_a2 = e.target.files) == null ? void 0 : _a2[0];
            if (f) handleImageUpload(f);
            e.currentTarget.value = "";
          } }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", size: "sm", disabled: uploadingImg, children: /* @__PURE__ */ jsxs("span", { children: [
            uploadingImg ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin mr-1" }) : /* @__PURE__ */ jsx(Upload, { className: "w-3.5 h-3.5 mr-1" }),
            "Загрузить"
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "или" }),
        /* @__PURE__ */ jsx(Input, { value: draft.image_url ?? "", onChange: (e) => setDraft({ ...draft, image_url: e.target.value }), placeholder: "URL картинки", className: "flex-1 min-w-[220px]" }),
        item.image_path && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: async () => {
          await deleteParentsMedia(item.image_path);
          await onSave({ image_path: null });
        }, className: "text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Эмодзи (для карточки):" }),
        /* @__PURE__ */ jsx(EmojiPickerButton, { value: draft.emoji, onChange: (v) => setDraft({ ...draft, emoji: v }) }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "выводится в углу превью" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "OG-картинка (1200×630, соцсети):" }),
        /* @__PURE__ */ jsxs("label", { className: "inline-flex", children: [
          /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", className: "hidden", disabled: uploadingOg, onChange: (e) => {
            var _a2;
            const f = (_a2 = e.target.files) == null ? void 0 : _a2[0];
            if (f) handleOgUpload(f);
            e.currentTarget.value = "";
          } }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", size: "sm", disabled: uploadingOg, children: /* @__PURE__ */ jsxs("span", { children: [
            uploadingOg ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin mr-1" }) : /* @__PURE__ */ jsx(Upload, { className: "w-3.5 h-3.5 mr-1" }),
            "Загрузить OG"
          ] }) })
        ] }),
        item.og_image_path && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("a", { href: parentsMediaPublicUrl(item.og_image_path), target: "_blank", rel: "noopener noreferrer", className: "text-xs text-primary hover:underline", children: "Открыть" }),
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: async () => {
            await deleteParentsMedia(item.og_image_path);
            await onSave({ og_image_path: null });
          }, className: "text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Collapsible, { open: showLong, onOpenChange: setShowLong, children: [
        /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "text-xs", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5 mr-1" }),
          showLong ? "Скрыть длинное описание" : "Длинное описание (Markdown)"
        ] }) }),
        /* @__PURE__ */ jsxs(CollapsibleContent, { className: "space-y-2 pt-2", children: [
          /* @__PURE__ */ jsx(Textarea, { value: draft.long_description ?? "", onChange: (e) => setDraft({ ...draft, long_description: e.target.value }), placeholder: "## Что внутри\n- пункт 1\n- пункт 2\n\n## Как использовать", rows: 10, className: "font-mono text-xs" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Поддерживаются H2/H3, списки, цитаты, ссылки, таблицы (GFM)." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Collapsible, { open: showSeo, onOpenChange: setShowSeo, children: [
        /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "text-xs", children: [
          /* @__PURE__ */ jsx(ExternalLink, { className: "w-3.5 h-3.5 mr-1" }),
          showSeo ? "Скрыть SEO" : "SEO мета-теги"
        ] }) }),
        /* @__PURE__ */ jsxs(CollapsibleContent, { className: "space-y-2 pt-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Input, { value: draft.seo_title ?? "", onChange: (e) => setDraft({ ...draft, seo_title: e.target.value }), placeholder: "SEO title (fallback — заголовок)", maxLength: 80 }),
            /* @__PURE__ */ jsxs("p", { className: `text-xs mt-0.5 ${seoTitleLen > 60 ? "text-amber-600" : "text-muted-foreground"}`, children: [
              seoTitleLen,
              "/60"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Textarea, { value: draft.seo_description ?? "", onChange: (e) => setDraft({ ...draft, seo_description: e.target.value }), placeholder: "SEO description", rows: 2, maxLength: 200 }),
            /* @__PURE__ */ jsxs("p", { className: `text-xs mt-0.5 ${seoDescLen > 160 ? "text-amber-600" : "text-muted-foreground"}`, children: [
              seoDescLen,
              "/160"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Collapsible, { open: showEn, onOpenChange: setShowEn, children: [
        /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "text-xs", children: [
          /* @__PURE__ */ jsx(Languages, { className: "w-3.5 h-3.5 mr-1" }),
          showEn ? "Скрыть EN" : "Английский перевод (EN)"
        ] }) }),
        /* @__PURE__ */ jsxs(CollapsibleContent, { className: "space-y-2 pt-2", children: [
          /* @__PURE__ */ jsx(Input, { value: draft.title_en ?? "", onChange: (e) => setDraft({ ...draft, title_en: e.target.value }), placeholder: "Title (EN)" }),
          /* @__PURE__ */ jsx(Textarea, { value: draft.description_en ?? "", onChange: (e) => setDraft({ ...draft, description_en: e.target.value }), placeholder: "Short description (EN)", rows: 2 }),
          /* @__PURE__ */ jsx(Textarea, { value: draft.long_description_en ?? "", onChange: (e) => setDraft({ ...draft, long_description_en: e.target.value }), placeholder: "Long description (EN, Markdown)", rows: 6, className: "font-mono text-xs" }),
          /* @__PURE__ */ jsx(Input, { value: draft.seo_title_en ?? "", onChange: (e) => setDraft({ ...draft, seo_title_en: e.target.value }), placeholder: "SEO title (EN)", maxLength: 80 }),
          /* @__PURE__ */ jsx(Textarea, { value: draft.seo_description_en ?? "", onChange: (e) => setDraft({ ...draft, seo_description_en: e.target.value }), placeholder: "SEO description (EN)", rows: 2, maxLength: 200 })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap pt-1 border-t mt-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 flex-wrap", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Switch, { checked: draft.is_published, onCheckedChange: (v) => {
              setDraft({ ...draft, is_published: v });
              onSave({ is_published: v });
            } }),
            /* @__PURE__ */ jsx(Label, { className: "text-xs cursor-pointer flex items-center gap-1", children: draft.is_published ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Eye, { className: "w-3.5 h-3.5" }),
              "Опубликовано"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(EyeOff, { className: "w-3.5 h-3.5" }),
              "Черновик"
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Switch, { checked: draft.gated, onCheckedChange: (v) => {
              setDraft({ ...draft, gated: v });
              onSave({ gated: v });
            } }),
            /* @__PURE__ */ jsx(Label, { className: "text-xs cursor-pointer text-muted-foreground", children: "Гейт (форма перед скачиванием)" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(AutoSaveIndicator, { status: saving ? "saving" : slugConflict ? "error" : status }),
          /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: onDelete, className: "text-destructive hover:text-destructive", children: [
            /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5 mr-1" }),
            "Удалить"
          ] })
        ] })
      ] })
    ] })
  ] }) }) });
};
export {
  AdminParentsMaterials as default
};
