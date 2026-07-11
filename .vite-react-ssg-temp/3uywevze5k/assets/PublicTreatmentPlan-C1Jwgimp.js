import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { s as supabase } from "../main.mjs";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import "vite-react-ssg";
import "@tanstack/react-query";
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
import "react-i18next";
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
const SIDE_RU = { bilateral: "билат.", left: "слева", right: "справа" };
function formatAcuPoint(pt) {
  const head = `${pt.who_code}${pt.name_ru ? " " + pt.name_ru : pt.pinyin ? " " + pt.pinyin : ""}`;
  const tail = [];
  if (pt.side && SIDE_RU[pt.side]) tail.push(SIDE_RU[pt.side]);
  if (pt.manipulation) tail.push(pt.manipulation);
  if (pt.depth_mm) tail.push(`глуб. ${pt.depth_mm} мм`);
  if (pt.retention_min != null) tail.push(`${pt.retention_min} мин`);
  let line = tail.length ? `${head} — ${tail.join(", ")}` : head;
  if (pt.notes) line += `. ${pt.notes}`;
  return line;
}
const GROUPS = [
  { key: "iv", emoji: "💧", label: "Внутривенные капельницы", cats: ["iv_drip", "iv_bolus"] },
  { key: "inj", emoji: "💉", label: "Уколы (в/м, п/к, пептиды)", cats: ["im", "sc", "peptide"] },
  { key: "rx", emoji: "💊", label: "Таблетки и капсулы по рецепту", cats: ["oral_rx"] },
  { key: "supp", emoji: "🌿", label: "Витамины и БАДы", cats: ["oral_supplement"] },
  { key: "top", emoji: "🖐", label: "Наружные средства (гели, кремы)", cats: ["topical"] },
  { key: "rect", emoji: "🔻", label: "Ректальные свечи", cats: ["rectal"] },
  { key: "nas", emoji: "👃", label: "Назальные средства", cats: ["nasal"] },
  { key: "sub", emoji: "👅", label: "Под язык", cats: ["sublingual"] },
  { key: "proc", emoji: "🩺", label: "Процедуры", cats: ["procedure"] },
  { key: "life", emoji: "🌟", label: "Образ жизни и рекомендации", cats: ["lifestyle"] }
];
function PublicTreatmentPlan() {
  var _a;
  const { hash } = useParams();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    if (!hash) {
      setNotFound(true);
      setBusy(false);
      return;
    }
    (async () => {
      const { data: row, error } = await supabase.rpc("get_public_plan", { _hash: hash });
      if (error || !row) {
        setNotFound(true);
        setBusy(false);
        return;
      }
      setData(row);
      setBusy(false);
      supabase.rpc("increment_public_plan_view", { _hash: hash }).then(() => {
      });
    })();
  }, [hash]);
  const groups = useMemo(() => {
    if (!data) return [];
    const acu = data.acupuncture || {};
    const byCat = {};
    data.items.forEach((it) => {
      var _a2, _b, _c;
      const info = it.patient_info || {};
      const name = ((_a2 = info.patient_name) == null ? void 0 : _a2.trim()) || it.name_snapshot;
      const parts = [info.patient_purpose, info.patient_instruction, info.patient_description, info.patient_caution].map((s) => (s || "").trim()).filter(Boolean);
      const description = parts.join(" ");
      const irt = it.catalog_id ? acu[it.catalog_id] : void 0;
      if ((info.patient_visibility || "visible") === "grouped" && info.patient_group_label) {
        const arr = byCat[_b = it.section_category] ?? (byCat[_b] = []);
        const existing = arr.find((x) => x.isGroup && x.name === info.patient_group_label);
        if (existing) {
          if (description && !existing.description.includes(description)) {
            existing.description = existing.description ? `${existing.description}; ${description}` : description;
          }
        } else {
          arr.push({ name: info.patient_group_label, description, isGroup: true, irt });
        }
        return;
      }
      (byCat[_c = it.section_category] ?? (byCat[_c] = [])).push({ name, description, irt });
    });
    return GROUPS.map((g) => {
      const merged = [];
      g.cats.forEach((c) => merged.push(...byCat[c] || []));
      return merged.length ? { emoji: g.emoji, label: g.label, items: merged } : null;
    }).filter(Boolean);
  }, [data]);
  if (busy) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  if (notFound || !data) {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(Helmet, { children: [
        /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex, nofollow" }),
        /* @__PURE__ */ jsx("title", { children: "Памятка не найдена" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center text-center px-6", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold mb-2", children: "Памятка недоступна" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Ссылка устарела или была отозвана. Обратитесь к лечащему врачу." })
      ] })
    ] });
  }
  const date = new Date(data.plan.issued_at);
  const labRows = data.plan.lab_control_enabled ? data.lab_control : [];
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Helmet, { children: [
      /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex, nofollow" }),
      /* @__PURE__ */ jsx("title", { children: "Памятка пациенту — Профессор Тарусин Д.И." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-muted/30 py-6 print:bg-white print:py-0", children: [
      /* @__PURE__ */ jsx("style", { children: `
          @media print {
            .no-print { display: none !important; }
            .memo-page { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 15mm !important; }
            @page { size: A4 portrait; margin: 15mm; }
          }
        ` }),
      /* @__PURE__ */ jsxs("div", { className: "memo-page bg-white text-black mx-auto shadow-lg", style: { maxWidth: "210mm", minHeight: "297mm", padding: "10mm", fontFamily: "Georgia, 'Times New Roman', serif", lineHeight: 1.55 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { borderBottom: "2px solid #000", paddingBottom: "4mm", marginBottom: "6mm" }, children: [
          /* @__PURE__ */ jsx("div", { style: { textAlign: "center", fontSize: "10pt", letterSpacing: "0.5px" }, children: "Министерство здравоохранения Российской Федерации" }),
          /* @__PURE__ */ jsx("div", { style: { textAlign: "center", fontWeight: "bold", fontSize: "13pt", marginTop: "2mm" }, children: "Профессор, д.м.н. Тарусин Дмитрий Игоревич" }),
          /* @__PURE__ */ jsx("div", { style: { textAlign: "center", fontSize: "9.5pt", marginTop: "1mm", color: "#444" }, children: "Детский уролог-андролог высшей категории · Московский андрологический центр" })
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-center font-bold tracking-wide", style: { fontSize: "22pt", marginBottom: "4mm" }, children: [
          "ПАМЯТКА ПАЦИЕНТУ",
          data.plan.course_number != null ? ` · Курс № ${data.plan.course_number}` : ""
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-center", style: { fontSize: "11pt", color: "#555", marginBottom: "2mm" }, children: [
          "для ",
          /* @__PURE__ */ jsx("b", { style: { color: "#000" }, children: ((_a = data.patient) == null ? void 0 : _a.full_name) || "—" }),
          " · ",
          "курс ",
          data.plan.duration_days,
          " дней",
          " · ",
          format(date, "d MMMM yyyy 'г.'", { locale: ru })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-center italic", style: { color: "#555", fontSize: "10.5pt", marginBottom: "8mm" }, children: "Это пояснение к листу назначений простым языком. Если что-то непонятно — звоните или пишите перед началом курса." }),
        groups.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-center italic", style: { color: "#888" }, children: "Памятка пока не заполнена." }),
        groups.map((g) => /* @__PURE__ */ jsxs("section", { style: { marginBottom: "6mm", breakInside: "avoid" }, children: [
          /* @__PURE__ */ jsxs("h2", { className: "font-bold uppercase tracking-wider", style: { fontSize: "12pt", marginBottom: "2mm", borderBottom: "1px solid #ccc", paddingBottom: "1mm" }, children: [
            g.emoji,
            " ",
            g.label
          ] }),
          /* @__PURE__ */ jsx("ul", { style: { paddingLeft: "6mm", margin: 0 }, children: g.items.map((it, i) => /* @__PURE__ */ jsxs("li", { style: { marginBottom: "2.5mm" }, children: [
            /* @__PURE__ */ jsx("b", { children: it.name }),
            it.description ? /* @__PURE__ */ jsxs("span", { children: [
              " — ",
              it.description
            ] }) : null,
            it.irt && /* @__PURE__ */ jsxs("div", { style: { marginTop: "1.5mm", paddingLeft: "3mm", borderLeft: "2px solid #ddd", fontSize: "10.5pt", color: "#333" }, children: [
              /* @__PURE__ */ jsxs("div", { style: { fontStyle: "italic", color: "#555", marginBottom: "1mm" }, children: [
                "Курс ИРТ: ",
                it.irt.session_count ?? "—",
                " сеансов",
                it.irt.session_duration_min ? ` по ${it.irt.session_duration_min} мин` : "",
                it.irt.frequency ? `, ${it.irt.frequency}` : ""
              ] }),
              it.irt.points.length > 0 && /* @__PURE__ */ jsx("ol", { style: { paddingLeft: "5mm", margin: 0 }, children: it.irt.points.map((pt, j) => /* @__PURE__ */ jsx("li", { style: { marginBottom: "0.5mm" }, children: formatAcuPoint(pt) }, j)) })
            ] })
          ] }, i)) })
        ] }, g.label)),
        labRows.length > 0 && /* @__PURE__ */ jsxs("section", { style: { marginTop: "6mm", breakInside: "avoid" }, children: [
          /* @__PURE__ */ jsx("h2", { className: "font-bold uppercase tracking-wider", style: { fontSize: "12pt", marginBottom: "2mm", borderBottom: "1px solid #ccc", paddingBottom: "1mm" }, children: "🔬 Контроль на фоне терапии" }),
          /* @__PURE__ */ jsx("ul", { style: { paddingLeft: "6mm", margin: 0 }, children: labRows.map((lc) => {
            const tests = [
              ...(lc.test_ids || []).map((tid) => data.test_names[tid]).filter(Boolean),
              ...lc.custom_tests || []
            ];
            return /* @__PURE__ */ jsxs("li", { style: { marginBottom: "2mm" }, children: [
              /* @__PURE__ */ jsx("b", { children: lc.control_point || "Контроль" }),
              lc.at_day != null ? ` (день ${lc.at_day})` : "",
              tests.length ? ` — ${tests.join(", ")}` : "",
              lc.notes ? /* @__PURE__ */ jsx("div", { style: { fontSize: "10pt", color: "#555", fontStyle: "italic", marginTop: "0.5mm" }, children: lc.notes }) : null
            ] }, lc.id);
          }) })
        ] }),
        /* @__PURE__ */ jsxs("section", { style: { marginTop: "10mm", paddingTop: "4mm", borderTop: "1px solid #ccc", fontSize: "10pt", color: "#333" }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontWeight: "bold", marginBottom: "1.5mm" }, children: "📞 Контакты МАЦ" }),
          /* @__PURE__ */ jsx("div", { children: "Московский андрологический центр" }),
          /* @__PURE__ */ jsxs("div", { children: [
            "Сайт: ",
            /* @__PURE__ */ jsx("a", { href: "https://tarusin-professor.ru", style: { color: "#0066cc" }, children: "tarusin-professor.ru" })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { marginTop: "1mm", fontStyle: "italic", color: "#666" }, children: "Памятка не заменяет лист назначений и консультацию врача. Все вопросы — на приёме или по телефону." })
        ] })
      ] })
    ] })
  ] });
}
export {
  PublicTreatmentPlan as default
};
