import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { u as useAuth, B as Button, C as Card, a as CardContent, I as Input, b as Badge, w as Sheet, y as SheetContent, z as SheetHeader, A as SheetTitle, V as SheetDescription, s as supabase } from "../main.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { Loader2, ArrowLeft, Move, Save, AlertTriangle } from "lucide-react";
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
import "react-helmet-async";
import "@radix-ui/react-select";
const VIEWS = [
  { key: "front", label: "Передняя" },
  { key: "back", label: "Задняя" },
  { key: "side", label: "Боковая" },
  { key: "head", label: "Голова" },
  { key: "hand", label: "Кисть" },
  { key: "foot", label: "Стопа" }
];
function BodySilhouette({ view }) {
  if (view === "front" || view === "back") {
    return /* @__PURE__ */ jsxs("g", { fill: "none", stroke: "currentColor", strokeWidth: "1.2", className: "text-muted-foreground/40", children: [
      /* @__PURE__ */ jsx("ellipse", { cx: "100", cy: "40", rx: "22", ry: "28" }),
      /* @__PURE__ */ jsx("path", { d: "M82 65 L72 95 L60 200 L55 320 L60 480 L80 480 L88 350 L100 200 L112 350 L120 480 L140 480 L145 320 L140 200 L128 95 L118 65 Z" }),
      /* @__PURE__ */ jsx("path", { d: "M75 100 L40 240 L48 360 L62 360 L58 240 L80 130" }),
      /* @__PURE__ */ jsx("path", { d: "M125 100 L160 240 L152 360 L138 360 L142 240 L120 130" })
    ] });
  }
  if (view === "side") {
    return /* @__PURE__ */ jsxs("g", { fill: "none", stroke: "currentColor", strokeWidth: "1.2", className: "text-muted-foreground/40", children: [
      /* @__PURE__ */ jsx("ellipse", { cx: "105", cy: "40", rx: "20", ry: "28" }),
      /* @__PURE__ */ jsx("path", { d: "M100 65 L90 120 L95 220 L90 320 L95 480 L115 480 L120 320 L115 220 L120 120 Z" })
    ] });
  }
  return /* @__PURE__ */ jsx("g", { fill: "none", stroke: "currentColor", strokeWidth: "1.2", className: "text-muted-foreground/40", children: /* @__PURE__ */ jsx("rect", { x: "60", y: "40", width: "80", height: "420", rx: "40" }) });
}
function AdminAcupointsAtlas() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(true);
  const [points, setPoints] = useState([]);
  const [view, setView] = useState("front");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [draftCoords, setDraftCoords] = useState({});
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth", { state: { from: "/admin/acupoints/atlas" } });
  }, [user, isAdmin, loading, navigate]);
  const load = async () => {
    setBusy(true);
    const { data } = await supabase.from("acupoints").select("*").order("who_code");
    setPoints(data || []);
    setBusy(false);
  };
  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return points.filter((p) => {
      var _a;
      const v = ((_a = draftCoords[p.id]) == null ? void 0 : _a.view) ?? p.svg_view ?? "front";
      if (v !== view) return false;
      if (!s) return true;
      return p.who_code.toLowerCase().includes(s) || (p.pinyin || "").toLowerCase().includes(s) || (p.name_ru || "").toLowerCase().includes(s);
    });
  }, [points, view, q, draftCoords]);
  const unplacedHere = useMemo(() => points.filter((p) => {
    var _a, _b;
    const v = ((_a = draftCoords[p.id]) == null ? void 0 : _a.view) ?? p.svg_view;
    const x = ((_b = draftCoords[p.id]) == null ? void 0 : _b.x) ?? p.svg_marker_x;
    return (!v || v !== view) && !x && view === "front";
  }), [points, view, draftCoords]);
  const handleSvgClick = (e) => {
    if (!editMode || !open) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const loc = pt.matrixTransform(ctm.inverse());
    setDraftCoords((prev) => ({ ...prev, [open.id]: { x: +loc.x.toFixed(1), y: +loc.y.toFixed(1), view } }));
    toast.success(`Координаты ${loc.x.toFixed(0)}, ${loc.y.toFixed(0)} — нажмите «Сохранить»`);
  };
  const saveDrafts = async () => {
    const entries = Object.entries(draftCoords);
    if (!entries.length) {
      toast.info("Нет изменений");
      return;
    }
    for (const [id, c] of entries) {
      const { error } = await supabase.from("acupoints").update({
        svg_marker_x: c.x,
        svg_marker_y: c.y,
        svg_view: c.view
      }).eq("id", id);
      if (error) {
        toast.error(error.message);
        return;
      }
    }
    toast.success(`Сохранено координат: ${entries.length}`);
    setDraftCoords({});
    await load();
  };
  if (loading || !isAdmin) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background p-4 md:p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/admin/acupoints", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
            "К каталогу"
          ] }) }),
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold", children: "Анатомический атлас точек" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-center", children: [
          /* @__PURE__ */ jsxs(Button, { variant: editMode ? "default" : "outline", size: "sm", onClick: () => setEditMode(!editMode), children: [
            /* @__PURE__ */ jsx(Move, { className: "w-4 h-4 mr-2" }),
            editMode ? "Режим расстановки ВКЛ" : "Расставить точки"
          ] }),
          Object.keys(draftCoords).length > 0 && /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: saveDrafts, children: [
            /* @__PURE__ */ jsx(Save, { className: "w-4 h-4 mr-2" }),
            "Сохранить (",
            Object.keys(draftCoords).length,
            ")"
          ] })
        ] })
      ] }),
      editMode && /* @__PURE__ */ jsx(Card, { className: "border-amber-500/50 bg-amber-500/5", children: /* @__PURE__ */ jsxs(CardContent, { className: "py-3 text-sm", children: [
        /* @__PURE__ */ jsx("strong", { children: "Режим расстановки:" }),
        " выберите точку в списке справа → кликните на схеме, чтобы установить координату. Затем нажмите «Сохранить»."
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-4", children: [
        /* @__PURE__ */ jsx(Card, { className: "col-span-12 lg:col-span-7", children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3 gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxs(Select, { value: view, onValueChange: setView, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "w-44", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsx(SelectContent, { children: VIEWS.map((v) => /* @__PURE__ */ jsxs(SelectItem, { value: v.key, children: [
                v.label,
                " проекция"
              ] }, v.key)) })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
              "Точек на проекции: ",
              filtered.length
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-muted/20 rounded-lg p-2", children: /* @__PURE__ */ jsxs(
            "svg",
            {
              viewBox: "0 0 200 500",
              className: `w-full h-auto max-h-[75vh] ${editMode ? "cursor-crosshair" : ""}`,
              onClick: handleSvgClick,
              children: [
                /* @__PURE__ */ jsx(BodySilhouette, { view }),
                filtered.map((p) => {
                  const c = draftCoords[p.id];
                  const x = (c == null ? void 0 : c.x) ?? p.svg_marker_x ?? 0;
                  const y = (c == null ? void 0 : c.y) ?? p.svg_marker_y ?? 0;
                  if (!x || !y) return null;
                  const isDraft = !!c;
                  return /* @__PURE__ */ jsxs(
                    "g",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        if (!editMode) setOpen(p);
                      },
                      className: editMode ? "" : "cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsx(
                          "circle",
                          {
                            cx: x,
                            cy: y,
                            r: 4,
                            className: p.is_caution ? "fill-amber-500" : "fill-primary",
                            stroke: isDraft ? "hsl(var(--accent))" : "hsl(var(--background))",
                            strokeWidth: "1.5"
                          }
                        ),
                        /* @__PURE__ */ jsx("text", { x: x + 6, y: y + 3, className: "fill-foreground", style: { fontSize: "6px" }, children: p.who_code })
                      ]
                    },
                    p.id
                  );
                })
              ]
            }
          ) })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { className: "col-span-12 lg:col-span-5", children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-6 space-y-3", children: [
          /* @__PURE__ */ jsx(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Поиск точки…" }),
          busy ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-6", children: /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxs("div", { className: "space-y-1 max-h-[65vh] overflow-y-auto", children: [
            editMode && unplacedHere.length > 0 && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground py-2", children: [
              "Не расставленные точки (",
              unplacedHere.length,
              "). Кликните любую, затем место на схеме."
            ] }),
            (editMode ? points : filtered).map((p) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setOpen(p),
                className: `w-full text-left px-3 py-1.5 rounded hover:bg-muted flex items-center gap-2 ${(open == null ? void 0 : open.id) === p.id ? "bg-muted" : ""}`,
                children: [
                  /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "font-mono text-xs shrink-0", children: p.who_code }),
                  /* @__PURE__ */ jsx("span", { className: "truncate text-sm", children: p.name_ru || p.pinyin }),
                  p.is_caution && /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3.5 h-3.5 text-amber-600 shrink-0" })
                ]
              },
              p.id
            ))
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Sheet, { open: !!open && !editMode, onOpenChange: (o) => !o && setOpen(null), children: /* @__PURE__ */ jsx(SheetContent, { className: "overflow-y-auto", children: open && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(SheetHeader, { children: [
        /* @__PURE__ */ jsxs(SheetTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "font-mono", children: open.who_code }),
          open.name_ru || open.pinyin
        ] }),
        /* @__PURE__ */ jsxs(SheetDescription, { children: [
          open.pinyin,
          " ",
          open.location_description ? `· ${open.location_description}` : ""
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3 text-sm", children: [
        open.is_caution && /* @__PURE__ */ jsxs("div", { className: "border border-amber-500/50 bg-amber-500/10 rounded p-3 flex gap-2", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-amber-600 shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsx("span", { children: "Точка осторожного применения" })
        ] }),
        open.depth_mm && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Глубина:" }),
          " ",
          open.depth_mm
        ] }),
        open.manipulation_default && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Манипуляция:" }),
          " ",
          open.manipulation_default
        ] }),
        open.indications && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Показания:" }),
          /* @__PURE__ */ jsx("br", {}),
          open.indications
        ] }),
        open.contraindications && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Противопоказания:" }),
          /* @__PURE__ */ jsx("br", {}),
          open.contraindications
        ] })
      ] })
    ] }) }) }),
    editMode && open && /* @__PURE__ */ jsxs("div", { className: "fixed bottom-4 left-1/2 -translate-x-1/2 bg-card border shadow-lg rounded-lg px-4 py-2 flex items-center gap-3 z-50", children: [
      /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "font-mono", children: open.who_code }),
      /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Кликните на схеме место точки" }),
      /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: () => setOpen(null), children: "Отмена" })
    ] })
  ] });
}
export {
  AdminAcupointsAtlas as default
};
