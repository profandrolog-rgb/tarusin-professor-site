var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useState, useEffect, useRef, useCallback, Component, memo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { L as Label, I as Input, s as supabase, D as Dialog, f as DialogTrigger, B as Button, h as DialogContent, i as DialogHeader, j as DialogTitle, C as Card, c as CardHeader, d as CardTitle, a as CardContent, n as cn, w as Sheet, x as SheetTrigger, y as SheetContent, z as SheetHeader, A as SheetTitle, b as Badge, T as Textarea, u as useAuth } from "../main.mjs";
import { Search, Eye, Printer, FileDown, FileText, Info, CalendarIcon, Trash2, Plus, Loader2, Copy, UserPlus, BookOpen, Tag, Pill, AlertTriangle, Syringe, Calculator, Baby, Weight, Ruler, ShieldAlert, CheckCircle2, Clock, TrendingUp, Save, RefreshCw, ArrowDown, ArrowUp, Pencil, ArrowLeft, Stethoscope } from "lucide-react";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CJYPrMmK.js";
import { C as Calendar } from "./calendar-Cfljuh-A.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-C_8nSrct.js";
import { format } from "date-fns";
import { toast } from "sonner";
import { P as PatientSelect } from "./PatientSelect-GQWx7tp3.js";
import { ru } from "date-fns/locale";
import { e as exportNodeToPdf } from "./exportPdf-BAJanap8.js";
import { p as popRxBatch, g as getPendingRxCount, a as popNextPendingRxItem, s as setActiveContext, c as clearActiveContextIfMatches } from "./protocolBridge-4TuhSmsW.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { A as AlertDialog, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-B9yOFgqE.js";
import { A as Accordion, a as AccordionItem, b as AccordionTrigger, c as AccordionContent } from "./accordion-CN1jpepQ.js";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ReferenceArea, ReferenceLine } from "recharts";
import { S as Switch } from "./switch-D2b9t4DD.js";
import { u as useProtocolFragmentReceiver } from "./useProtocolFragmentReceiver-B3USCy2g.js";
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
import "@radix-ui/react-tabs";
import "react-day-picker";
import "@radix-ui/react-popover";
import "jspdf";
import "html2canvas";
import "@radix-ui/react-select";
import "@radix-ui/react-alert-dialog";
import "@radix-ui/react-accordion";
import "@radix-ui/react-switch";
function MedicationSearch({ onSelect }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  useEffect(() => {
    if (search.length >= 2) {
      const fetchMeds = async () => {
        const { data } = await supabase.from("medications").select("*").or(`latin_name.ilike.%${search}%,trade_name.ilike.%${search}%`).limit(20);
        setResults(data || []);
        setShowDropdown(true);
      };
      fetchMeds();
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [search]);
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsx(Label, { children: "Поиск препарата (латинское или торговое название)" }),
    /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          value: search,
          onChange: (e) => setSearch(e.target.value),
          placeholder: "Например: Amoxicillinum или Амоксициллин...",
          className: "pl-9"
        }
      )
    ] }),
    showDropdown && results.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto", children: results.map((med) => /* @__PURE__ */ jsxs(
      "button",
      {
        className: "w-full text-left px-4 py-2 hover:bg-secondary/50 transition-colors border-b last:border-b-0",
        onClick: () => {
          onSelect({
            latin_name: med.latin_name,
            dosage_form: med.dosage_form || "",
            dose: med.dosage || ""
          });
          setSearch("");
          setShowDropdown(false);
        },
        children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium", children: med.latin_name }),
          /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
            med.trade_name && /* @__PURE__ */ jsxs("span", { children: [
              med.trade_name,
              " · "
            ] }),
            med.dosage_form && /* @__PURE__ */ jsx("span", { children: med.dosage_form }),
            med.dosage && /* @__PURE__ */ jsxs("span", { children: [
              " · ",
              med.dosage
            ] })
          ] })
        ]
      },
      med.id
    )) })
  ] });
}
const s = {
  page: {
    width: "105mm",
    minHeight: "148mm",
    padding: "5mm 6mm",
    fontFamily: "Times New Roman, serif",
    fontSize: "9pt",
    border: "1px solid #000",
    boxSizing: "border-box",
    background: "#fff",
    color: "#000",
    lineHeight: "1.4",
    position: "relative"
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "7pt",
    marginBottom: "1mm"
  },
  headerLeft: {
    borderBottom: "1px solid #000",
    minWidth: "55mm",
    textAlign: "center",
    paddingBottom: "0.5mm",
    fontSize: "7pt"
  },
  headerRight: {
    textAlign: "right",
    fontSize: "7pt"
  },
  formTitle: {
    textAlign: "center",
    marginTop: "2mm",
    marginBottom: "2mm"
  },
  line: {
    borderBottom: "1px solid #000",
    display: "inline-block",
    minWidth: "20mm",
    verticalAlign: "bottom"
  },
  fieldRow: {
    marginBottom: "1.5mm",
    fontSize: "9pt"
  },
  separator: {
    borderTop: "1px solid #000",
    margin: "2mm 0"
  },
  rpBlock: {
    fontSize: "9pt",
    marginBottom: "2mm"
  },
  sigRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "3mm",
    fontSize: "9pt"
  },
  bottomNote: {
    fontSize: "7pt",
    marginTop: "2mm",
    textAlign: "center"
  }
};
const FORM_LABELS$1 = {
  unguentum: "unguentum",
  pasta: "pastam",
  cremor: "cremorem",
  gel: "gel",
  linimentum: "linimentum",
  suspensio: "suspensionem",
  suppositoria: "suppositoria",
  mixtura: "mixturam",
  tinctura: "tincturam",
  solutio: "solutionem"
};
function getMisceFormLabel(formType) {
  return formType ? FORM_LABELS$1[formType] || formType : "unguentum";
}
function PrescriptionPrint({ prescription }) {
  var _a;
  const date = new Date(prescription.prescription_date);
  const birthDate = new Date(prescription.patient.birth_date);
  const now = date;
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || m === 0 && now.getDate() < birthDate.getDate()) age--;
  return /* @__PURE__ */ jsxs("div", { className: "prescription-print-area", style: s.page, children: [
    /* @__PURE__ */ jsxs("div", { style: s.headerRow, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: "7pt", marginBottom: "0.5mm" }, children: "Министерство здравоохранения" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "7pt", marginBottom: "0.5mm" }, children: "Российской Федерации" }),
        /* @__PURE__ */ jsx("div", { style: { ...s.headerLeft, minWidth: "50mm", marginTop: "1mm" }, children: " " }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "6pt", textAlign: "center" }, children: "Наименование (штамп)" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "6pt", textAlign: "center" }, children: "медицинской организации" })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: s.headerRight, children: [
        /* @__PURE__ */ jsx("div", { children: "Код формы по ОКУД _______" }),
        /* @__PURE__ */ jsx("div", { children: "Код учреждения по ОКПО _______" }),
        /* @__PURE__ */ jsx("div", { style: { marginTop: "1mm" }, children: "Медицинская документация" }),
        /* @__PURE__ */ jsx("div", { style: { fontWeight: "bold" }, children: "Форма № 107-1/у" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "6pt" }, children: "Утверждена Приказом" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "6pt" }, children: "Министерства здравоохранения" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "6pt" }, children: "Российской Федерации" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: "6pt" }, children: "от 24 ноября 2021 г. № 1094н" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: s.formTitle, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: "11pt", fontWeight: "bold", letterSpacing: "2px" }, children: "РЕЦЕПТ" }),
      /* @__PURE__ */ jsxs("div", { style: { fontSize: "8pt" }, children: [
        "(взрослый, детский — ",
        /* @__PURE__ */ jsx("span", { style: { textDecoration: prescription.patient.birth_date && age < 18 ? "underline" : "none" }, children: "нужное подчеркнуть" }),
        ")"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: s.fieldRow, children: [
      "«",
      /* @__PURE__ */ jsx("span", { style: { ...s.line, minWidth: "8mm", textAlign: "center" }, children: format(date, "dd") }),
      "»",
      " ",
      /* @__PURE__ */ jsx("span", { style: { ...s.line, minWidth: "30mm", textAlign: "center" }, children: format(date, "LLLL", { locale: ru }) }),
      " ",
      /* @__PURE__ */ jsx("span", { style: { ...s.line, minWidth: "15mm", textAlign: "center" }, children: format(date, "yyyy") }),
      " ",
      "г."
    ] }),
    /* @__PURE__ */ jsxs("div", { style: s.fieldRow, children: [
      "Ф.И.О. пациента:",
      " ",
      /* @__PURE__ */ jsx("span", { style: { ...s.line, minWidth: "85mm" }, children: prescription.patient.full_name })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: s.fieldRow, children: [
      "Дата рождения:",
      " ",
      /* @__PURE__ */ jsx("span", { style: { ...s.line, minWidth: "25mm" }, children: format(birthDate, "dd.MM.yyyy") }),
      " ",
      "Возраст:",
      " ",
      /* @__PURE__ */ jsxs("span", { style: { ...s.line, minWidth: "15mm" }, children: [
        age,
        " ",
        age % 10 === 1 && age !== 11 ? "год" : age % 10 >= 2 && age % 10 <= 4 && (age < 12 || age > 14) ? "года" : "лет"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: s.fieldRow, children: [
      "Ф.И.О. врача (фельдшера, акушерки):",
      " ",
      /* @__PURE__ */ jsx("span", { style: { ...s.line, minWidth: "60mm" }, children: prescription.doctor_name })
    ] }),
    /* @__PURE__ */ jsx("div", { style: s.separator }),
    prescription.prescription_type === "standard" && ((_a = prescription.items) == null ? void 0 : _a.map((item, idx) => /* @__PURE__ */ jsxs("div", { style: s.rpBlock, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Rp:" }),
        " ",
        item.medication_latin_name,
        item.dosage_form ? ` (${item.dosage_form})` : "",
        item.dose ? ` ${item.dose}` : ""
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { paddingLeft: "8mm" }, children: [
        "D.t.d. N ",
        item.quantity
      ] }),
      (item.frequency || item.duration) && /* @__PURE__ */ jsxs("div", { style: { paddingLeft: "8mm" }, children: [
        "S. ",
        item.frequency,
        item.frequency && item.duration ? ", " : "",
        item.duration
      ] }),
      /* @__PURE__ */ jsx("div", { style: { textAlign: "right", fontSize: "8pt", marginTop: "0.5mm" }, children: "_______ руб. _______ коп." })
    ] }, idx))),
    prescription.prescription_type === "extemporaneous" && prescription.ingredients && /* @__PURE__ */ jsxs("div", { style: s.rpBlock, children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("strong", { children: "Rp:" }) }),
      prescription.ingredients.map((ing, idx) => /* @__PURE__ */ jsxs("div", { style: { paddingLeft: "8mm" }, children: [
        ing.ingredient_name,
        " ",
        ing.amount,
        " ",
        ing.unit
      ] }, idx)),
      /* @__PURE__ */ jsxs("div", { style: { paddingLeft: "8mm", marginTop: "1mm", fontStyle: "italic" }, children: [
        "M.f. ",
        getMisceFormLabel(prescription.extemporaneous_form_type)
      ] }),
      /* @__PURE__ */ jsx("div", { style: { paddingLeft: "8mm", fontSize: "7pt", color: "#555" }, children: "Misce ut fiat — Смешай, чтобы получилось" }),
      /* @__PURE__ */ jsxs("div", { style: { paddingLeft: "8mm", marginTop: "1mm" }, children: [
        "D.S. ",
        prescription.signa || "По назначению врача"
      ] }),
      /* @__PURE__ */ jsx("div", { style: { textAlign: "right", fontSize: "8pt", marginTop: "0.5mm" }, children: "_______ руб. _______ коп." })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: s.sigRow, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        "Подпись и печать лечащего",
        /* @__PURE__ */ jsx("br", {}),
        "врача (фельдшера, акушерки) _______________"
      ] }),
      /* @__PURE__ */ jsx("div", { style: { textAlign: "right" }, children: "М.П." })
    ] }),
    /* @__PURE__ */ jsx("div", { style: s.separator }),
    /* @__PURE__ */ jsxs("div", { style: s.bottomNote, children: [
      "Рецепт действителен в течение ",
      /* @__PURE__ */ jsx("span", { style: { textDecoration: "underline" }, children: "60 дней" }),
      ", 15 дней",
      /* @__PURE__ */ jsx("br", {}),
      "(нужное подчеркнуть) (количество)"
    ] })
  ] });
}
function PrescriptionPreview({ prescription, trigger }) {
  const printRef = useRef(null);
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Рецепт</title>
      <style>
        @page{size:A4 portrait;margin:0}
        body{margin:0;padding:0;display:flex;justify-content:flex-end}
        *{box-sizing:border-box}
      </style>
      </head><body>${printContent.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };
  return /* @__PURE__ */ jsxs(Dialog, { children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: trigger || /* @__PURE__ */ jsxs(Button, { variant: "outline", children: [
      /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4 mr-2" }),
      " Предпросмотр"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-[700px] max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Предпросмотр рецепта" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-4", children: [
        /* @__PURE__ */ jsxs(Button, { onClick: handlePrint, children: [
          /* @__PURE__ */ jsx(Printer, { className: "h-4 w-4 mr-2" }),
          " Печать"
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            onClick: async () => {
              var _a;
              if (!printRef.current) return;
              const name = ((_a = prescription == null ? void 0 : prescription.patient_name) == null ? void 0 : _a.replace(/\s+/g, "_")) || "prescription";
              await exportNodeToPdf(printRef.current, `${name}_рецепт.pdf`);
            },
            children: [
              /* @__PURE__ */ jsx(FileDown, { className: "h-4 w-4 mr-2" }),
              " Скачать PDF"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { ref: printRef, className: "flex justify-center", children: /* @__PURE__ */ jsx(PrescriptionPrint, { prescription }) })
    ] })
  ] });
}
function PrescriptionForm({ repeatPrescriptionId, repeatWithoutPatient, onSaved }) {
  const [patient, setPatient] = useState(null);
  const [prescriptionDate, setPrescriptionDate] = useState(/* @__PURE__ */ new Date());
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedPrescription, setSavedPrescription] = useState(null);
  const [pendingRxRemaining, setPendingRxRemaining] = useState(0);
  const printRef = useRef(null);
  const [searchParams] = useSearchParams();
  const queryPatientId = searchParams.get("patientId");
  useEffect(() => {
    if (repeatPrescriptionId) {
      loadRepeatPrescription(repeatPrescriptionId);
    }
  }, [repeatPrescriptionId, repeatWithoutPatient]);
  useEffect(() => {
    if (!queryPatientId || patient) return;
    (async () => {
      const { data } = await supabase.from("patients").select("id, full_name, birth_date").eq("id", queryPatientId).maybeSingle();
      if (data) setPatient(data);
    })();
  }, [queryPatientId, patient]);
  const loadNextPendingRx = () => {
    const next = popNextPendingRxItem(queryPatientId ?? void 0);
    if (next) {
      setItems([{
        medication_latin_name: next.item.medication_latin_name,
        dosage_form: next.item.dosage_form,
        dose: next.item.dose,
        quantity: next.item.quantity || 1,
        frequency: next.item.frequency,
        duration: next.item.duration
      }]);
      setPendingRxRemaining(next.remaining);
      return true;
    }
    setPendingRxRemaining(0);
    return false;
  };
  useEffect(() => {
    if (repeatPrescriptionId) return;
    const batch = popRxBatch(queryPatientId ?? void 0);
    if (batch && batch.items.length > 0) {
      setItems(
        batch.items.map((it) => ({
          medication_latin_name: it.medication_latin_name,
          dosage_form: it.dosage_form,
          dose: it.dose,
          quantity: it.quantity || 1,
          frequency: it.frequency,
          duration: it.duration
        }))
      );
      setPendingRxRemaining(0);
      return;
    }
    if (getPendingRxCount() > 0) {
      loadNextPendingRx();
    }
  }, []);
  const loadRepeatPrescription = async (id) => {
    const { data: prescription } = await supabase.from("prescriptions").select("*, patients(*)").eq("id", id).single();
    if (prescription) {
      if (!repeatWithoutPatient) {
        setPatient({
          id: prescription.patients.id,
          full_name: prescription.patients.full_name,
          birth_date: prescription.patients.birth_date
        });
      } else {
        setPatient(null);
      }
      setPrescriptionDate(/* @__PURE__ */ new Date());
      const { data: prescItems } = await supabase.from("prescription_items").select("*").eq("prescription_id", id).order("sort_order");
      if (prescItems) {
        setItems(prescItems.map((item) => ({
          medication_latin_name: item.medication_latin_name,
          dosage_form: item.dosage_form || "",
          dose: item.dose || "",
          quantity: item.quantity,
          frequency: item.frequency || "",
          duration: item.duration || ""
        })));
      }
    }
  };
  const addItem = (med) => {
    setItems([...items, {
      medication_latin_name: med.latin_name,
      dosage_form: med.dosage_form,
      dose: med.dose,
      quantity: 1,
      frequency: "",
      duration: ""
    }]);
  };
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };
  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };
  const handleSave = async () => {
    if (!patient) {
      toast.error("Выберите пациента");
      return;
    }
    if (items.length === 0) {
      toast.error("Добавьте хотя бы один препарат");
      return;
    }
    setSaving(true);
    try {
      const { data: prescription, error } = await supabase.from("prescriptions").insert({
        patient_id: patient.id,
        prescription_date: format(prescriptionDate, "yyyy-MM-dd"),
        prescription_type: "standard"
      }).select().single();
      if (error) throw error;
      const { error: itemsError } = await supabase.from("prescription_items").insert(items.map((item, idx) => ({
        prescription_id: prescription.id,
        medication_latin_name: item.medication_latin_name,
        dosage_form: item.dosage_form || null,
        dose: item.dose || null,
        quantity: item.quantity,
        frequency: item.frequency || null,
        duration: item.duration || null,
        sort_order: idx
      })));
      if (itemsError) throw itemsError;
      setSavedPrescription({
        ...prescription,
        patient,
        items
      });
      toast.success("Рецепт сохранён");
    } catch (err) {
      toast.error("Ошибка сохранения: " + err.message);
    } finally {
      setSaving(false);
    }
  };
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Рецепт</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; padding: 0; display: flex; justify-content: flex-end; }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };
  const handleNewPrescription = () => {
    setSavedPrescription(null);
    setItems([]);
    setTimeout(() => loadNextPendingRx(), 0);
  };
  if (savedPrescription) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      pendingRxRemaining > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg bg-accent/50 border border-accent text-sm", children: [
        /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4 text-primary shrink-0" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "В очереди ещё ",
          /* @__PURE__ */ jsx("b", { children: pendingRxRemaining }),
          " бланк(ов) из ассистента — нажмите «Следующий бланк», чтобы продолжить."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxs(Button, { onClick: handlePrint, children: [
          /* @__PURE__ */ jsx(Printer, { className: "h-4 w-4 mr-2" }),
          " Печать рецепта"
        ] }),
        pendingRxRemaining > 0 ? /* @__PURE__ */ jsxs(Button, { onClick: handleNewPrescription, children: [
          /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4 mr-2" }),
          " Следующий бланк (",
          pendingRxRemaining,
          ")"
        ] }) : /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: handleNewPrescription, children: "Новый рецепт" }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: onSaved, children: "К истории" })
      ] }),
      /* @__PURE__ */ jsx("div", { ref: printRef, children: /* @__PURE__ */ jsx(PrescriptionPrint, { prescription: savedPrescription }) })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "space-y-6 max-w-3xl", children: /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Форма 107/у — Стандартный рецепт" }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
      repeatPrescriptionId && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 p-3 rounded-lg bg-accent/50 border border-accent", children: [
        /* @__PURE__ */ jsx(Info, { className: "h-5 w-5 text-primary mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: repeatWithoutPatient ? "Копия рецепта — выберите нового пациента" : "Повтор рецепта — пациент и препараты загружены" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Вы можете изменить пациента, добавить/удалить препараты и отредактировать дозировки перед сохранением." })
        ] })
      ] }),
      pendingRxRemaining > 0 && !repeatPrescriptionId && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20", children: [
        /* @__PURE__ */ jsx(FileText, { className: "h-5 w-5 text-primary mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: "Бланк из AI-ассистента — препарат уже подставлен" }),
          /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
            "После сохранения откроется следующий бланк. Осталось в очереди: ",
            /* @__PURE__ */ jsx("b", { children: pendingRxRemaining }),
            "."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Дата рецепта" }),
        /* @__PURE__ */ jsxs(Popover, { children: [
          /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: cn("w-[240px] justify-start text-left"), children: [
            /* @__PURE__ */ jsx(CalendarIcon, { className: "mr-2 h-4 w-4" }),
            format(prescriptionDate, "dd.MM.yyyy")
          ] }) }),
          /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: /* @__PURE__ */ jsx(
            Calendar,
            {
              mode: "single",
              selected: prescriptionDate,
              onSelect: (d) => d && setPrescriptionDate(d),
              className: "p-3 pointer-events-auto"
            }
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsx(PatientSelect, { selectedPatient: patient, onSelect: setPatient }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Врач" }),
        /* @__PURE__ */ jsx(Input, { value: "Профессор, д.м.н. Тарусин Дмитрий Игоревич", readOnly: true, className: "bg-secondary/30" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg", children: "Rp: Препараты" }),
        /* @__PURE__ */ jsx(MedicationSearch, { onSelect: addItem }),
        items.map((item, idx) => /* @__PURE__ */ jsxs(Card, { className: "p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-medium", children: item.medication_latin_name }),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: () => removeItem(idx), children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Форма выпуска" }),
              /* @__PURE__ */ jsx(Input, { value: item.dosage_form, onChange: (e) => updateItem(idx, "dosage_form", e.target.value), placeholder: "таблетки" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Доза" }),
              /* @__PURE__ */ jsx(Input, { value: item.dose, onChange: (e) => updateItem(idx, "dose", e.target.value), placeholder: "500 мг" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Количество (D.t.d. N)" }),
              /* @__PURE__ */ jsx(Input, { type: "number", min: 1, value: item.quantity, onChange: (e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Кратность приёма" }),
              /* @__PURE__ */ jsx(Input, { value: item.frequency, onChange: (e) => updateItem(idx, "frequency", e.target.value), placeholder: "по 1 табл. 3 р/день" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Длительность" }),
              /* @__PURE__ */ jsx(Input, { value: item.duration, onChange: (e) => updateItem(idx, "duration", e.target.value), placeholder: "7 дней" })
            ] })
          ] })
        ] }, idx))
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        patient && items.length > 0 && /* @__PURE__ */ jsx(
          PrescriptionPreview,
          {
            prescription: {
              prescription_date: format(prescriptionDate, "yyyy-MM-dd"),
              doctor_name: "Профессор, д.м.н. Тарусин Дмитрий Игоревич",
              prescription_type: "standard",
              patient,
              items
            },
            trigger: /* @__PURE__ */ jsxs(Button, { variant: "outline", type: "button", children: [
              /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4 mr-2" }),
              " Предпросмотр"
            ] })
          }
        ),
        /* @__PURE__ */ jsx(Button, { onClick: handleSave, disabled: saving || !patient || items.length === 0, className: "flex-1", children: saving ? "Сохранение..." : "Сохранить рецепт" })
      ] })
    ] })
  ] }) });
}
const FORM_TYPES = [
  { value: "unguentum", label: "Мазь (Unguentum)", misceLabel: "unguentum" },
  { value: "pasta", label: "Паста (Pasta)", misceLabel: "pastam" },
  { value: "cremor", label: "Крем (Cremor)", misceLabel: "cremorem" },
  { value: "gel", label: "Гель (Gel)", misceLabel: "gel" },
  { value: "linimentum", label: "Линимент (Linimentum)", misceLabel: "linimentum" },
  { value: "suspensio", label: "Болтушка (Suspensio)", misceLabel: "suspensionem" },
  { value: "suppositoria", label: "Свечи (Suppositoria)", misceLabel: "suppositoria" },
  { value: "mixtura", label: "Микстура (Mixtura)", misceLabel: "mixturam" },
  { value: "tinctura", label: "Настойка (Tinctura)", misceLabel: "tincturam" },
  { value: "solutio", label: "Раствор (Solutio)", misceLabel: "solutionem" }
];
const SIGNA_TEMPLATES = [
  "Наружно. Наносить тонким слоем на поражённые участки 2 раза в день",
  "Наружно. Наносить на кожу 1 раз в день на ночь",
  "Наружно. Смазывать поражённые участки 3 раза в день",
  "Наружно. Наносить под повязку 1 раз в день",
  "Ректально. По 1 свече 1 раз в день на ночь",
  "Ректально. По 1 свече 2 раза в день (утром и на ночь)",
  "Вагинально. По 1 свече на ночь",
  "Внутрь. По 1 столовой ложке 3 раза в день до еды",
  "Внутрь. По 1 десертной ложке 3 раза в день после еды",
  "Внутрь. По 1 чайной ложке 3 раза в день",
  "Внутрь. По 15 капель 3 раза в день, растворив в воде",
  "Внутрь. По 20 капель на ночь",
  "Для полоскания. Развести 1 чайную ложку в стакане воды",
  "Для промывания. Использовать по назначению врача"
];
function ExtemporaneousForm({ onSaved }) {
  var _a;
  const [patient, setPatient] = useState(null);
  const [prescriptionDate, setPrescriptionDate] = useState(/* @__PURE__ */ new Date());
  const [formType, setFormType] = useState("unguentum");
  const [ingredients, setIngredients] = useState([{ ingredient_name: "", amount: "", unit: "г" }]);
  const [signa, setSigna] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedPrescription, setSavedPrescription] = useState(null);
  const printRef = useRef(null);
  const [activeIngIdx, setActiveIngIdx] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef();
  const searchSubstances = useCallback(async (query, formTypeFilter) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearchLoading(true);
    try {
      const { data } = await supabase.from("extemporaneous_substances").select("id, latin_name, russian_name, default_unit, category, description").or(`latin_name.ilike.%${query}%,russian_name.ilike.%${query}%`).limit(15);
      setSuggestions(data || []);
    } catch {
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);
  const handleIngredientNameChange = (index, value) => {
    updateIngredient(index, "ingredient_name", value);
    setActiveIngIdx(index);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchSubstances(value, formType), 300);
  };
  const selectSuggestion = (index, sub) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = {
      ingredient_name: sub.latin_name,
      amount: newIngredients[index].amount,
      unit: sub.default_unit
    };
    setIngredients(newIngredients);
    setSuggestions([]);
    setActiveIngIdx(null);
  };
  const addIngredient = () => {
    setIngredients([...ingredients, { ingredient_name: "", amount: "", unit: "г" }]);
  };
  const updateIngredient = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };
  const removeIngredient = (index) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };
  const getMisceText = () => {
    const ft = FORM_TYPES.find((f) => f.value === formType);
    return `M.f. ${(ft == null ? void 0 : ft.misceLabel) || formType}`;
  };
  const handleSave = async () => {
    if (!patient) {
      toast.error("Выберите пациента");
      return;
    }
    const validIngredients = ingredients.filter((i) => i.ingredient_name.trim());
    if (validIngredients.length === 0) {
      toast.error("Добавьте хотя бы один ингредиент");
      return;
    }
    setSaving(true);
    try {
      const { data: prescription, error } = await supabase.from("prescriptions").insert({
        patient_id: patient.id,
        prescription_date: format(prescriptionDate, "yyyy-MM-dd"),
        prescription_type: "extemporaneous",
        extemporaneous_form_type: formType,
        signa: signa || null
      }).select().single();
      if (error) throw error;
      const { error: ingError } = await supabase.from("extemporaneous_ingredients").insert(validIngredients.map((ing, idx) => ({
        prescription_id: prescription.id,
        ingredient_name: ing.ingredient_name,
        amount: ing.amount,
        unit: ing.unit,
        sort_order: idx
      })));
      if (ingError) throw ingError;
      setSavedPrescription({
        ...prescription,
        patient,
        ingredients: validIngredients,
        signa,
        extemporaneous_form_type: formType
      });
      toast.success("Экстемпоральный рецепт сохранён");
    } catch (err) {
      toast.error("Ошибка: " + err.message);
    } finally {
      setSaving(false);
    }
  };
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Рецепт</title>
      <style>@page{size:A4 portrait;margin:0}body{margin:0;padding:0;display:flex;justify-content:flex-end}*{box-sizing:border-box}</style>
      </head><body>${printContent.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };
  const buildPrescriptionData = () => ({
    prescription_date: format(prescriptionDate, "yyyy-MM-dd"),
    doctor_name: "Профессор, д.м.н. Тарусин Дмитрий Игоревич",
    prescription_type: "extemporaneous",
    patient,
    ingredients,
    signa,
    extemporaneous_form_type: formType
  });
  if (savedPrescription) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { onClick: handlePrint, children: [
          /* @__PURE__ */ jsx(Printer, { className: "h-4 w-4 mr-2" }),
          " Печать рецепта"
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => {
          setSavedPrescription(null);
          setIngredients([{ ingredient_name: "", amount: "", unit: "г" }]);
          setSigna("");
        }, children: "Новый рецепт" }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: onSaved, children: "К истории" })
      ] }),
      /* @__PURE__ */ jsx("div", { ref: printRef, children: /* @__PURE__ */ jsx(PrescriptionPrint, { prescription: savedPrescription }) })
    ] });
  }
  const categoryLabels = {
    base: "Основа",
    antiseptic: "Антисептик",
    antiinflammatory: "Противовоспалит.",
    drying: "Подсушивающее",
    antibiotic: "Антибиотик",
    antifungal: "Противогрибковое",
    anesthetic: "Анестетик",
    keratolytic: "Кератолитик",
    astringent: "Вяжущее",
    vitamin: "Витамин",
    herbal: "Растительное",
    regenerative: "Регенерирующее",
    antispasmodic: "Спазмолитик",
    hemostatic: "Гемостатик",
    emulsifier: "Эмульгатор",
    preservative: "Консервант",
    mineral: "Минеральное",
    analgesic: "Анальгетик",
    sedative: "Седативное",
    expectorant: "Отхаркивающее",
    antihistamine: "Антигистамин",
    hormone: "Гормон",
    active: "Активное",
    dye: "Краситель",
    corrective: "Корригент",
    emollient: "Смягчающее",
    vasoconstrictor: "Сосудосуж.",
    other: "Прочее"
  };
  return /* @__PURE__ */ jsx("div", { className: "space-y-6 max-w-3xl", children: /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Экстемпоральная пропись" }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Дата рецепта" }),
        /* @__PURE__ */ jsxs(Popover, { children: [
          /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: cn("w-[240px] justify-start text-left"), children: [
            /* @__PURE__ */ jsx(CalendarIcon, { className: "mr-2 h-4 w-4" }),
            format(prescriptionDate, "dd.MM.yyyy")
          ] }) }),
          /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: /* @__PURE__ */ jsx(Calendar, { mode: "single", selected: prescriptionDate, onSelect: (d) => d && setPrescriptionDate(d), className: "p-3 pointer-events-auto" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx(PatientSelect, { selectedPatient: patient, onSelect: setPatient }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Врач" }),
        /* @__PURE__ */ jsx(Input, { value: "Профессор, д.м.н. Тарусин Дмитрий Игоревич", readOnly: true, className: "bg-secondary/30" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Лекарственная форма" }),
        /* @__PURE__ */ jsxs(Select, { value: formType, onValueChange: setFormType, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: FORM_TYPES.map((ft) => /* @__PURE__ */ jsx(SelectItem, { value: ft.value, children: ft.label }, ft.value)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg", children: "Rp: Ингредиенты" }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: addIngredient, children: [
            /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
            " Добавить"
          ] })
        ] }),
        ingredients.map((ing, idx) => /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-end", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Наименование (лат. или рус.)" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Search, { className: "absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: ing.ingredient_name,
                    onChange: (e) => handleIngredientNameChange(idx, e.target.value),
                    onFocus: () => setActiveIngIdx(idx),
                    onBlur: () => setTimeout(() => setActiveIngIdx(null), 200),
                    placeholder: "Начните вводить название...",
                    className: "pl-8"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "w-24 space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Кол-во" }),
              /* @__PURE__ */ jsx(Input, { value: ing.amount, onChange: (e) => updateIngredient(idx, "amount", e.target.value), placeholder: "10,0" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "w-20 space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Ед." }),
              /* @__PURE__ */ jsx(Input, { value: ing.unit, onChange: (e) => updateIngredient(idx, "unit", e.target.value), placeholder: "г" })
            ] }),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: () => removeIngredient(idx), disabled: ingredients.length <= 1, children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })
          ] }),
          activeIngIdx === idx && suggestions.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute z-50 left-0 right-24 top-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto", children: suggestions.map((sub) => /* @__PURE__ */ jsxs(
            "button",
            {
              className: "w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm flex items-center justify-between gap-2",
              onMouseDown: (e) => {
                e.preventDefault();
                selectSuggestion(idx, sub);
              },
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "font-medium truncate", children: sub.latin_name }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate", children: sub.russian_name })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-xs px-1.5 py-0.5 bg-muted rounded shrink-0", children: categoryLabels[sub.category] || sub.category })
              ]
            },
            sub.id
          )) })
        ] }, idx)),
        /* @__PURE__ */ jsxs("div", { className: "border-t pt-3 mt-3", children: [
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-sm italic text-muted-foreground", children: getMisceText() }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "Misce ut fiat — Смешай, чтобы получилось (",
            (_a = FORM_TYPES.find((f) => f.value === formType)) == null ? void 0 : _a.label.split(" (")[0].toLowerCase(),
            ")"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { className: "font-semibold", children: "D.S. (Signa — способ применения)" }),
        /* @__PURE__ */ jsxs(Select, { onValueChange: (v) => setSigna(v), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Выберите шаблон или введите вручную" }) }),
          /* @__PURE__ */ jsx(SelectContent, { children: SIGNA_TEMPLATES.map((tpl, i) => /* @__PURE__ */ jsx(SelectItem, { value: tpl, children: tpl }, i)) })
        ] }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: signa,
            onChange: (e) => setSigna(e.target.value),
            placeholder: "Или введите способ применения вручную"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        patient && ingredients.some((i) => i.ingredient_name) && /* @__PURE__ */ jsx(
          PrescriptionPreview,
          {
            prescription: buildPrescriptionData(),
            trigger: /* @__PURE__ */ jsxs(Button, { variant: "outline", type: "button", children: [
              /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4 mr-2" }),
              " Предпросмотр"
            ] })
          }
        ),
        /* @__PURE__ */ jsx(Button, { onClick: handleSave, disabled: saving || !patient, className: "flex-1", children: saving ? "Сохранение..." : "Сохранить рецепт" })
      ] })
    ] })
  ] }) });
}
function PrescriptionHistory({ onRepeat, onRepeatForOther }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [printPrescription, setPrintPrescription] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const printRef = useRef(null);
  const fetchPrescriptions = async () => {
    setLoading(true);
    let query = supabase.from("prescriptions").select("*, patients(*)").order("created_at", { ascending: false });
    const { data } = await query;
    if (data) {
      const enriched = await Promise.all(
        data.map(async (p) => {
          if (p.prescription_type === "standard") {
            const { data: items } = await supabase.from("prescription_items").select("*").eq("prescription_id", p.id).order("sort_order");
            return { ...p, patient: p.patients, items: items || [] };
          } else {
            const { data: ingredients } = await supabase.from("extemporaneous_ingredients").select("*").eq("prescription_id", p.id).order("sort_order");
            return { ...p, patient: p.patients, ingredients: ingredients || [] };
          }
        })
      );
      if (search.trim()) {
        const s2 = search.toLowerCase();
        setPrescriptions(
          enriched.filter(
            (p) => {
              var _a, _b, _c, _d;
              return ((_b = (_a = p.patient) == null ? void 0 : _a.full_name) == null ? void 0 : _b.toLowerCase().includes(s2)) || ((_c = p.items) == null ? void 0 : _c.some((i) => {
                var _a2;
                return (_a2 = i.medication_latin_name) == null ? void 0 : _a2.toLowerCase().includes(s2);
              })) || ((_d = p.ingredients) == null ? void 0 : _d.some((i) => {
                var _a2;
                return (_a2 = i.ingredient_name) == null ? void 0 : _a2.toLowerCase().includes(s2);
              }));
            }
          )
        );
      } else {
        setPrescriptions(enriched);
      }
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchPrescriptions();
  }, [search]);
  const handlePrint = (prescription) => {
    setPrintPrescription(prescription);
    setTimeout(() => {
      const printContent = printRef.current;
      if (!printContent) return;
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <html><head><title>Рецепт</title>
        <style>@page{size:A4 portrait;margin:0}body{margin:0;padding:0;display:flex;justify-content:flex-end}*{box-sizing:border-box}</style>
        </head><body>${printContent.innerHTML}</body></html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }, 100);
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from("prescription_items").delete().eq("prescription_id", deleteId);
    await supabase.from("extemporaneous_ingredients").delete().eq("prescription_id", deleteId);
    const { error } = await supabase.from("prescriptions").delete().eq("id", deleteId);
    if (error) {
      toast.error("Ошибка при удалении рецепта");
    } else {
      toast.success("Рецепт удалён");
      fetchPrescriptions();
    }
    setDeleteId(null);
    setDeleting(false);
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative max-w-md", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          value: search,
          onChange: (e) => setSearch(e.target.value),
          placeholder: "Поиск по ФИО, препарату...",
          className: "pl-9"
        }
      )
    ] }),
    prescriptions.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-12 text-muted-foreground", children: "Рецепты не найдены" }) : prescriptions.map((p) => {
      var _a, _b;
      return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: (_a = p.patient) == null ? void 0 : _a.full_name }),
            /* @__PURE__ */ jsx("span", { className: "text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground", children: p.prescription_type === "standard" ? "Стандартный" : "Экстемпоральный" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mb-2", children: [
            "Дата: ",
            format(new Date(p.prescription_date), "dd.MM.yyyy"),
            " · Д.р.: ",
            ((_b = p.patient) == null ? void 0 : _b.birth_date) ? format(new Date(p.patient.birth_date), "dd.MM.yyyy") : "—"
          ] }),
          p.items && p.items.length > 0 && /* @__PURE__ */ jsx("div", { className: "text-sm", children: p.items.map((item, idx) => /* @__PURE__ */ jsxs("div", { children: [
            "Rp: ",
            item.medication_latin_name,
            " ",
            item.dosage_form && `(${item.dosage_form})`,
            " ",
            item.dose,
            " — N",
            item.quantity,
            item.frequency && `, ${item.frequency}`,
            item.duration && `, ${item.duration}`
          ] }, idx)) }),
          p.ingredients && p.ingredients.length > 0 && /* @__PURE__ */ jsx("div", { className: "text-sm", children: p.ingredients.map((ing, idx) => /* @__PURE__ */ jsxs("div", { children: [
            ing.ingredient_name,
            " ",
            ing.amount,
            " ",
            ing.unit
          ] }, idx)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-1 shrink-0", children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => handlePrint(p), title: "Печать", children: /* @__PURE__ */ jsx(Printer, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => onRepeat(p.id), title: "Повторить тому же пациенту", children: /* @__PURE__ */ jsx(Copy, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => onRepeatForOther(p.id), title: "Копировать для другого пациента", children: /* @__PURE__ */ jsx(UserPlus, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => setDeleteId(p.id), title: "Удалить рецепт", className: "text-destructive hover:text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }) }) }, p.id);
    }),
    /* @__PURE__ */ jsx("div", { className: "hidden", children: /* @__PURE__ */ jsx("div", { ref: printRef, children: printPrescription && /* @__PURE__ */ jsx(PrescriptionPrint, { prescription: printPrescription }) }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteId, onOpenChange: (open) => !open && setDeleteId(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Удалить рецепт?" }),
        /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Это действие необратимо. Рецепт и все связанные данные будут удалены из базы." })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { disabled: deleting, children: "Отмена" }),
        /* @__PURE__ */ jsx(AlertDialogAction, { onClick: handleDelete, disabled: deleting, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: deleting ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : "Удалить" })
      ] })
    ] }) })
  ] });
}
function DrugReference() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [digest, setDigest] = useState(null);
  const [history, setHistory] = useState([]);
  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setDigest(null);
    try {
      const { data, error } = await supabase.functions.invoke("drug-reference", {
        body: { medication_name: search.trim() }
      });
      if (error) throw error;
      if (data == null ? void 0 : data.error) throw new Error(data.error);
      setDigest(data);
      setHistory((prev) => {
        const name = search.trim();
        return [name, ...prev.filter((h) => h !== name)].slice(0, 10);
      });
    } catch (err) {
      toast.error(err.message || "Ошибка получения справки");
    } finally {
      setLoading(false);
    }
  };
  const handleHistoryClick = (name) => {
    setSearch(name);
    setLoading(true);
    setDigest(null);
    supabase.functions.invoke("drug-reference", { body: { medication_name: name } }).then(({ data, error }) => {
      if (error || (data == null ? void 0 : data.error)) {
        toast.error("Ошибка получения справки");
        return;
      }
      setDigest(data);
    }).finally(() => setLoading(false));
  };
  return /* @__PURE__ */ jsxs(Sheet, { children: [
    /* @__PURE__ */ jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", children: [
      /* @__PURE__ */ jsx(BookOpen, { className: "h-4 w-4" }),
      "Справочник"
    ] }) }),
    /* @__PURE__ */ jsxs(SheetContent, { className: "w-[420px] sm:w-[480px] overflow-y-auto", children: [
      /* @__PURE__ */ jsx(SheetHeader, { children: /* @__PURE__ */ jsxs(SheetTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(BookOpen, { className: "h-5 w-5 text-primary" }),
        "Справочник препаратов"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: search,
                onChange: (e) => setSearch(e.target.value),
                onKeyDown: (e) => e.key === "Enter" && handleSearch(),
                placeholder: "Название препарата...",
                className: "pl-9"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(Button, { onClick: handleSearch, disabled: loading || !search.trim(), children: loading ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : "Найти" })
        ] }),
        history.length > 0 && !digest && !loading && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Недавние запросы:" }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: history.map((h) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleHistoryClick(h),
              className: "text-xs px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition-colors",
              children: h
            },
            h
          )) })
        ] }),
        loading && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 py-12 text-muted-foreground", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Загрузка справки..." })
        ] }),
        digest && !loading && /* @__PURE__ */ jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold capitalize text-foreground", children: digest.medication_name }),
          digest.synonyms && /* @__PURE__ */ jsx(
            DigestSection,
            {
              icon: /* @__PURE__ */ jsx(Tag, { className: "h-4 w-4" }),
              title: "Синонимы / Торговые названия",
              content: digest.synonyms
            }
          ),
          digest.pharmacological_group && /* @__PURE__ */ jsx(
            DigestSection,
            {
              icon: /* @__PURE__ */ jsx(Pill, { className: "h-4 w-4" }),
              title: "Фармакологическая группа",
              content: digest.pharmacological_group
            }
          ),
          digest.indications && /* @__PURE__ */ jsx(
            DigestSection,
            {
              icon: /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
              title: "Показания",
              content: digest.indications
            }
          ),
          digest.contraindications && /* @__PURE__ */ jsx(
            DigestSection,
            {
              icon: /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
              title: "Противопоказания",
              content: digest.contraindications,
              variant: "warning"
            }
          ),
          digest.dosage_info && /* @__PURE__ */ jsx(
            DigestSection,
            {
              icon: /* @__PURE__ */ jsx(Syringe, { className: "h-4 w-4" }),
              title: "Дозировка",
              content: digest.dosage_info
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground/60 mt-4", children: "Информация сгенерирована AI и кэширована. Не заменяет инструкцию к препарату." })
        ] }),
        !digest && !loading && history.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-12 text-muted-foreground", children: [
          /* @__PURE__ */ jsx(BookOpen, { className: "h-12 w-12 mx-auto mb-3 opacity-30" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Введите название препарата для получения краткой справки" })
        ] })
      ] })
    ] })
  ] });
}
function DigestSection({
  icon,
  title,
  content,
  variant = "default"
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `rounded-lg border p-3 space-y-1.5 ${variant === "warning" ? "border-destructive/30 bg-destructive/5" : "border-border bg-secondary/20"}`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold text-foreground", children: [
          icon,
          title
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: content })
      ]
    }
  );
}
const DecimalInput = React.memo(
  React.forwardRef(
    ({ className, value, onValueChange, decimals = 2, ...props }, ref) => {
      const [localVal, setLocalVal] = React.useState(() => String(value ?? "").replace(".", ","));
      const parentVal = String(value ?? "");
      const prevParentRef = React.useRef(parentVal);
      React.useEffect(() => {
        if (prevParentRef.current !== parentVal) {
          prevParentRef.current = parentVal;
          const normalizedLocal = localVal.replace(",", ".");
          if (normalizedLocal !== parentVal) {
            setLocalVal(parentVal.replace(".", ","));
          }
        }
      }, [parentVal]);
      const handleChange = (e) => {
        let raw = e.target.value;
        if (raw === "") {
          setLocalVal("");
          onValueChange("");
          return;
        }
        raw = raw.replace(".", ",");
        const regex = new RegExp(`^\\d*,?\\d{0,${decimals}}$`);
        if (!regex.test(raw)) return;
        setLocalVal(raw);
        onValueChange(raw.replace(",", "."));
      };
      return /* @__PURE__ */ jsx(
        "input",
        {
          ref,
          type: "text",
          inputMode: "decimal",
          className: cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          ),
          value: localVal,
          onChange: handleChange,
          ...props
        }
      );
    }
  )
);
DecimalInput.displayName = "DecimalInput";
function DosageCalculator() {
  const [medicationName, setMedicationName] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const bsa = weightKg && heightCm ? Math.round(Math.sqrt(parseFloat(heightCm) * parseFloat(weightKg) / 3600) * 100) / 100 : null;
  const canCalculate = medicationName.trim() && (weightKg || ageYears);
  const handleCalculate = async () => {
    if (!canCalculate) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("dosage-calculator", {
        body: {
          medication_name: medicationName.trim(),
          age_years: ageYears ? parseInt(ageYears) : void 0,
          age_months: ageMonths ? parseInt(ageMonths) : void 0,
          weight_kg: weightKg ? parseFloat(weightKg) : void 0,
          height_cm: heightCm ? parseFloat(heightCm) : void 0
        }
      });
      if (error) throw error;
      if (data == null ? void 0 : data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      toast.error(err.message || "Ошибка расчёта дозы");
    } finally {
      setLoading(false);
    }
  };
  const handleMedSelect = (med) => {
    setMedicationName(med.latin_name);
  };
  return /* @__PURE__ */ jsxs("div", { className: "max-w-4xl space-y-6", children: [
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Calculator, { className: "h-5 w-5 text-primary" }),
          "Калькулятор педиатрической дозы"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Расчёт дозировки препарата по возрасту, массе тела и площади поверхности тела (BSA)" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(MedicationSearch, { onSelect: handleMedSelect }),
          medicationName && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm bg-primary/10 text-primary rounded-md px-3 py-2", children: [
            /* @__PURE__ */ jsx(Pill, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: medicationName }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setMedicationName(""),
                className: "ml-auto text-xs hover:underline",
                children: "Изменить"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxs(Label, { className: "flex items-center gap-1.5 text-xs", children: [
              /* @__PURE__ */ jsx(Baby, { className: "h-3.5 w-3.5" }),
              " Возраст (лет)"
            ] }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                min: 0,
                max: 18,
                value: ageYears,
                onChange: (e) => setAgeYears(e.target.value),
                placeholder: "0–18"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxs(Label, { className: "flex items-center gap-1.5 text-xs", children: [
              /* @__PURE__ */ jsx(Baby, { className: "h-3.5 w-3.5" }),
              " Месяцев"
            ] }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                min: 0,
                max: 11,
                value: ageMonths,
                onChange: (e) => setAgeMonths(e.target.value),
                placeholder: "0–11"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxs(Label, { className: "flex items-center gap-1.5 text-xs", children: [
              /* @__PURE__ */ jsx(Weight, { className: "h-3.5 w-3.5" }),
              " Вес (кг)"
            ] }),
            /* @__PURE__ */ jsx(
              DecimalInput,
              {
                value: weightKg,
                onValueChange: setWeightKg,
                placeholder: "кг"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxs(Label, { className: "flex items-center gap-1.5 text-xs", children: [
              /* @__PURE__ */ jsx(Ruler, { className: "h-3.5 w-3.5" }),
              " Рост (см)"
            ] }),
            /* @__PURE__ */ jsx(
              DecimalInput,
              {
                value: heightCm,
                onValueChange: setHeightCm,
                placeholder: "см"
              }
            )
          ] })
        ] }),
        bsa && /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground bg-secondary/30 rounded-md px-3 py-2", children: [
          "ППТ (BSA, Mosteller): ",
          /* @__PURE__ */ jsxs("span", { className: "font-semibold text-foreground", children: [
            bsa,
            " м²"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { onClick: handleCalculate, disabled: loading || !canCalculate, className: "w-full", children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
          " Расчёт..."
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Calculator, { className: "h-4 w-4 mr-2" }),
          " Рассчитать дозу"
        ] }) })
      ] })
    ] }),
    result && /* @__PURE__ */ jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300", children: [
      result.is_contraindicated && /* @__PURE__ */ jsx(Card, { className: "border-destructive bg-destructive/5", children: /* @__PURE__ */ jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsx(ShieldAlert, { className: "h-6 w-6 text-destructive flex-shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-destructive text-lg", children: "⚠️ Противопоказан детям (off-label)" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive/80 mt-1", children: result.contraindication_warning }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive/60 mt-2 italic", children: "Расчёт дозы выполнен для off-label назначения. Требуется информированное согласие." })
        ] })
      ] }) }) }),
      result.min_age_allowed && !result.is_contraindicated && /* @__PURE__ */ jsx(Card, { className: "border-yellow-500/30 bg-yellow-500/5", children: /* @__PURE__ */ jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-yellow-700", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-5 w-5" }),
        /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium", children: [
          "Минимальный возраст: ",
          result.min_age_allowed
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: `h-5 w-5 ${result.is_contraindicated ? "text-yellow-600" : "text-green-600"}` }),
          "Результат расчёта",
          result.is_contraindicated && /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-destructive bg-destructive/10 px-2 py-0.5 rounded-full", children: "off-label" })
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          result.formula_used && /* @__PURE__ */ jsx(ResultRow, { icon: /* @__PURE__ */ jsx(Calculator, { className: "h-4 w-4" }), label: "Формула", value: result.formula_used, highlight: true }),
          result.single_dose && /* @__PURE__ */ jsx(ResultRow, { icon: /* @__PURE__ */ jsx(Pill, { className: "h-4 w-4" }), label: "Разовая доза", value: result.single_dose }),
          result.daily_dose && /* @__PURE__ */ jsx(ResultRow, { icon: /* @__PURE__ */ jsx(Pill, { className: "h-4 w-4" }), label: "Суточная доза", value: result.daily_dose }),
          result.max_daily_dose && /* @__PURE__ */ jsx(ResultRow, { icon: /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }), label: "Макс. суточная", value: result.max_daily_dose }),
          result.frequency && /* @__PURE__ */ jsx(ResultRow, { icon: /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4" }), label: "Кратность", value: result.frequency }),
          result.route && /* @__PURE__ */ jsx(ResultRow, { icon: /* @__PURE__ */ jsx(Syringe, { className: "h-4 w-4" }), label: "Путь введения", value: result.route }),
          result.duration && /* @__PURE__ */ jsx(ResultRow, { icon: /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4" }), label: "Длительность", value: result.duration }),
          result.calculation_method && /* @__PURE__ */ jsx(ResultRow, { icon: /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }), label: "Метод расчёта", value: result.calculation_method })
        ] }) })
      ] }),
      result.practical_dosing && result.practical_dosing.length > 0 && /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [
            /* @__PURE__ */ jsx(Syringe, { className: "h-5 w-5 text-primary" }),
            "Практическое дозирование"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Как доставить рассчитанную разовую дозу в конкретной лекарственной форме" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: result.practical_dosing.map((pd, idx) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "border rounded-lg p-3 space-y-1.5 bg-secondary/20",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-foreground", children: pd.form }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full", children: pd.single_dose_practical })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground font-mono", children: pd.calculation_detail })
            ]
          },
          idx
        )) }) })
      ] }),
      result.notes && /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-secondary/30 border text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: "Примечания: " }),
        result.notes
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground/60 text-center", children: "Расчёт выполнен AI на основе данных фармакопеи. Не заменяет клинического решения врача." })
    ] })
  ] });
}
function ResultRow({
  icon,
  label,
  value,
  highlight = false
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `flex items-start gap-3 py-2 px-3 rounded-md ${highlight ? "bg-primary/5 border border-primary/20" : ""}`,
      children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground mt-0.5", children: icon }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: label }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground", children: value })
        ] })
      ]
    }
  );
}
const CATEGORY_LABELS = {
  antiseptic: "Антисептики",
  antibiotic: "Антибиотики",
  antifungal: "Противогрибковые",
  corticosteroid: "Кортикостероиды",
  keratolytic: "Кератолитики",
  emollient: "Эмоленты / Смягчающие",
  base: "Основы",
  astringent: "Вяжущие",
  antihistamine: "Антигистаминные",
  anesthetic: "Анестетики",
  vitamin: "Витамины",
  wound_healing: "Ранозаживляющие",
  anti_inflammatory: "Противовоспалительные",
  hormonal: "Гормональные",
  other: "Прочие"
};
const FORM_LABELS = {
  unguentum: "Мазь",
  pasta: "Паста",
  cremor: "Крем",
  gel: "Гель",
  linimentum: "Линимент",
  suspensio: "Болтушка",
  suppositoria: "Свечи",
  mixtura: "Микстура",
  tinctura: "Настойка",
  solutio: "Раствор"
};
function SubstanceReference() {
  const [substances, setSubstances] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    loadSubstances();
  }, []);
  const loadSubstances = async () => {
    setLoading(true);
    const { data } = await supabase.from("extemporaneous_substances").select("*").order("category").order("latin_name");
    setSubstances(data || []);
    setLoading(false);
  };
  const filtered = substances.filter((s2) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s2.latin_name.toLowerCase().includes(q) || s2.russian_name.toLowerCase().includes(q) || (s2.description || "").toLowerCase().includes(q);
  });
  const grouped = filtered.reduce((acc, s2) => {
    const key = s2.category || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s2);
    return acc;
  }, {});
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => (CATEGORY_LABELS[a] || a).localeCompare(CATEGORY_LABELS[b] || b, "ru")
  );
  return /* @__PURE__ */ jsxs(Sheet, { children: [
    /* @__PURE__ */ jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", children: [
      /* @__PURE__ */ jsx(BookOpen, { className: "h-4 w-4 mr-2" }),
      " Справочник субстанций"
    ] }) }),
    /* @__PURE__ */ jsxs(SheetContent, { className: "w-[420px] sm:w-[500px] overflow-y-auto", children: [
      /* @__PURE__ */ jsx(SheetHeader, { children: /* @__PURE__ */ jsx(SheetTitle, { children: "Справочник субстанций" }) }),
      /* @__PURE__ */ jsxs("div", { className: "relative mt-4 mb-4", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: search,
            onChange: (e) => setSearch(e.target.value),
            placeholder: "Поиск по названию...",
            className: "pl-9"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground mb-3", children: [
        "Всего: ",
        filtered.length,
        " субстанций в ",
        sortedCategories.length,
        " группах"
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-muted-foreground", children: "Загрузка..." }) : /* @__PURE__ */ jsx(Accordion, { type: "multiple", defaultValue: sortedCategories, children: sortedCategories.map((cat) => /* @__PURE__ */ jsxs(AccordionItem, { value: cat, children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-sm", children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
          CATEGORY_LABELS[cat] || cat,
          /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: grouped[cat].length })
        ] }) }),
        /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: grouped[cat].map((s2) => {
          var _a;
          return /* @__PURE__ */ jsxs(
            "div",
            {
              className: "border rounded-md p-3 bg-muted/30",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "font-medium text-sm", children: [
                  s2.latin_name,
                  s2.is_base && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "ml-2 text-xs", children: "Основа" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
                  s2.russian_name,
                  " · ",
                  s2.default_unit
                ] }),
                s2.description && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: s2.description }),
                ((_a = s2.compatible_forms) == null ? void 0 : _a.length) > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: s2.compatible_forms.map((f) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: FORM_LABELS[f] || f }, f)) })
              ]
            },
            s2.id
          );
        }) }) })
      ] }, cat)) })
    ] })
  ] });
}
const WHO_WEIGHT_BOYS = [
  { age_months: 0, L: 0.3487, M: 3.3464, S: 0.14602 },
  { age_months: 1, L: 0.2297, M: 4.4709, S: 0.13395 },
  { age_months: 2, L: 0.197, M: 5.5675, S: 0.12385 },
  { age_months: 3, L: 0.1738, M: 6.3762, S: 0.11727 },
  { age_months: 4, L: 0.1553, M: 7.0023, S: 0.11316 },
  { age_months: 5, L: 0.1395, M: 7.5105, S: 0.1108 },
  { age_months: 6, L: 0.1257, M: 7.934, S: 0.10958 },
  { age_months: 9, L: 0.0956, M: 8.9014, S: 0.10882 },
  { age_months: 12, L: 0.0693, M: 9.6479, S: 0.11041 },
  { age_months: 18, L: 0.0334, M: 10.8941, S: 0.11278 },
  { age_months: 24, L: 0.0105, M: 12.1515, S: 0.1148 },
  { age_months: 36, L: -0.0474, M: 14.3339, S: 0.11658 },
  { age_months: 48, L: -0.0975, M: 16.3489, S: 0.1193 },
  { age_months: 60, L: -0.1386, M: 18.3671, S: 0.1237 },
  { age_months: 72, L: -0.167, M: 20.5053, S: 0.12791 },
  { age_months: 84, L: -0.195, M: 22.8979, S: 0.13255 },
  { age_months: 96, L: -0.218, M: 25.5576, S: 0.13768 },
  { age_months: 108, L: -0.237, M: 28.5965, S: 0.14371 },
  { age_months: 120, L: -0.252, M: 32.1623, S: 0.15037 }
];
const WHO_WEIGHT_GIRLS = [
  { age_months: 0, L: 0.3809, M: 3.2322, S: 0.14171 },
  { age_months: 1, L: 0.1714, M: 4.1873, S: 0.13724 },
  { age_months: 2, L: 0.0962, M: 5.1282, S: 0.12856 },
  { age_months: 3, L: 0.0402, M: 5.8458, S: 0.12267 },
  { age_months: 4, L: -5e-3, M: 6.4237, S: 0.11867 },
  { age_months: 5, L: -0.043, M: 6.8985, S: 0.11598 },
  { age_months: 6, L: -0.0756, M: 7.297, S: 0.11423 },
  { age_months: 9, L: -0.1413, M: 8.1872, S: 0.1132 },
  { age_months: 12, L: -0.1859, M: 8.9481, S: 0.11448 },
  { age_months: 18, L: -0.2361, M: 10.1547, S: 0.11664 },
  { age_months: 24, L: -0.2632, M: 11.5167, S: 0.11834 },
  { age_months: 36, L: -0.2895, M: 13.9244, S: 0.12114 },
  { age_months: 48, L: -0.3089, M: 16.0669, S: 0.12646 },
  { age_months: 60, L: -0.3195, M: 18.2579, S: 0.13339 },
  { age_months: 72, L: -0.327, M: 20.6651, S: 0.13874 },
  { age_months: 84, L: -0.332, M: 23.3932, S: 0.14499 },
  { age_months: 96, L: -0.334, M: 26.5908, S: 0.15195 },
  { age_months: 108, L: -0.333, M: 30.3561, S: 0.15891 },
  { age_months: 120, L: -0.329, M: 34.7196, S: 0.16537 }
];
const WHO_HEIGHT_BOYS = [
  { age_months: 0, L: 1, M: 49.8842, S: 0.03795 },
  { age_months: 1, L: 1, M: 54.7244, S: 0.03557 },
  { age_months: 2, L: 1, M: 58.4249, S: 0.03424 },
  { age_months: 3, L: 1, M: 61.4292, S: 0.03328 },
  { age_months: 4, L: 1, M: 63.886, S: 0.03257 },
  { age_months: 5, L: 1, M: 65.9026, S: 0.03204 },
  { age_months: 6, L: 1, M: 67.6236, S: 0.03165 },
  { age_months: 9, L: 1, M: 71.7688, S: 0.03092 },
  { age_months: 12, L: 1, M: 75.7488, S: 0.03034 },
  { age_months: 18, L: 1, M: 82.2188, S: 0.02955 },
  { age_months: 24, L: 1, M: 87.8161, S: 0.02899 },
  { age_months: 36, L: 1, M: 96.1245, S: 0.02841 },
  { age_months: 48, L: 1, M: 103.3, S: 0.02806 },
  { age_months: 60, L: 1, M: 110.007, S: 0.02787 },
  { age_months: 72, L: 1, M: 116.055, S: 0.02783 },
  { age_months: 84, L: 1, M: 121.734, S: 0.02808 },
  { age_months: 96, L: 1, M: 127.235, S: 0.02859 },
  { age_months: 108, L: 1, M: 132.562, S: 0.02936 },
  { age_months: 120, L: 1, M: 137.8, S: 0.03037 },
  { age_months: 132, L: 1, M: 143.063, S: 0.03165 },
  { age_months: 144, L: 1, M: 149.135, S: 0.03302 },
  { age_months: 156, L: 1, M: 155.483, S: 0.03394 },
  { age_months: 168, L: 1, M: 161.219, S: 0.03391 },
  { age_months: 180, L: 1, M: 165.518, S: 0.03274 },
  { age_months: 192, L: 1, M: 168.379, S: 0.03104 },
  { age_months: 204, L: 1, M: 170.152, S: 0.02965 },
  { age_months: 216, L: 1, M: 171.263, S: 0.02881 },
  { age_months: 228, L: 1, M: 171.862, S: 0.02848 }
];
const WHO_HEIGHT_GIRLS = [
  { age_months: 0, L: 1, M: 49.1477, S: 0.0379 },
  { age_months: 1, L: 1, M: 53.6872, S: 0.03614 },
  { age_months: 2, L: 1, M: 57.0673, S: 0.03488 },
  { age_months: 3, L: 1, M: 59.8029, S: 0.03411 },
  { age_months: 4, L: 1, M: 62.0899, S: 0.03362 },
  { age_months: 5, L: 1, M: 64.0301, S: 0.03329 },
  { age_months: 6, L: 1, M: 65.7311, S: 0.03306 },
  { age_months: 9, L: 1, M: 70.0572, S: 0.03271 },
  { age_months: 12, L: 1, M: 74.0015, S: 0.03254 },
  { age_months: 18, L: 1, M: 80.7153, S: 0.03248 },
  { age_months: 24, L: 1, M: 86.4153, S: 0.03261 },
  { age_months: 36, L: 1, M: 95.0515, S: 0.03284 },
  { age_months: 48, L: 1, M: 102.7, S: 0.03312 },
  { age_months: 60, L: 1, M: 109.424, S: 0.03367 },
  { age_months: 72, L: 1, M: 115.443, S: 0.03439 },
  { age_months: 84, L: 1, M: 121.163, S: 0.03527 },
  { age_months: 96, L: 1, M: 126.656, S: 0.03627 },
  { age_months: 108, L: 1, M: 132.214, S: 0.03749 },
  { age_months: 120, L: 1, M: 138.225, S: 0.03882 },
  { age_months: 132, L: 1, M: 144.715, S: 0.03981 },
  { age_months: 144, L: 1, M: 150.648, S: 0.0398 },
  { age_months: 156, L: 1, M: 155.073, S: 0.03873 },
  { age_months: 168, L: 1, M: 157.828, S: 0.03714 },
  { age_months: 180, L: 1, M: 159.484, S: 0.03579 },
  { age_months: 192, L: 1, M: 160.425, S: 0.03505 },
  { age_months: 204, L: 1, M: 160.969, S: 0.03471 },
  { age_months: 216, L: 1, M: 161.265, S: 0.03457 },
  { age_months: 228, L: 1, M: 161.403, S: 0.03451 }
];
const WHO_BMI_BOYS = [
  { age_months: 24, L: -0.5053, M: 16.0211, S: 0.07942 },
  { age_months: 36, L: -0.9221, M: 15.5402, S: 0.07409 },
  { age_months: 48, L: -1.279, M: 15.3234, S: 0.07497 },
  { age_months: 60, L: -1.5408, M: 15.2433, S: 0.07769 },
  { age_months: 72, L: -1.72, M: 15.3153, S: 0.08155 },
  { age_months: 84, L: -1.8504, M: 15.5421, S: 0.08623 },
  { age_months: 96, L: -1.942, M: 15.9202, S: 0.0915 },
  { age_months: 108, L: -2.001, M: 16.4457, S: 0.09716 },
  { age_months: 120, L: -2.031, M: 17.1177, S: 0.10298 },
  { age_months: 132, L: -2.035, M: 17.8943, S: 0.10865 },
  { age_months: 144, L: -2.013, M: 18.7335, S: 0.11383 },
  { age_months: 156, L: -1.97, M: 19.5913, S: 0.11819 },
  { age_months: 168, L: -1.91, M: 20.4245, S: 0.12149 },
  { age_months: 180, L: -1.838, M: 21.1919, S: 0.12358 },
  { age_months: 192, L: -1.76, M: 21.8675, S: 0.12444 },
  { age_months: 204, L: -1.681, M: 22.436, S: 0.12423 },
  { age_months: 216, L: -1.606, M: 22.8996, S: 0.1232 },
  { age_months: 228, L: -1.539, M: 23.2707, S: 0.12168 }
];
const WHO_BMI_GIRLS = [
  { age_months: 24, L: -0.4105, M: 15.7327, S: 0.08567 },
  { age_months: 36, L: -0.8042, M: 15.3393, S: 0.07986 },
  { age_months: 48, L: -1.1165, M: 15.2294, S: 0.07924 },
  { age_months: 60, L: -1.3419, M: 15.2746, S: 0.08152 },
  { age_months: 72, L: -1.4816, M: 15.4605, S: 0.08554 },
  { age_months: 84, L: -1.5727, M: 15.7797, S: 0.09058 },
  { age_months: 96, L: -1.6253, M: 16.2296, S: 0.09636 },
  { age_months: 108, L: -1.6464, M: 16.8137, S: 0.10262 },
  { age_months: 120, L: -1.641, M: 17.5383, S: 0.10906 },
  { age_months: 132, L: -1.614, M: 18.3515, S: 0.11522 },
  { age_months: 144, L: -1.57, M: 19.1913, S: 0.12068 },
  { age_months: 156, L: -1.514, M: 19.978, S: 0.12498 },
  { age_months: 168, L: -1.452, M: 20.6588, S: 0.12798 },
  { age_months: 180, L: -1.389, M: 21.2062, S: 0.12959 },
  { age_months: 192, L: -1.327, M: 21.6176, S: 0.12999 },
  { age_months: 204, L: -1.269, M: 21.9159, S: 0.12948 },
  { age_months: 216, L: -1.217, M: 22.1255, S: 0.12844 },
  { age_months: 228, L: -1.172, M: 22.2726, S: 0.12716 }
];
const WHO_HEAD_BOYS = [
  { age_months: 0, L: 1, M: 34.4618, S: 0.03686 },
  { age_months: 1, L: 1, M: 37.2759, S: 0.03133 },
  { age_months: 2, L: 1, M: 39.1285, S: 0.02997 },
  { age_months: 3, L: 1, M: 40.5135, S: 0.02918 },
  { age_months: 4, L: 1, M: 41.6317, S: 0.02868 },
  { age_months: 5, L: 1, M: 42.5576, S: 0.02837 },
  { age_months: 6, L: 1, M: 43.3306, S: 0.02817 },
  { age_months: 9, L: 1, M: 45.0211, S: 0.0279 },
  { age_months: 12, L: 1, M: 46.0495, S: 0.0278 },
  { age_months: 18, L: 1, M: 47.4519, S: 0.02776 },
  { age_months: 24, L: 1, M: 48.2455, S: 0.02778 },
  { age_months: 36, L: 1, M: 49.5041, S: 0.02787 },
  { age_months: 48, L: 1, M: 50.319, S: 0.02796 },
  { age_months: 60, L: 1, M: 50.9423, S: 0.02804 }
];
const WHO_HEAD_GIRLS = [
  { age_months: 0, L: 1, M: 33.8787, S: 0.03496 },
  { age_months: 1, L: 1, M: 36.5463, S: 0.03098 },
  { age_months: 2, L: 1, M: 38.2521, S: 0.02998 },
  { age_months: 3, L: 1, M: 39.5328, S: 0.02941 },
  { age_months: 4, L: 1, M: 40.5817, S: 0.02907 },
  { age_months: 5, L: 1, M: 41.459, S: 0.02884 },
  { age_months: 6, L: 1, M: 42.1995, S: 0.02869 },
  { age_months: 9, L: 1, M: 43.8096, S: 0.02848 },
  { age_months: 12, L: 1, M: 44.8825, S: 0.02841 },
  { age_months: 18, L: 1, M: 46.2459, S: 0.02838 },
  { age_months: 24, L: 1, M: 47.1391, S: 0.02838 },
  { age_months: 36, L: 1, M: 48.4268, S: 0.02841 },
  { age_months: 48, L: 1, M: 49.3003, S: 0.02844 },
  { age_months: 60, L: 1, M: 49.9457, S: 0.02847 }
];
function interpolateLMS(data, ageMonths) {
  if (data.length === 0) return null;
  if (ageMonths <= data[0].age_months) return data[0];
  if (ageMonths >= data[data.length - 1].age_months) return data[data.length - 1];
  for (let i = 0; i < data.length - 1; i++) {
    if (ageMonths >= data[i].age_months && ageMonths <= data[i + 1].age_months) {
      const t = (ageMonths - data[i].age_months) / (data[i + 1].age_months - data[i].age_months);
      return {
        age_months: ageMonths,
        L: data[i].L + t * (data[i + 1].L - data[i].L),
        M: data[i].M + t * (data[i + 1].M - data[i].M),
        S: data[i].S + t * (data[i + 1].S - data[i].S)
      };
    }
  }
  return null;
}
function calcZScore(value, L, M, S) {
  if (Math.abs(L) < 1e-3) {
    return Math.log(value / M) / S;
  }
  return (Math.pow(value / M, L) - 1) / (L * S);
}
function zToPercentile(z) {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z);
  const t = 1 / (1 + p * absZ);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ / 2);
  const cdf = 0.5 * (1 + sign * y);
  return Math.round(cdf * 1e3) / 10;
}
function getWeightRef(sex) {
  return sex === "male" ? WHO_WEIGHT_BOYS : WHO_WEIGHT_GIRLS;
}
function getHeightRef(sex) {
  return sex === "male" ? WHO_HEIGHT_BOYS : WHO_HEIGHT_GIRLS;
}
function getBMIRef(sex) {
  return sex === "male" ? WHO_BMI_BOYS : WHO_BMI_GIRLS;
}
function getHeadRef(sex) {
  return sex === "male" ? WHO_HEAD_BOYS : WHO_HEAD_GIRLS;
}
function calculateAge(birthDate, measurementDate) {
  let years = measurementDate.getFullYear() - birthDate.getFullYear();
  let months = measurementDate.getMonth() - birthDate.getMonth();
  if (measurementDate.getDate() < birthDate.getDate()) months--;
  if (months < 0) {
    years--;
    months += 12;
  }
  const totalMonths = years * 12 + months;
  let text;
  if (years < 1) {
    text = `${totalMonths} мес.`;
  } else if (years < 5) {
    text = `${years} г. ${months} мес.`;
  } else {
    text = `${years} лет${months > 0 ? ` ${months} мес.` : ""}`;
  }
  return { years, months, totalMonths, text };
}
function calculateAnthropometry(params) {
  const age = calculateAge(params.birthDate, params.measurementDate);
  const ageMonths = age.totalMonths;
  const isChild = age.years < 19;
  let bmi = null;
  if (params.weight && params.height && params.height > 0) {
    bmi = Math.round(params.weight / Math.pow(params.height / 100, 2) * 100) / 100;
  }
  let bsa = null;
  if (params.weight && params.height) {
    bsa = Math.round(Math.sqrt(params.height * params.weight / 3600) * 1e4) / 1e4;
  }
  let waistHeightRatio = null;
  if (params.waistCircumference && params.height) {
    waistHeightRatio = Math.round(params.waistCircumference / params.height * 1e3) / 1e3;
  }
  let weightZScore = null;
  let heightZScore = null;
  let bmiZScore = null;
  let headZScore = null;
  let weightPercentile = null;
  let heightPercentile = null;
  let bmiPercentile = null;
  let headPercentile = null;
  if (isChild && params.weight) {
    const lms = interpolateLMS(getWeightRef(params.sex), ageMonths);
    if (lms) {
      weightZScore = Math.round(calcZScore(params.weight, lms.L, lms.M, lms.S) * 100) / 100;
      weightPercentile = zToPercentile(weightZScore);
    }
  }
  if (isChild && params.height) {
    const lms = interpolateLMS(getHeightRef(params.sex), ageMonths);
    if (lms) {
      heightZScore = Math.round(calcZScore(params.height, lms.L, lms.M, lms.S) * 100) / 100;
      heightPercentile = zToPercentile(heightZScore);
    }
  }
  if (isChild && bmi && ageMonths >= 24) {
    const lms = interpolateLMS(getBMIRef(params.sex), ageMonths);
    if (lms) {
      bmiZScore = Math.round(calcZScore(bmi, lms.L, lms.M, lms.S) * 100) / 100;
      bmiPercentile = zToPercentile(bmiZScore);
    }
  }
  if (params.headCircumference && ageMonths <= 60) {
    const lms = interpolateLMS(getHeadRef(params.sex), ageMonths);
    if (lms) {
      headZScore = Math.round(calcZScore(params.headCircumference, lms.L, lms.M, lms.S) * 100) / 100;
      headPercentile = zToPercentile(headZScore);
    }
  }
  const physicalDevelopment = assessPhysicalDevelopment(heightZScore, weightZScore, isChild, bmi);
  const harmony = assessHarmony(heightZScore, weightZScore, bmiZScore, isChild);
  const bmiCategory = getBMICategory(bmi, bmiZScore, isChild);
  const waistHeightCategory = waistHeightRatio ? waistHeightRatio > 0.5 ? "Абдоминальное ожирение (риск)" : "Норма" : "";
  return {
    ageYears: age.years,
    ageMonths: age.totalMonths,
    ageText: age.text,
    bmi,
    bsa,
    waistHeightRatio,
    weightZScore,
    heightZScore,
    bmiZScore,
    headZScore,
    weightPercentile,
    heightPercentile,
    bmiPercentile,
    headPercentile,
    physicalDevelopment,
    harmony,
    bmiCategory,
    waistHeightCategory
  };
}
function assessPhysicalDevelopment(heightZ, weightZ, isChild, bmi) {
  if (!isChild) {
    if (bmi === null) return "—";
    if (bmi < 18.5) return "Дефицит массы тела";
    if (bmi < 25) return "Норма";
    if (bmi < 30) return "Избыточная масса тела";
    return "Ожирение";
  }
  const z = heightZ ?? weightZ;
  if (z === null) return "—";
  if (z >= -1 && z <= 1) return "Среднее";
  if (z > 1 && z <= 2) return "Выше среднего";
  if (z > 2) return "Высокое";
  if (z < -1 && z >= -2) return "Ниже среднего";
  if (z < -2) return "Низкое";
  return "—";
}
function assessHarmony(heightZ, weightZ, bmiZ, isChild) {
  if (!isChild) return "—";
  if (heightZ !== null && weightZ !== null) {
    const diff = Math.abs(heightZ - weightZ);
    if (diff <= 1) return "Гармоничное";
    if (diff <= 2) return "Дисгармоничное";
    return "Резко дисгармоничное";
  }
  if (bmiZ !== null) {
    if (bmiZ >= -1 && bmiZ <= 1) return "Гармоничное";
    if (Math.abs(bmiZ) <= 2) return "Дисгармоничное";
    return "Резко дисгармоничное";
  }
  return "—";
}
function getBMICategory(bmi, bmiZ, isChild, ageYears) {
  if (bmi === null) return "—";
  if (isChild && bmiZ !== null) {
    if (bmiZ < -3) return "Тяжёлая недостаточность питания";
    if (bmiZ < -2) return "Недостаточность питания";
    if (bmiZ < -1) return "Пониженное питание";
    if (bmiZ <= 1) return "Нормальная масса тела";
    if (bmiZ <= 2) return "Избыточная масса тела";
    return "Ожирение";
  }
  if (bmi < 16) return "Выраженный дефицит массы тела";
  if (bmi < 18.5) return "Дефицит массы тела";
  if (bmi < 25) return "Нормальная масса тела";
  if (bmi < 30) return "Предожирение";
  if (bmi < 35) return "Ожирение I степени";
  if (bmi < 40) return "Ожирение II степени";
  return "Ожирение III степени";
}
function getPercentileLines(data, percentiles = [3, 15, 50, 85, 97]) {
  const zScores = percentiles.map((p) => {
    const zMap = { 3: -1.88, 5: -1.645, 10: -1.28, 15: -1.04, 25: -0.674, 50: 0, 75: 0.674, 85: 1.04, 90: 1.28, 95: 1.645, 97: 1.88 };
    return zMap[p] ?? 0;
  });
  return percentiles.map((p, pi) => ({
    percentile: p,
    points: data.map((entry) => {
      const z = zScores[pi];
      let value;
      if (Math.abs(entry.L) < 1e-3) {
        value = entry.M * Math.exp(entry.S * z);
      } else {
        value = entry.M * Math.pow(1 + entry.L * entry.S * z, 1 / entry.L);
      }
      return { age: entry.age_months, value: Math.round(value * 10) / 10 };
    })
  }));
}
function AnthropometryHistory({ patientId }) {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const fetchMeasurements = async () => {
    setLoading(true);
    const { data } = await supabase.from("anthropometry_measurements").select("*").eq("patient_id", patientId).order("measurement_date", { ascending: false });
    setMeasurements(data || []);
    setLoading(false);
  };
  useEffect(() => {
    fetchMeasurements();
  }, [patientId]);
  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("anthropometry_measurements").delete().eq("id", deleteId);
    if (error) toast.error("Ошибка удаления");
    else {
      toast.success("Удалено");
      fetchMeasurements();
    }
    setDeleteId(null);
  };
  if (loading) return /* @__PURE__ */ jsx("div", { className: "flex justify-center py-8", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) });
  if (measurements.length === 0) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-8 text-center text-muted-foreground", children: "Нет сохранённых измерений" }) });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "История измерений" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b", children: [
          /* @__PURE__ */ jsx("th", { className: "text-left p-2 text-muted-foreground font-medium", children: "Дата" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2 text-muted-foreground font-medium", children: "Возраст" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2 text-muted-foreground font-medium", children: "Вес, кг" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2 text-muted-foreground font-medium", children: "Рост, см" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2 text-muted-foreground font-medium", children: "ИМТ" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2 text-muted-foreground font-medium", children: "P вес" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2 text-muted-foreground font-medium", children: "P рост" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2 text-muted-foreground font-medium", children: "P ИМТ" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2 text-muted-foreground font-medium", children: "Развитие" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2 text-muted-foreground font-medium", children: "Гармоничность" }),
          /* @__PURE__ */ jsx("th", { className: "p-2" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: measurements.map((m) => /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-0 hover:bg-secondary/30", children: [
          /* @__PURE__ */ jsx("td", { className: "p-2", children: format(new Date(m.measurement_date), "dd.MM.yyyy") }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-right", children: m.age_months != null ? `${Math.floor(m.age_months / 12)} г. ${m.age_months % 12} м.` : "—" }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-right", children: m.weight_kg ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-right", children: m.height_cm ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-right", children: m.bmi != null ? Number(m.bmi).toFixed(1) : "—" }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-right", children: m.weight_percentile != null ? `P${m.weight_percentile}` : "—" }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-right", children: m.height_percentile != null ? `P${m.height_percentile}` : "—" }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-right", children: m.bmi_percentile != null ? `P${m.bmi_percentile}` : "—" }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: m.physical_development ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: m.harmony ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: () => setDeleteId(m.id), children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3 text-destructive" }) }) })
        ] }, m.id)) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteId, onOpenChange: (o) => !o && setDeleteId(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Удалить измерение?" }),
        /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Это действие необратимо." })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Отмена" }),
        /* @__PURE__ */ jsx(AlertDialogAction, { onClick: handleDelete, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: "Удалить" })
      ] })
    ] }) })
  ] });
}
const CHART_OPTIONS = [
  { value: "weight", label: "Масса тела" },
  { value: "height", label: "Рост" },
  { value: "bmi", label: "ИМТ" },
  { value: "head", label: "Окружность головы" }
];
const PERCENTILE_COLORS = {
  3: "#ef4444",
  15: "#f59e0b",
  50: "#22c55e",
  85: "#f59e0b",
  97: "#ef4444"
};
function GrowthCharts({ patientId, sex }) {
  const [chartType, setChartType] = useState("weight");
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from("anthropometry_measurements").select("*").eq("patient_id", patientId).order("measurement_date", { ascending: true });
      setMeasurements(data || []);
      setLoading(false);
    };
    fetch();
  }, [patientId]);
  const getRefData = () => {
    switch (chartType) {
      case "weight":
        return sex === "male" ? WHO_WEIGHT_BOYS : WHO_WEIGHT_GIRLS;
      case "height":
        return sex === "male" ? WHO_HEIGHT_BOYS : WHO_HEIGHT_GIRLS;
      case "bmi":
        return sex === "male" ? WHO_BMI_BOYS : WHO_BMI_GIRLS;
      case "head":
        return sex === "male" ? WHO_HEAD_BOYS : WHO_HEAD_GIRLS;
    }
  };
  const getValueField = () => {
    switch (chartType) {
      case "weight":
        return "weight_kg";
      case "height":
        return "height_cm";
      case "bmi":
        return "bmi";
      case "head":
        return "head_circumference_cm";
    }
  };
  const getUnit = () => {
    switch (chartType) {
      case "weight":
        return "кг";
      case "height":
        return "см";
      case "bmi":
        return "кг/м²";
      case "head":
        return "см";
    }
  };
  const refData = getRefData();
  const percentileLines = getPercentileLines(refData);
  const valueField = getValueField();
  const patientPoints = measurements.filter((m) => m[valueField] != null && m.age_months != null).map((m) => ({
    age: Number(m.age_months),
    patient: Number(m[valueField])
  }));
  const allAges = /* @__PURE__ */ new Set();
  percentileLines.forEach((pl) => pl.points.forEach((p) => allAges.add(p.age)));
  patientPoints.forEach((p) => allAges.add(p.age));
  const chartData = Array.from(allAges).sort((a, b) => a - b).map((age) => {
    const point = { age };
    percentileLines.forEach((pl) => {
      const found = pl.points.find((p) => p.age === age);
      if (found) point[`p${pl.percentile}`] = found.value;
    });
    const pp = patientPoints.find((p) => p.age === age);
    if (pp) point.patient = pp.patient;
    return point;
  });
  if (loading) return /* @__PURE__ */ jsx("div", { className: "flex justify-center py-8", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) });
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-3", children: [
      /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Кривые роста (WHO)" }),
      /* @__PURE__ */ jsxs(Select, { value: chartType, onValueChange: (v) => setChartType(v), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[180px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsx(SelectContent, { children: CHART_OPTIONS.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o.value, children: o.label }, o.value)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { children: [
      chartData.length === 0 ? /* @__PURE__ */ jsx("div", { className: "py-12 text-center text-muted-foreground", children: "Нет данных для отображения" }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 400, children: /* @__PURE__ */ jsxs(LineChart, { data: chartData, margin: { top: 5, right: 20, bottom: 25, left: 10 }, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", opacity: 0.3 }),
        /* @__PURE__ */ jsx(
          XAxis,
          {
            dataKey: "age",
            label: { value: "Возраст (мес.)", position: "insideBottom", offset: -15 },
            tick: { fontSize: 11 }
          }
        ),
        /* @__PURE__ */ jsx(
          YAxis,
          {
            label: { value: getUnit(), angle: -90, position: "insideLeft", offset: 5 },
            tick: { fontSize: 11 }
          }
        ),
        /* @__PURE__ */ jsx(
          Tooltip,
          {
            formatter: (value, name) => {
              if (name === "patient") return [`${value} ${getUnit()}`, "Пациент"];
              return [`${value} ${getUnit()}`, name];
            },
            labelFormatter: (age) => `${age} мес. (${(Number(age) / 12).toFixed(1)} лет)`
          }
        ),
        percentileLines.map((pl) => /* @__PURE__ */ jsx(
          Line,
          {
            dataKey: `p${pl.percentile}`,
            stroke: PERCENTILE_COLORS[pl.percentile],
            strokeWidth: pl.percentile === 50 ? 2 : 1,
            strokeDasharray: pl.percentile === 50 ? void 0 : "4 4",
            dot: false,
            name: `P${pl.percentile}`,
            connectNulls: true
          },
          pl.percentile
        )),
        /* @__PURE__ */ jsx(
          Line,
          {
            dataKey: "patient",
            stroke: "hsl(var(--primary))",
            strokeWidth: 3,
            dot: { fill: "hsl(var(--primary))", r: 5 },
            name: "patient",
            connectNulls: true
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-4 justify-center mt-2 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx("span", { className: "w-4 h-0.5 bg-destructive inline-block" }),
          " P3 / P97"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx("span", { className: "w-4 h-0.5 bg-amber-500 inline-block" }),
          " P15 / P85"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx("span", { className: "w-4 h-0.5 bg-emerald-500 inline-block" }),
          " P50 (медиана)"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx("span", { className: "w-4 h-1 bg-primary inline-block rounded" }),
          " Пациент"
        ] })
      ] })
    ] })
  ] });
}
const TANNER_DESCRIPTIONS = {
  1: "Препубертат",
  2: "Начало пубертата",
  3: "Средний пубертат",
  4: "Поздний пубертат",
  5: "Взрослый тип"
};
function getRussianShoeSize(footCm) {
  return Math.round(footCm * 1.5 + 1.5);
}
function getFootNorm(ageMonths) {
  const norms = [
    { maxMonths: 6, size: "9–10 см (р. 16)" },
    { maxMonths: 12, size: "11–12 см (р. 18–19)" },
    { maxMonths: 18, size: "12–13 см (р. 20–21)" },
    { maxMonths: 24, size: "13–14 см (р. 22–23)" },
    { maxMonths: 36, size: "14–15 см (р. 23–25)" },
    { maxMonths: 48, size: "16–17 см (р. 26–27)" },
    { maxMonths: 60, size: "17–18 см (р. 27–29)" },
    { maxMonths: 72, size: "18–19 см (р. 29–30)" },
    { maxMonths: 84, size: "19–20 см (р. 30–32)" },
    { maxMonths: 96, size: "20–21 см (р. 32–33)" },
    { maxMonths: 108, size: "21–22 см (р. 33–34)" },
    { maxMonths: 120, size: "22–23 см (р. 34–36)" },
    { maxMonths: 144, size: "23–25 см (р. 36–38)" },
    { maxMonths: 168, size: "25–27 см (р. 38–41)" },
    { maxMonths: 216, size: "26–29 см (р. 40–44)" }
  ];
  for (const n of norms) {
    if (ageMonths <= n.maxMonths) return n.size;
  }
  return "27–30 см (р. 42–46)";
}
function AnthropometryCalculator() {
  const [patient, setPatient] = useState(null);
  const [measurementDate, setMeasurementDate] = useState(/* @__PURE__ */ new Date());
  const [sex, setSex] = useState("male");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [headCircumference, setHeadCircumference] = useState("");
  const [waistCircumference, setWaistCircumference] = useState("");
  const [tannerStage, setTannerStage] = useState("none");
  const [footLength, setFootLength] = useState("");
  const [penileLength, setPenileLength] = useState("");
  const [penileCircumference, setPenileCircumference] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("calculator");
  useEffect(() => {
    if (!patient) {
      setResult(null);
      return;
    }
    const birthDate = new Date(patient.birth_date);
    const w = parseFloat(weight) || void 0;
    const h = parseFloat(height) || void 0;
    const hc = parseFloat(headCircumference) || void 0;
    const wc = parseFloat(waistCircumference) || void 0;
    if (!w && !h) {
      setResult(null);
      return;
    }
    const res = calculateAnthropometry({
      birthDate,
      measurementDate,
      sex,
      weight: w,
      height: h,
      headCircumference: hc,
      waistCircumference: wc
    });
    setResult(res);
  }, [patient, measurementDate, sex, weight, height, headCircumference, waistCircumference]);
  useEffect(() => {
    if (!patient && activeSubTab === "trends") {
      setActiveSubTab("calculator");
    }
  }, [patient, activeSubTab]);
  const handleSave = async () => {
    if (!patient || !result) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("anthropometry_measurements").insert({
        patient_id: patient.id,
        measurement_date: format(measurementDate, "yyyy-MM-dd"),
        age_months: result.ageMonths,
        sex,
        weight_kg: parseFloat(weight) || null,
        height_cm: parseFloat(height) || null,
        head_circumference_cm: parseFloat(headCircumference) || null,
        waist_circumference_cm: parseFloat(waistCircumference) || null,
        tanner_stage: tannerStage !== "none" ? parseInt(tannerStage, 10) : null,
        bmi: result.bmi,
        bsa: result.bsa,
        waist_height_ratio: result.waistHeightRatio,
        weight_z_score: result.weightZScore,
        height_z_score: result.heightZScore,
        bmi_z_score: result.bmiZScore,
        head_z_score: result.headZScore,
        weight_percentile: result.weightPercentile,
        height_percentile: result.heightPercentile,
        bmi_percentile: result.bmiPercentile,
        head_percentile: result.headPercentile,
        physical_development: result.physicalDevelopment,
        harmony: result.harmony,
        reference_standard: "WHO",
        notes: notes || null,
        foot_length_cm: parseFloat(footLength) || null,
        shoe_size_ru: footLength ? getRussianShoeSize(parseFloat(footLength)) : null,
        penile_length_cm: parseFloat(penileLength) || null,
        penile_circumference_cm: parseFloat(penileCircumference) || null
      });
      if (error) throw error;
      toast.success("Измерение сохранено");
    } catch (err) {
      toast.error("Ошибка сохранения: " + err.message);
    } finally {
      setSaving(false);
    }
  };
  const getZBadge = (z, label) => {
    if (z === null) return null;
    let variant = "secondary";
    let icon = /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3" });
    if (z < -2 || z > 2) {
      variant = "destructive";
      icon = /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3" });
    } else if (z < -1 || z > 1) {
      variant = "outline";
      icon = /* @__PURE__ */ jsx(Info, { className: "h-3 w-3" });
    }
    return /* @__PURE__ */ jsxs(Badge, { variant, className: "gap-1", children: [
      icon,
      " ",
      label,
      ": Z=",
      z.toFixed(2)
    ] });
  };
  return /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs(Tabs, { value: activeSubTab, onValueChange: setActiveSubTab, children: [
    /* @__PURE__ */ jsxs(TabsList, { children: [
      /* @__PURE__ */ jsxs(TabsTrigger, { value: "calculator", children: [
        /* @__PURE__ */ jsx(Calculator, { className: "h-4 w-4 mr-1" }),
        " Калькулятор"
      ] }),
      /* @__PURE__ */ jsxs(TabsTrigger, { value: "trends", disabled: !patient, children: [
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 mr-1" }),
        " Тренды"
      ] })
    ] }),
    /* @__PURE__ */ jsx(TabsContent, { value: "calculator", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Антропометрия" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsx(PatientSelect, { selectedPatient: patient, onSelect: setPatient }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { children: "Дата измерения" }),
              /* @__PURE__ */ jsxs(Popover, { children: [
                /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "w-full justify-start text-left", children: [
                  /* @__PURE__ */ jsx(CalendarIcon, { className: "mr-2 h-4 w-4" }),
                  format(measurementDate, "dd.MM.yyyy")
                ] }) }),
                /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: /* @__PURE__ */ jsx(Calendar, { mode: "single", selected: measurementDate, onSelect: (d) => d && setMeasurementDate(d), className: "p-3 pointer-events-auto" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { children: "Пол" }),
              /* @__PURE__ */ jsxs(Select, { value: sex, onValueChange: (v) => setSex(v), children: [
                /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "male", children: "Мужской" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "female", children: "Женский" })
                ] })
              ] })
            ] })
          ] }),
          patient && /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-accent/50 text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Возраст: " }),
            (result == null ? void 0 : result.ageText) ?? "введите данные"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Масса тела (кг)" }),
              /* @__PURE__ */ jsx(DecimalInput, { value: weight, onValueChange: setWeight, placeholder: "12,5" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Рост (см)" }),
              /* @__PURE__ */ jsx(DecimalInput, { value: height, onValueChange: setHeight, placeholder: "85,0" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Окружность головы (см)" }),
              /* @__PURE__ */ jsx(DecimalInput, { value: headCircumference, onValueChange: setHeadCircumference, placeholder: "46,0" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Окружность талии (см)" }),
              /* @__PURE__ */ jsx(DecimalInput, { value: waistCircumference, onValueChange: setWaistCircumference, placeholder: "50,0" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Длина стопы (см)" }),
              /* @__PURE__ */ jsx(DecimalInput, { value: footLength, onValueChange: setFootLength, placeholder: "22,0" })
            ] })
          ] }),
          footLength && parseFloat(footLength) > 0 && /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-accent/50 text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Размер обуви (РФ): " }),
            getRussianShoeSize(parseFloat(footLength)),
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground ml-2", children: [
              "(норма для ",
              (result == null ? void 0 : result.ageText) ?? "—",
              ": ",
              result ? getFootNorm(result.ageMonths) : "—",
              ")"
            ] })
          ] }),
          sex === "male" && /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("div", { className: "border-t pt-3 mt-2", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-medium text-muted-foreground mb-2 block", children: "Половой член (антропометрия)" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Длина (см)" }),
                /* @__PURE__ */ jsx(DecimalInput, { value: penileLength, onValueChange: setPenileLength, placeholder: "5,0" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Окружность (см)" }),
                /* @__PURE__ */ jsx(DecimalInput, { value: penileCircumference, onValueChange: setPenileCircumference, placeholder: "7,0" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Стадия Таннера" }),
            /* @__PURE__ */ jsxs(Select, { value: tannerStage, onValueChange: setTannerStage, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Не указана" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "none", children: "Не указана" }),
                [1, 2, 3, 4, 5].map((s2) => /* @__PURE__ */ jsxs(SelectItem, { value: String(s2), children: [
                  s2,
                  " — ",
                  TANNER_DESCRIPTIONS[s2]
                ] }, s2))
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Заметки" }),
            /* @__PURE__ */ jsx(Textarea, { value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Дополнительные наблюдения...", rows: 2 })
          ] }),
          /* @__PURE__ */ jsxs(Button, { onClick: handleSave, disabled: saving || !patient || !result, className: "w-full", children: [
            /* @__PURE__ */ jsx(Save, { className: "h-4 w-4 mr-2" }),
            saving ? "Сохранение..." : "Сохранить измерение"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-4", children: result ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Расчётные показатели" }) }),
          /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [
            result.bmi !== null && /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-secondary/50", children: [
              /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: "ИМТ" }),
              /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", children: result.bmi.toFixed(1) }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: result.bmiCategory })
            ] }),
            result.bsa !== null && /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-secondary/50", children: [
              /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: "BSA (м²)" }),
              /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", children: result.bsa.toFixed(3) }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Мостеллер" })
            ] }),
            result.waistHeightRatio !== null && /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-secondary/50", children: [
              /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: "Талия/Рост" }),
              /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", children: result.waistHeightRatio.toFixed(3) }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: result.waistHeightCategory })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-secondary/50", children: [
              /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: "Возраст" }),
              /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", children: result.ageText }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
                result.ageMonths,
                " мес."
              ] })
            ] })
          ] }) })
        ] }),
        (result.weightPercentile !== null || result.heightPercentile !== null) && /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Перцентили (WHO)" }) }),
          /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            result.weightPercentile !== null && /* @__PURE__ */ jsx(PercentileBar, { label: "Масса", percentile: result.weightPercentile, zScore: result.weightZScore }),
            result.heightPercentile !== null && /* @__PURE__ */ jsx(PercentileBar, { label: "Рост", percentile: result.heightPercentile, zScore: result.heightZScore }),
            result.bmiPercentile !== null && /* @__PURE__ */ jsx(PercentileBar, { label: "ИМТ", percentile: result.bmiPercentile, zScore: result.bmiZScore }),
            result.headPercentile !== null && /* @__PURE__ */ jsx(PercentileBar, { label: "Окр. головы", percentile: result.headPercentile, zScore: result.headZScore })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Оценка физического развития" }) }),
          /* @__PURE__ */ jsxs(CardContent, { children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2 rounded bg-secondary/30", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Уровень развития" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: result.physicalDevelopment })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2 rounded bg-secondary/30", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Гармоничность" }),
                /* @__PURE__ */ jsx("span", { className: cn("font-medium", result.harmony.includes("Резко") && "text-destructive"), children: result.harmony })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2 rounded bg-secondary/30", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "ИМТ-категория" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: result.bmiCategory })
              ] }),
              result.waistHeightCategory && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2 rounded bg-secondary/30", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Талия/Рост" }),
                /* @__PURE__ */ jsx("span", { className: cn("font-medium", result.waistHeightCategory.includes("риск") && "text-destructive"), children: result.waistHeightCategory })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1 mt-3", children: [
              getZBadge(result.weightZScore, "Масса"),
              getZBadge(result.heightZScore, "Рост"),
              getZBadge(result.bmiZScore, "ИМТ"),
              getZBadge(result.headZScore, "Голова")
            ] })
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "py-12 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Calculator, { className: "h-12 w-12 mx-auto mb-4 opacity-30" }),
        /* @__PURE__ */ jsx("p", { children: "Выберите пациента и введите данные для расчёта" })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsx(TabsContent, { value: "trends", children: patient ? /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx(GrowthCharts, { patientId: patient.id, sex }),
      /* @__PURE__ */ jsx(AnthropometryHistory, { patientId: patient.id })
    ] }) : /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-12 text-center text-muted-foreground", children: "Сначала выберите пациента во вкладке «Калькулятор», чтобы открыть тренды." }) }) })
  ] }) });
}
function PercentileBar({ label, percentile, zScore }) {
  const getColor = () => {
    if (percentile < 3 || percentile > 97) return "bg-destructive";
    if (percentile < 15 || percentile > 85) return "bg-amber-500";
    return "bg-emerald-500";
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm mb-1", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: label }),
      /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
        "P",
        percentile,
        " (Z=",
        zScore.toFixed(2),
        ")"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "h-2 bg-secondary rounded-full relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 h-full rounded-full transition-all", style: { width: `${Math.min(100, Math.max(2, percentile))}%` }, children: /* @__PURE__ */ jsx("div", { className: cn("h-full rounded-full", getColor()) }) }),
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-[3%] w-px h-full bg-muted-foreground/30" }),
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-[15%] w-px h-full bg-muted-foreground/20" }),
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-[50%] w-px h-full bg-muted-foreground/30" }),
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-[85%] w-px h-full bg-muted-foreground/20" }),
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-[97%] w-px h-full bg-muted-foreground/30" })
    ] })
  ] });
}
class AnthropometryErrorBoundary extends Component {
  constructor() {
    super(...arguments);
    __publicField(this, "state", { hasError: false });
    __publicField(this, "handleRetry", () => {
      this.setState({ hasError: false });
    });
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[AnthropometryErrorBoundary]", error, errorInfo);
  }
  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-destructive", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-5 w-5" }),
        "Ошибка в модуле антропометрии"
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Вкладка временно не отрисовалась из-за клиентской ошибки. Нажмите «Повторить»." }),
        /* @__PURE__ */ jsxs(Button, { onClick: this.handleRetry, variant: "outline", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
          "Повторить"
        ] })
      ] })
    ] });
  }
}
const adultRange = (min, max) => () => ({ min, max });
const sexRange = (mMin, mMax, fMin, fMax) => (_age, sex) => sex === "male" ? { min: mMin, max: mMax } : { min: fMin, max: fMax };
function testosteroneTotalRange(age, sex) {
  if (sex === "female") {
    if (age < 10) return { min: 0.1, max: 0.7 };
    if (age < 18) return { min: 0.3, max: 2.5 };
    return { min: 0.3, max: 2.5 };
  }
  if (age < 1) return { min: 0.2, max: 10 };
  if (age < 7) return { min: 0.1, max: 0.7 };
  if (age < 10) return { min: 0.1, max: 1.1 };
  if (age < 12) return { min: 0.2, max: 3.5 };
  if (age < 14) return { min: 0.5, max: 15 };
  if (age < 16) return { min: 3, max: 25 };
  if (age < 18) return { min: 8, max: 30 };
  return { min: 8.6, max: 29 };
}
function lhRange(age, sex) {
  if (sex === "female") return age < 18 ? { min: 0.3, max: 12 } : { min: 1.7, max: 8.6 };
  if (age < 10) return { min: 0.02, max: 0.3 };
  if (age < 14) return { min: 0.2, max: 5 };
  if (age < 18) return { min: 0.5, max: 9 };
  return { min: 1.7, max: 8.6 };
}
function fshRange(age, sex) {
  if (sex === "female") return age < 18 ? { min: 0.5, max: 10 } : { min: 1.5, max: 12.4 };
  if (age < 10) return { min: 0.1, max: 1.5 };
  if (age < 14) return { min: 0.3, max: 5 };
  if (age < 18) return { min: 0.7, max: 10 };
  return { min: 1.5, max: 12.4 };
}
function inhibinBRange(age, sex) {
  if (sex === "female") return { min: 10, max: 200 };
  if (age < 10) return { min: 35, max: 350 };
  if (age < 14) return { min: 60, max: 400 };
  return { min: 25, max: 325 };
}
function amhRange(age, sex) {
  if (sex === "female") return { min: 1, max: 10 };
  if (age < 2) return { min: 15, max: 125 };
  if (age < 10) return { min: 7, max: 85 };
  if (age < 14) return { min: 3, max: 50 };
  if (age < 18) return { min: 1.5, max: 25 };
  return { min: 0.7, max: 19 };
}
function igf1Range(age, _sex) {
  if (age < 6) return { min: 20, max: 200 };
  if (age < 10) return { min: 50, max: 350 };
  if (age < 14) return { min: 100, max: 600 };
  if (age < 18) return { min: 150, max: 700 };
  if (age < 30) return { min: 115, max: 355 };
  if (age < 50) return { min: 95, max: 290 };
  return { min: 70, max: 230 };
}
const LAB_TESTS = [
  // === АНДРОЛОГИЧЕСКИЙ ПРОФИЛЬ ===
  { code: "testosterone_total", name: "Тестостерон общий", unit: "нмоль/л", group: "Андрологический профиль", getRange: testosteroneTotalRange },
  { code: "testosterone_free", name: "Тестостерон свободный", unit: "пг/мл", group: "Андрологический профиль", getRange: sexRange(4.5, 42, 0.2, 5) },
  { code: "dht", name: "Дигидротестостерон (ДГТ)", unit: "пг/мл", group: "Андрологический профиль", getRange: sexRange(250, 990, 24, 368) },
  { code: "dhea_s", name: "ДГЭА-сульфат", unit: "мкмоль/л", group: "Андрологический профиль", getRange: sexRange(2.4, 13.4, 1.8, 10.1) },
  { code: "androstenedione", name: "Андростендион", unit: "нмоль/л", group: "Андрологический профиль", getRange: sexRange(1.6, 12.2, 1.2, 8.6) },
  { code: "shbg", name: "ГСПГ (SHBG)", unit: "нмоль/л", group: "Андрологический профиль", getRange: sexRange(13, 71, 18, 114) },
  { code: "17oh_progesterone", name: "17-ОН прогестерон", unit: "нмоль/л", group: "Андрологический профиль", getRange: sexRange(0.5, 7.5, 0.1, 8) },
  // === ГОНАДОТРОПИНЫ И РЕПРОДУКТИВНЫЕ ГОРМОНЫ ===
  { code: "lh", name: "ЛГ", unit: "мМЕ/мл", group: "Гонадотропины", getRange: lhRange },
  { code: "fsh", name: "ФСГ", unit: "мМЕ/мл", group: "Гонадотропины", getRange: fshRange },
  { code: "inhibin_b", name: "Ингибин В", unit: "пг/мл", group: "Гонадотропины", getRange: inhibinBRange },
  { code: "amh", name: "Антимюллеров гормон (АМГ)", unit: "нг/мл", group: "Гонадотропины", getRange: amhRange },
  { code: "estradiol", name: "Эстрадиол", unit: "пмоль/л", group: "Гонадотропины", getRange: sexRange(40, 162, 68, 1269) },
  { code: "prolactin", name: "Пролактин", unit: "мМЕ/л", group: "Гонадотропины", getRange: sexRange(73, 407, 109, 557) },
  // === ЩИТОВИДНАЯ ЖЕЛЕЗА ===
  { code: "tsh", name: "ТТГ", unit: "мМЕ/л", group: "Щитовидная железа", getRange: adultRange(0.27, 4.2) },
  { code: "t3_free", name: "Т3 свободный", unit: "пмоль/л", group: "Щитовидная железа", getRange: adultRange(3.1, 6.8) },
  { code: "t4_free", name: "Т4 свободный", unit: "пмоль/л", group: "Щитовидная железа", getRange: adultRange(12, 22) },
  // === УГЛЕВОДНЫЙ ОБМЕН ===
  { code: "insulin", name: "Инсулин", unit: "мкМЕ/мл", group: "Углеводный обмен", getRange: adultRange(2.6, 24.9) },
  { code: "proinsulin", name: "Проинсулин", unit: "пмоль/л", group: "Углеводный обмен", getRange: adultRange(0.5, 9.4) },
  { code: "c_peptide", name: "С-пептид", unit: "нг/мл", group: "Углеводный обмен", getRange: adultRange(0.9, 7.1) },
  { code: "hba1c", name: "Гликированный гемоглобин (HbA1c)", unit: "%", group: "Углеводный обмен", getRange: adultRange(4, 6) },
  { code: "glucose", name: "Глюкоза", unit: "ммоль/л", group: "Углеводный обмен", getRange: adultRange(3.9, 6.1) },
  { code: "homa_ir", name: "Индекс HOMA-IR", unit: "", group: "Углеводный обмен", getRange: adultRange(0, 2.7) },
  // === ЛИПИДНЫЙ ПРОФИЛЬ ===
  { code: "cholesterol", name: "Холестерин общий", unit: "ммоль/л", group: "Липидный профиль", getRange: adultRange(3, 5.2) },
  { code: "ldl", name: "ЛПНП", unit: "ммоль/л", group: "Липидный профиль", getRange: adultRange(0, 3.3) },
  { code: "hdl", name: "ЛПВП", unit: "ммоль/л", group: "Липидный профиль", getRange: sexRange(1, 2.1, 1.2, 2.5) },
  { code: "triglycerides", name: "Триглицериды", unit: "ммоль/л", group: "Липидный профиль", getRange: adultRange(0.4, 1.7) },
  { code: "atherogenic_index", name: "Коэф. атерогенности", unit: "", group: "Липидный профиль", getRange: adultRange(0, 3) },
  // === ПЕЧЁНОЧНЫЙ ПРОФИЛЬ ===
  { code: "bilirubin_total", name: "Билирубин общий", unit: "мкмоль/л", group: "Печёночный профиль", getRange: adultRange(3.4, 20.5) },
  { code: "bilirubin_direct", name: "Билирубин прямой", unit: "мкмоль/л", group: "Печёночный профиль", getRange: adultRange(0, 5.1) },
  { code: "bilirubin_indirect", name: "Билирубин непрямой", unit: "мкмоль/л", group: "Печёночный профиль", getRange: adultRange(3.4, 15.4) },
  { code: "alt", name: "АЛТ", unit: "Ед/л", group: "Печёночный профиль", getRange: sexRange(0, 41, 0, 33) },
  { code: "ast", name: "АСТ", unit: "Ед/л", group: "Печёночный профиль", getRange: sexRange(0, 40, 0, 32) },
  { code: "ggt", name: "Гамма-ГГТ", unit: "Ед/л", group: "Печёночный профиль", getRange: sexRange(10, 71, 6, 42) },
  { code: "amylase", name: "Амилаза", unit: "Ед/л", group: "Печёночный профиль", getRange: adultRange(28, 100) },
  { code: "lipase", name: "Липаза", unit: "Ед/л", group: "Печёночный профиль", getRange: adultRange(13, 60) },
  // === ПОЧЕЧНЫЙ ПРОФИЛЬ ===
  { code: "urea", name: "Мочевина", unit: "ммоль/л", group: "Почечный профиль", getRange: adultRange(2.5, 8.3) },
  { code: "creatinine", name: "Креатинин", unit: "мкмоль/л", group: "Почечный профиль", getRange: sexRange(62, 115, 44, 97) },
  { code: "uric_acid", name: "Мочевая кислота", unit: "мкмоль/л", group: "Почечный профиль", getRange: sexRange(202, 416, 143, 339) },
  { code: "cystatin_c", name: "Цистатин С", unit: "мг/л", group: "Почечный профиль", getRange: adultRange(0.55, 1.15) },
  // === ОБМЕН ЖЕЛЕЗА ===
  { code: "iron", name: "Железо", unit: "мкмоль/л", group: "Обмен железа", getRange: sexRange(11.6, 31.3, 9, 30.4) },
  { code: "ferritin", name: "Ферритин", unit: "мкг/л", group: "Обмен железа", getRange: sexRange(20, 250, 10, 120) },
  { code: "transferrin", name: "Трансферрин", unit: "г/л", group: "Обмен железа", getRange: adultRange(2, 3.6) },
  { code: "tibc", name: "ОЖСС", unit: "мкмоль/л", group: "Обмен железа", getRange: adultRange(45, 72) },
  // === ПРОЧЕЕ ===
  { code: "homocysteine", name: "Гомоцистеин", unit: "мкмоль/л", group: "Прочее", getRange: sexRange(5.5, 16.2, 4.4, 13.6) },
  { code: "igf1", name: "ИФР-1 (IGF-1)", unit: "нг/мл", group: "Прочее", getRange: igf1Range },
  { code: "leptin", name: "Лептин", unit: "нг/мл", group: "Прочее", getRange: sexRange(2, 5.6, 3.7, 11.1) },
  { code: "vitamin_d", name: "Витамин D (25-OH)", unit: "нг/мл", group: "Прочее", getRange: adultRange(30, 100) },
  { code: "cortisol", name: "Кортизол (утро)", unit: "нмоль/л", group: "Прочее", getRange: adultRange(171, 536) },
  // === СПЕРМОГРАММА (для полноты андрологического профиля) ===
  { code: "sperm_volume", name: "Объём эякулята", unit: "мл", group: "Спермограмма", getRange: () => ({ min: 1.5, max: 100 }) },
  { code: "sperm_concentration", name: "Концентрация", unit: "млн/мл", group: "Спермограмма", getRange: () => ({ min: 15, max: 1e3 }) },
  { code: "sperm_motility_a_b", name: "Подвижность (A+B)", unit: "%", group: "Спермограмма", getRange: () => ({ min: 32, max: 100 }) },
  { code: "sperm_morphology", name: "Морфология (норм. формы)", unit: "%", group: "Спермограмма", getRange: () => ({ min: 4, max: 100 }) }
];
const LAB_GROUPS = Array.from(new Set(LAB_TESTS.map((t) => t.group)));
const ULTRASOUND_AGE_NORMS = [
  { ageYears: 1, rightTestisMl: 0.51, leftTestisMl: 0.51, prostateMl: 0.51 },
  { ageYears: 2, rightTestisMl: 0.55, leftTestisMl: 0.55, prostateMl: 0.55 },
  { ageYears: 3, rightTestisMl: 0.55, leftTestisMl: 0.55, prostateMl: 0.55 },
  { ageYears: 4, rightTestisMl: 0.63, leftTestisMl: 0.63, prostateMl: 0.63 },
  { ageYears: 5, rightTestisMl: 0.69, leftTestisMl: 0.69, prostateMl: 0.69 },
  { ageYears: 6, rightTestisMl: 0.69, leftTestisMl: 0.69, prostateMl: 0.69 },
  { ageYears: 7, rightTestisMl: 0.69, leftTestisMl: 0.69, prostateMl: 0.69 },
  { ageYears: 8, rightTestisMl: 0.8, leftTestisMl: 0.8, prostateMl: 0.8 },
  { ageYears: 9, rightTestisMl: 0.8, leftTestisMl: 0.8, prostateMl: 0.8 },
  { ageYears: 10, rightTestisMl: 1.29, leftTestisMl: 1.29, prostateMl: 1.29 },
  { ageYears: 11, rightTestisMl: 2.52, leftTestisMl: 2.52, prostateMl: 2.52 },
  { ageYears: 12, rightTestisMl: 4.59, leftTestisMl: 4.59, prostateMl: 4.59 },
  { ageYears: 13, rightTestisMl: 7.05, leftTestisMl: 7.05, prostateMl: 7.05 },
  { ageYears: 14, rightTestisMl: 8.87, leftTestisMl: 8.87, prostateMl: 8.87 },
  { ageYears: 15, rightTestisMl: 10.9, leftTestisMl: 10.9, prostateMl: 10.9 },
  { ageYears: 16, rightTestisMl: 12.68, leftTestisMl: 12.68, prostateMl: 12.68 },
  { ageYears: 17, rightTestisMl: 12.68, leftTestisMl: 12.68, prostateMl: 12.68 }
];
function getUltrasoundNorm(ageYears) {
  if (ageYears < 1 || ageYears > 17) return null;
  return ULTRASOUND_AGE_NORMS.find((n) => n.ageYears === Math.floor(ageYears)) ?? null;
}
function LabResultsPanel() {
  var _a, _b, _c, _d;
  const [patient, setPatient] = useState(null);
  const [sex, setSex] = useState("male");
  const [testDate, setTestDate] = useState(/* @__PURE__ */ new Date());
  const [entries, setEntries] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState(LAB_GROUPS[0]);
  const [subTab, setSubTab] = useState("input");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [trendTest, setTrendTest] = useState(LAB_TESTS[0].code);
  const ageYears = patient ? calculateAge(new Date(patient.birth_date), testDate).years : 0;
  const updateEntry = (code, value) => {
    setEntries((prev) => ({ ...prev, [code]: value }));
  };
  const handleSave = async () => {
    if (!patient) {
      toast.error("Выберите пациента");
      return;
    }
    const filledEntries = Object.entries(entries).filter(([_, v]) => v && v.trim() !== "");
    if (filledEntries.length === 0) {
      toast.error("Введите хотя бы один показатель");
      return;
    }
    setSaving(true);
    try {
      const rows = filledEntries.map(([code, val]) => {
        const test = LAB_TESTS.find((t) => t.code === code);
        const numVal = parseFloat(val);
        const range = test.getRange(ageYears, sex);
        const isAbnormal = range ? numVal < range.min || numVal > range.max : false;
        return {
          patient_id: patient.id,
          test_date: format(testDate, "yyyy-MM-dd"),
          test_group: test.group,
          test_name: test.name,
          test_code: test.code,
          value: numVal,
          unit: test.unit,
          reference_min: (range == null ? void 0 : range.min) ?? null,
          reference_max: (range == null ? void 0 : range.max) ?? null,
          is_abnormal: isAbnormal
        };
      });
      const { error } = await supabase.from("lab_results").insert(rows);
      if (error) throw error;
      toast.success(`Сохранено ${rows.length} показателей`);
      setEntries({});
      if (subTab === "history" || subTab === "trends") fetchHistory();
    } catch (err) {
      toast.error("Ошибка: " + err.message);
    } finally {
      setSaving(false);
    }
  };
  const fetchHistory = async () => {
    if (!patient) return;
    setHistoryLoading(true);
    const { data } = await supabase.from("lab_results").select("*").eq("patient_id", patient.id).order("test_date", { ascending: false }).order("test_group").order("test_name");
    setHistory(data || []);
    setHistoryLoading(false);
  };
  useEffect(() => {
    if (patient && (subTab === "history" || subTab === "trends")) fetchHistory();
  }, [patient, subTab]);
  const handleDeleteResults = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("lab_results").delete().eq("id", deleteId);
    if (error) toast.error("Ошибка удаления");
    else {
      toast.success("Удалено");
      fetchHistory();
    }
    setDeleteId(null);
  };
  const trendData = history.filter((r) => r.test_code === trendTest).reverse().map((r) => ({
    date: format(new Date(r.test_date), "dd.MM.yy"),
    value: Number(r.value),
    min: r.reference_min != null ? Number(r.reference_min) : void 0,
    max: r.reference_max != null ? Number(r.reference_max) : void 0
  }));
  const trendTestInfo = LAB_TESTS.find((t) => t.code === trendTest);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-2", children: /* @__PURE__ */ jsx(PatientSelect, { selectedPatient: patient, onSelect: setPatient }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Пол" }),
          /* @__PURE__ */ jsxs(Select, { value: sex, onValueChange: (v) => setSex(v), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "male", children: "Мужской" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "female", children: "Женский" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Дата анализов" }),
          /* @__PURE__ */ jsxs(Popover, { children: [
            /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "w-full justify-start text-left text-sm", children: [
              /* @__PURE__ */ jsx(CalendarIcon, { className: "mr-1 h-3 w-3" }),
              format(testDate, "dd.MM.yyyy")
            ] }) }),
            /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: /* @__PURE__ */ jsx(Calendar, { mode: "single", selected: testDate, onSelect: (d) => d && setTestDate(d), className: "p-3 pointer-events-auto" }) })
          ] })
        ] })
      ] })
    ] }),
    patient && /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
      "Возраст: ",
      /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: calculateAge(new Date(patient.birth_date), testDate).text }),
      " · ",
      "Нормы подбираются автоматически по возрасту и полу"
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { value: subTab, onValueChange: setSubTab, children: [
      /* @__PURE__ */ jsxs(TabsList, { children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "input", children: "Ввод данных" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "history", disabled: !patient, children: "История" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "trends", disabled: !patient, children: "Тренды" })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "input", children: [
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 mb-4", children: LAB_GROUPS.map((g) => /* @__PURE__ */ jsxs(Button, { variant: activeGroup === g ? "default" : "outline", size: "sm", onClick: () => setActiveGroup(g), className: "text-xs", children: [
          g,
          (() => {
            const count = LAB_TESTS.filter((t) => t.group === g && entries[t.code]).length;
            return count > 0 ? /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-1 h-4 min-w-4 text-[10px]", children: count }) : null;
          })()
        ] }, g)) }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: activeGroup }) }),
          /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: LAB_TESTS.filter((t) => t.group === activeGroup).map((test) => {
            const range = patient ? test.getRange(ageYears, sex) : null;
            const val = entries[test.code] || "";
            const numVal = parseFloat(val);
            const isLow = range && val && numVal < range.min;
            const isHigh = range && val && numVal > range.max;
            const isAbnormal = isLow || isHigh;
            return /* @__PURE__ */ jsxs("div", { className: cn(
              "flex items-center gap-2 p-2 rounded-lg border transition-colors",
              isAbnormal ? "border-destructive/50 bg-destructive/5" : "border-transparent"
            ), children: [
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-xs font-medium truncate", children: test.name }),
                  isLow && /* @__PURE__ */ jsx(ArrowDown, { className: "h-3 w-3 text-blue-500 shrink-0" }),
                  isHigh && /* @__PURE__ */ jsx(ArrowUp, { className: "h-3 w-3 text-destructive shrink-0" })
                ] }),
                range && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground", children: [
                  range.min,
                  "–",
                  range.max,
                  " ",
                  test.unit
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-24 shrink-0", children: /* @__PURE__ */ jsx(
                DecimalInput,
                {
                  value: val,
                  onValueChange: (v) => updateEntry(test.code, v),
                  placeholder: "—",
                  className: cn("h-8 text-sm text-right", isAbnormal && "border-destructive text-destructive")
                }
              ) }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground w-16 text-right shrink-0", children: test.unit })
            ] }, test.code);
          }) }) })
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: handleSave, disabled: saving || !patient || Object.values(entries).filter(Boolean).length === 0, className: "w-full mt-4", children: [
          /* @__PURE__ */ jsx(Save, { className: "h-4 w-4 mr-2" }),
          saving ? "Сохранение..." : `Сохранить (${Object.values(entries).filter(Boolean).length} показателей)`
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "history", children: historyLoading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-8", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) }) : history.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-8 text-center text-muted-foreground", children: "Нет сохранённых анализов" }) }) : /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b", children: [
          /* @__PURE__ */ jsx("th", { className: "text-left p-2 font-medium text-muted-foreground", children: "Дата" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2 font-medium text-muted-foreground", children: "Группа" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2 font-medium text-muted-foreground", children: "Показатель" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2 font-medium text-muted-foreground", children: "Значение" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2 font-medium text-muted-foreground", children: "Норма" }),
          /* @__PURE__ */ jsx("th", { className: "p-2" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: history.map((r) => /* @__PURE__ */ jsxs("tr", { className: cn("border-b last:border-0", r.is_abnormal && "bg-destructive/5"), children: [
          /* @__PURE__ */ jsx("td", { className: "p-2", children: format(new Date(r.test_date), "dd.MM.yy") }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-muted-foreground text-xs", children: r.test_group }),
          /* @__PURE__ */ jsx("td", { className: "p-2 font-medium", children: r.test_name }),
          /* @__PURE__ */ jsxs("td", { className: cn("p-2 text-right font-mono", r.is_abnormal && "text-destructive font-bold"), children: [
            Number(r.value).toFixed(2),
            " ",
            r.unit,
            r.is_abnormal && (Number(r.value) < Number(r.reference_min) ? /* @__PURE__ */ jsx(ArrowDown, { className: "inline h-3 w-3 ml-1 text-blue-500" }) : /* @__PURE__ */ jsx(ArrowUp, { className: "inline h-3 w-3 ml-1 text-destructive" }))
          ] }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-right text-muted-foreground text-xs", children: r.reference_min != null ? `${r.reference_min}–${r.reference_max}` : "—" }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: () => setDeleteId(r.id), children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3 text-destructive" }) }) })
        ] }, r.id)) })
      ] }) }) }) }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "trends", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(Select, { value: trendTest, onValueChange: setTrendTest, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full max-w-md", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Выберите показатель" }) }),
          /* @__PURE__ */ jsx(SelectContent, { children: LAB_GROUPS.map((g) => /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "px-2 py-1.5 text-xs font-semibold text-muted-foreground", children: g }),
            LAB_TESTS.filter((t) => t.group === g).map((t) => /* @__PURE__ */ jsxs(SelectItem, { value: t.code, children: [
              t.name,
              " (",
              t.unit,
              ")"
            ] }, t.code))
          ] }, g)) })
        ] }),
        trendData.length > 0 ? /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" }),
            trendTestInfo == null ? void 0 : trendTestInfo.name,
            /* @__PURE__ */ jsxs("span", { className: "text-sm font-normal text-muted-foreground", children: [
              "(",
              trendTestInfo == null ? void 0 : trendTestInfo.unit,
              ")"
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(LineChart, { data: trendData, margin: { top: 10, right: 20, bottom: 5, left: 10 }, children: [
            /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", opacity: 0.3 }),
            /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: { fontSize: 11 } }),
            /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 11 } }),
            /* @__PURE__ */ jsx(Tooltip, {}),
            ((_a = trendData[0]) == null ? void 0 : _a.min) != null && ((_b = trendData[0]) == null ? void 0 : _b.max) != null && /* @__PURE__ */ jsx(ReferenceArea, { y1: trendData[0].min, y2: trendData[0].max, fill: "hsl(var(--primary))", fillOpacity: 0.08 }),
            ((_c = trendData[0]) == null ? void 0 : _c.min) != null && /* @__PURE__ */ jsx(ReferenceLine, { y: trendData[0].min, stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4", label: { value: "min", fontSize: 10 } }),
            ((_d = trendData[0]) == null ? void 0 : _d.max) != null && /* @__PURE__ */ jsx(ReferenceLine, { y: trendData[0].max, stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4", label: { value: "max", fontSize: 10 } }),
            /* @__PURE__ */ jsx(Line, { dataKey: "value", stroke: "hsl(var(--primary))", strokeWidth: 2, dot: { fill: "hsl(var(--primary))", r: 4 } })
          ] }) }) })
        ] }) : /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-8 text-center text-muted-foreground", children: "Нет данных по выбранному показателю" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteId, onOpenChange: (o) => !o && setDeleteId(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Удалить результат?" }),
        /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Это действие необратимо." })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Отмена" }),
        /* @__PURE__ */ jsx(AlertDialogAction, { onClick: handleDeleteResults, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: "Удалить" })
      ] })
    ] }) })
  ] });
}
const ECHOSTRUCTURE_OPTIONS = [
  { value: "homogeneous", label: "Однородная" },
  { value: "heterogeneous", label: "Неоднородная" },
  { value: "hyperechoic_foci", label: "Гиперэхогенные включения" },
  { value: "hypoechoic_area", label: "Гипоэхогенный участок" },
  { value: "microlithiasis", label: "Микролитиаз" },
  { value: "calcification", label: "Кальцинат" }
];
const VARICOCELE_GRADES = [
  { value: "0", label: "0 — Нет" },
  { value: "1", label: "I — Субклиническое (только при Вальсальве на УЗИ)" },
  { value: "2", label: "II — Пальпируется при Вальсальве" },
  { value: "3", label: "III — Видно визуально" }
];
function calcVolumeDeficit(vol, normVal) {
  if (!vol || !normVal) return null;
  if (vol >= normVal) return null;
  const deficit = Math.round((normVal - vol) * 100) / 100;
  const deficitPercent = Math.round(deficit / normVal * 100);
  return { deficit, deficitPercent };
}
function calcLateralization(rightVol, leftVol) {
  if (!rightVol || !leftVol) return null;
  const diff = Math.round((rightVol - leftVol) * 100) / 100;
  if (Math.abs(diff) < 0.1) return null;
  const avg = (rightVol + leftVol) / 2;
  const diffPercent = Math.round(Math.abs(diff) / avg * 100);
  const side = diff > 0 ? "влево (левое меньше)" : "вправо (правое меньше)";
  return { diff: Math.abs(diff), diffPercent, side };
}
function calcGonadalProstaticIndex(rightVol, leftVol, prostateVol) {
  if (!rightVol || !leftVol || !prostateVol || prostateVol === 0) return null;
  const meanTestis = (rightVol + leftVol) / 2;
  const ratio = Math.round(meanTestis / prostateVol * 100) / 100;
  let assessment = "Соответствует норме";
  if (ratio < 0.8) assessment = "Относительная гипоплазия яичек";
  else if (ratio > 1.3) assessment = "Относительное увеличение яичек / малый объём простаты";
  return { meanTestis: Math.round(meanTestis * 100) / 100, prostate: prostateVol, ratio, assessment };
}
function recordToForm(record) {
  const f = {};
  const numericFields = [
    "right_testis_volume",
    "left_testis_volume",
    "right_epididymis_head",
    "left_epididymis_head",
    "right_spermatic_vein_diameter",
    "left_spermatic_vein_diameter",
    "valsalva_max_velocity_right",
    "valsalva_max_velocity_left",
    "prostate_volume",
    "penile_length",
    "penile_stretched_length",
    "hydrocele_volume_right",
    "hydrocele_volume_left",
    "bladder_volume",
    "residual_urine",
    "bladder_wall_thickness",
    "right_kidney_length",
    "left_kidney_length"
  ];
  const stringFields = [
    "right_testis_echostructure",
    "left_testis_echostructure",
    "right_epididymis_notes",
    "left_epididymis_notes",
    "prostate_echostructure",
    "prostate_parenchyma",
    "prostate_capsule",
    "right_inguinal_canal",
    "left_inguinal_canal",
    "right_kidney_notes",
    "left_kidney_notes",
    "conclusion",
    "notes"
  ];
  numericFields.forEach((k) => {
    if (record[k] != null) f[k] = String(record[k]);
  });
  stringFields.forEach((k) => {
    if (record[k]) f[k] = record[k];
  });
  if (record.right_varicocele_grade != null) f.right_varicocele_grade = String(record.right_varicocele_grade);
  if (record.left_varicocele_grade != null) f.left_varicocele_grade = String(record.left_varicocele_grade);
  f.valsalva_reflux_right = record.valsalva_reflux_right ?? false;
  f.valsalva_reflux_left = record.valsalva_reflux_left ?? false;
  f.right_hydrocele = record.right_hydrocele ?? false;
  f.left_hydrocele = record.left_hydrocele ?? false;
  return f;
}
const MeasurementInput = memo(({ label, field, unit = "мм", value, onValueChange }) => {
  const [localValue, setLocalValue] = useState(value);
  useEffect(() => {
    const normalizedLocal = localValue.replace(",", ".");
    if (normalizedLocal !== value) {
      setLocalValue(value);
    }
  }, [value]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
    /* @__PURE__ */ jsxs(Label, { className: "text-xs", children: [
      label,
      " (",
      unit,
      ")"
    ] }),
    /* @__PURE__ */ jsx(
      Input,
      {
        type: "text",
        inputMode: "decimal",
        enterKeyHint: "done",
        value: localValue,
        onChange: (e) => {
          const nextValue = e.target.value;
          if (nextValue === "" || /^\d*([.,]\d{0,2})?$/.test(nextValue)) {
            setLocalValue(nextValue);
            onValueChange(field, nextValue.replace(",", "."));
          }
        },
        placeholder: "—",
        className: "h-8 text-sm"
      }
    )
  ] });
});
function UltrasoundPanel() {
  const [patient, setPatient] = useState(null);
  const [examDate, setExamDate] = useState(/* @__PURE__ */ new Date());
  const [saving, setSaving] = useState(false);
  const [subTab, setSubTab] = useState("input");
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({});
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  useProtocolFragmentReceiver({ patientId: patient == null ? void 0 : patient.id, kind: "ultrasound" });
  useEffect(() => {
    if (!patient) return;
    setActiveContext({
      patientId: patient.id,
      patientName: patient.full_name,
      targetId: patient.id,
      kind: "ultrasound",
      url: window.location.pathname + window.location.search
    });
    return () => clearActiveContextIfMatches(patient.id);
  }, [patient == null ? void 0 : patient.id, patient == null ? void 0 : patient.full_name]);
  const numVal = (field) => form[field] ? parseFloat(form[field]) : void 0;
  const ageYears = patient ? calculateAge(new Date(patient.birth_date), examDate).years : 0;
  const usNorm = getUltrasoundNorm(ageYears);
  const rightTestisVol = numVal("right_testis_volume") ?? null;
  const leftTestisVol = numVal("left_testis_volume") ?? null;
  const prostateVol = numVal("prostate_volume") ?? null;
  const rightDeficit = calcVolumeDeficit(rightTestisVol, (usNorm == null ? void 0 : usNorm.rightTestisMl) ?? null);
  const leftDeficit = calcVolumeDeficit(leftTestisVol, (usNorm == null ? void 0 : usNorm.leftTestisMl) ?? null);
  const prostateDeficit = calcVolumeDeficit(prostateVol, (usNorm == null ? void 0 : usNorm.prostateMl) ?? null);
  const lateralization = calcLateralization(rightTestisVol, leftTestisVol);
  const gpi = calcGonadalProstaticIndex(rightTestisVol, leftTestisVol, prostateVol);
  const buildRow = () => ({
    patient_id: patient.id,
    exam_date: format(examDate, "yyyy-MM-dd"),
    right_testis_volume: rightTestisVol,
    left_testis_volume: leftTestisVol,
    right_testis_echostructure: form.right_testis_echostructure || null,
    left_testis_echostructure: form.left_testis_echostructure || null,
    right_epididymis_head: numVal("right_epididymis_head") ?? null,
    left_epididymis_head: numVal("left_epididymis_head") ?? null,
    right_epididymis_notes: form.right_epididymis_notes || null,
    left_epididymis_notes: form.left_epididymis_notes || null,
    right_spermatic_vein_diameter: numVal("right_spermatic_vein_diameter") ?? null,
    left_spermatic_vein_diameter: numVal("left_spermatic_vein_diameter") ?? null,
    right_varicocele_grade: form.right_varicocele_grade ? parseInt(form.right_varicocele_grade) : null,
    left_varicocele_grade: form.left_varicocele_grade ? parseInt(form.left_varicocele_grade) : null,
    valsalva_reflux_right: form.valsalva_reflux_right ?? false,
    valsalva_reflux_left: form.valsalva_reflux_left ?? false,
    valsalva_max_velocity_right: numVal("valsalva_max_velocity_right") ?? null,
    valsalva_max_velocity_left: numVal("valsalva_max_velocity_left") ?? null,
    prostate_volume: prostateVol,
    prostate_echostructure: form.prostate_echostructure || null,
    prostate_parenchyma: form.prostate_parenchyma ?? "не изменена",
    prostate_capsule: form.prostate_capsule ?? "не выражена",
    penile_length: numVal("penile_length") ?? null,
    penile_stretched_length: numVal("penile_stretched_length") ?? null,
    right_hydrocele: form.right_hydrocele ?? false,
    left_hydrocele: form.left_hydrocele ?? false,
    hydrocele_volume_right: numVal("hydrocele_volume_right") ?? null,
    hydrocele_volume_left: numVal("hydrocele_volume_left") ?? null,
    right_inguinal_canal: form.right_inguinal_canal || null,
    left_inguinal_canal: form.left_inguinal_canal || null,
    bladder_volume: numVal("bladder_volume") ?? null,
    residual_urine: numVal("residual_urine") ?? null,
    bladder_wall_thickness: numVal("bladder_wall_thickness") ?? null,
    right_kidney_length: numVal("right_kidney_length") ?? null,
    left_kidney_length: numVal("left_kidney_length") ?? null,
    right_kidney_notes: form.right_kidney_notes || null,
    left_kidney_notes: form.left_kidney_notes || null,
    conclusion: form.conclusion || null,
    notes: form.notes || null
  });
  const handleSave = async () => {
    if (!patient) {
      toast.error("Выберите пациента");
      return;
    }
    setSaving(true);
    try {
      const row = buildRow();
      if (editingId) {
        const { error } = await supabase.from("ultrasound_results").update(row).eq("id", editingId);
        if (error) throw error;
        toast.success("Протокол обновлён");
        setEditingId(null);
      } else {
        const { error } = await supabase.from("ultrasound_results").insert(row);
        if (error) throw error;
        toast.success("УЗИ сохранено");
      }
      setForm({});
      fetchHistory();
    } catch (err) {
      toast.error("Ошибка: " + err.message);
    } finally {
      setSaving(false);
    }
  };
  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    let query = supabase.from("ultrasound_results").select("*, patients!inner(full_name, birth_date)").order("exam_date", { ascending: false }).limit(100);
    if (patient) {
      query = query.eq("patient_id", patient.id);
    }
    const { data } = await query;
    setHistory(data || []);
    setHistLoading(false);
  }, [patient]);
  useEffect(() => {
    if (subTab === "protocols") fetchHistory();
  }, [subTab, patient, fetchHistory]);
  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("ultrasound_results").delete().eq("id", deleteId);
    if (error) toast.error("Ошибка");
    else {
      toast.success("Удалено");
      fetchHistory();
    }
    setDeleteId(null);
  };
  const handleEdit = (record) => {
    var _a, _b;
    const p = {
      id: record.patient_id,
      full_name: ((_a = record.patients) == null ? void 0 : _a.full_name) || "",
      birth_date: ((_b = record.patients) == null ? void 0 : _b.birth_date) || ""
    };
    setPatient(p);
    setExamDate(new Date(record.exam_date));
    setForm(recordToForm(record));
    setEditingId(record.id);
    setSubTab("input");
  };
  const handleNewProtocol = () => {
    setEditingId(null);
    setForm({});
    setExamDate(/* @__PURE__ */ new Date());
    setSubTab("input");
  };
  const filteredHistory = searchQuery.trim() ? history.filter(
    (u) => {
      var _a, _b;
      return (_b = (_a = u.patients) == null ? void 0 : _a.full_name) == null ? void 0 : _b.toLowerCase().includes(searchQuery.toLowerCase());
    }
  ) : history;
  const TestisVolumeDisplay = ({ vol, side }) => {
    if (!vol) return null;
    const deficit = side === "right" ? rightDeficit : leftDeficit;
    const normVal = side === "right" ? usNorm == null ? void 0 : usNorm.rightTestisMl : usNorm == null ? void 0 : usNorm.leftTestisMl;
    const isAbnormal = normVal && vol < normVal;
    return /* @__PURE__ */ jsxs("div", { className: cn("text-sm p-2 rounded space-y-1", isAbnormal ? "bg-destructive/10 text-destructive" : "bg-accent/50"), children: [
      /* @__PURE__ */ jsxs("div", { children: [
        "Объём: ",
        /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
          vol,
          " мл"
        ] }),
        normVal && /* @__PURE__ */ jsxs("span", { className: "text-xs ml-2", children: [
          "(норма ",
          normVal,
          " мл)"
        ] })
      ] }),
      deficit && /* @__PURE__ */ jsxs("div", { className: "text-xs font-medium text-destructive", children: [
        "Дефицит: ",
        deficit.deficit,
        " мл (",
        deficit.deficitPercent,
        "%)"
      ] })
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-2", children: /* @__PURE__ */ jsx(PatientSelect, { selectedPatient: patient, onSelect: setPatient }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Дата исследования" }),
        /* @__PURE__ */ jsxs(Popover, { children: [
          /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "w-full justify-start text-left text-sm", children: [
            /* @__PURE__ */ jsx(CalendarIcon, { className: "mr-1 h-3 w-3" }),
            format(examDate, "dd.MM.yyyy")
          ] }) }),
          /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: /* @__PURE__ */ jsx(Calendar, { mode: "single", selected: examDate, onSelect: (d) => d && setExamDate(d), className: "p-3 pointer-events-auto" }) })
        ] })
      ] })
    ] }),
    patient && /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        "Дата рождения:",
        " ",
        /* @__PURE__ */ jsxs(Popover, { children: [
          /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsx("button", { className: "font-medium text-foreground underline decoration-dotted underline-offset-2 hover:text-primary transition-colors cursor-pointer", children: format(new Date(patient.birth_date), "dd.MM.yyyy") }) }),
          /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: /* @__PURE__ */ jsx(
            Calendar,
            {
              mode: "single",
              selected: new Date(patient.birth_date),
              onSelect: async (d) => {
                if (!d) return;
                const newDate = format(d, "yyyy-MM-dd");
                const { error } = await supabase.from("patients").update({ birth_date: newDate }).eq("id", patient.id);
                if (error) {
                  toast.error("Не удалось обновить дату рождения");
                } else {
                  setPatient({ ...patient, birth_date: newDate });
                  toast.success("Дата рождения обновлена");
                }
              },
              captionLayout: "dropdown-buttons",
              fromYear: 1920,
              toYear: (/* @__PURE__ */ new Date()).getFullYear(),
              className: "p-3 pointer-events-auto"
            }
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("span", { children: "·" }),
      /* @__PURE__ */ jsxs("span", { children: [
        "Возраст: ",
        /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: calculateAge(new Date(patient.birth_date), examDate).text })
      ] }),
      usNorm && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("span", { children: "·" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "Норма: ПЯ ",
          usNorm.rightTestisMl,
          " мл, ЛЯ ",
          usNorm.leftTestisMl,
          " мл, простата ",
          usNorm.prostateMl,
          " мл"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { value: subTab, onValueChange: setSubTab, children: [
      /* @__PURE__ */ jsxs(TabsList, { children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "input", children: editingId ? "Редактирование" : "Ввод данных" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "protocols", children: "Протоколы" })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "input", children: [
        editingId && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4 p-3 rounded-lg bg-accent/50 border border-accent", children: [
          /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium", children: [
            "Редактирование протокола от ",
            format(examDate, "dd.MM.yyyy")
          ] }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", className: "ml-auto", onClick: handleNewProtocol, children: [
            /* @__PURE__ */ jsx(Plus, { className: "h-3 w-3 mr-1" }),
            " Новый протокол"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Яичко правое" }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsx(MeasurementInput, { label: "Объём", field: "right_testis_volume", unit: "мл", value: form.right_testis_volume || "", onValueChange: update }),
              /* @__PURE__ */ jsx(TestisVolumeDisplay, { vol: rightTestisVol, side: "right" }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Эхоструктура" }),
                /* @__PURE__ */ jsxs(Select, { value: form.right_testis_echostructure || "", onValueChange: (v) => update("right_testis_echostructure", v), children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8 text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "—" }) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: ECHOSTRUCTURE_OPTIONS.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o.value, children: o.label }, o.value)) })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Яичко левое" }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsx(MeasurementInput, { label: "Объём", field: "left_testis_volume", unit: "мл", value: form.left_testis_volume || "", onValueChange: update }),
              /* @__PURE__ */ jsx(TestisVolumeDisplay, { vol: leftTestisVol, side: "left" }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Эхоструктура" }),
                /* @__PURE__ */ jsxs(Select, { value: form.left_testis_echostructure || "", onValueChange: (v) => update("left_testis_echostructure", v), children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8 text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "—" }) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: ECHOSTRUCTURE_OPTIONS.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o.value, children: o.label }, o.value)) })
                ] })
              ] })
            ] })
          ] }),
          (lateralization || gpi) && /* @__PURE__ */ jsxs(Card, { className: "lg:col-span-2", children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Расчётные индексы" }) }),
            /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [
              lateralization && /* @__PURE__ */ jsxs("div", { className: cn("p-3 rounded-lg", lateralization.diffPercent > 20 ? "bg-destructive/10" : "bg-accent/50"), children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Латерализация" }),
                /* @__PURE__ */ jsxs("p", { className: "font-bold text-sm", children: [
                  "Δ = ",
                  lateralization.diff,
                  " мл (",
                  lateralization.diffPercent,
                  "%)"
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs", children: [
                  "Смещение ",
                  lateralization.side
                ] })
              ] }),
              gpi && /* @__PURE__ */ jsxs("div", { className: cn("p-3 rounded-lg", gpi.ratio < 0.8 || gpi.ratio > 1.3 ? "bg-destructive/10 text-destructive" : "bg-accent/50"), children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Гонадо-простатический индекс" }),
                /* @__PURE__ */ jsxs("p", { className: "font-bold text-sm", children: [
                  gpi.meanTestis,
                  " / ",
                  gpi.prostate,
                  " = ",
                  gpi.ratio
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Среднее яичко / Простата" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs mt-1", children: gpi.assessment })
              ] }),
              rightTestisVol && leftTestisVol && /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-accent/50", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Суммарный объём яичек" }),
                /* @__PURE__ */ jsxs("p", { className: "font-bold text-sm", children: [
                  Math.round((rightTestisVol + leftTestisVol) * 100) / 100,
                  " мл"
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  rightTestisVol,
                  " (пр.) + ",
                  leftTestisVol,
                  " (лев.)"
                ] })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Придатки яичек" }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsx(MeasurementInput, { label: "Головка правого (объём)", field: "right_epididymis_head", unit: "мм", value: form.right_epididymis_head || "", onValueChange: update }),
                /* @__PURE__ */ jsx(MeasurementInput, { label: "Головка левого (объём)", field: "left_epididymis_head", unit: "мм", value: form.left_epididymis_head || "", onValueChange: update })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Примечание (правый)" }),
                  /* @__PURE__ */ jsx(Input, { value: form.right_epididymis_notes || "", onChange: (e) => update("right_epididymis_notes", e.target.value), className: "h-8 text-sm", placeholder: "—" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Примечание (левый)" }),
                  /* @__PURE__ */ jsx(Input, { value: form.left_epididymis_notes || "", onChange: (e) => update("left_epididymis_notes", e.target.value), className: "h-8 text-sm", placeholder: "—" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Семенной канатик / Варикоцеле" }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsx(MeasurementInput, { label: "Вена справа ∅", field: "right_spermatic_vein_diameter", value: form.right_spermatic_vein_diameter || "", onValueChange: update }),
                /* @__PURE__ */ jsx(MeasurementInput, { label: "Вена слева ∅", field: "left_spermatic_vein_diameter", value: form.left_spermatic_vein_diameter || "", onValueChange: update })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Варикоцеле справа" }),
                  /* @__PURE__ */ jsxs(Select, { value: form.right_varicocele_grade || "", onValueChange: (v) => update("right_varicocele_grade", v), children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8 text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "—" }) }),
                    /* @__PURE__ */ jsx(SelectContent, { children: VARICOCELE_GRADES.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o.value, children: o.label }, o.value)) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Варикоцеле слева" }),
                  /* @__PURE__ */ jsxs(Select, { value: form.left_varicocele_grade || "", onValueChange: (v) => update("left_varicocele_grade", v), children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8 text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "—" }) }),
                    /* @__PURE__ */ jsx(SelectContent, { children: VARICOCELE_GRADES.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o.value, children: o.label }, o.value)) })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Switch, { checked: form.valsalva_reflux_right || false, onCheckedChange: (v) => update("valsalva_reflux_right", v) }),
                  /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Рефлюкс при Вальсальве (пр.)" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Switch, { checked: form.valsalva_reflux_left || false, onCheckedChange: (v) => update("valsalva_reflux_left", v) }),
                  /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Рефлюкс при Вальсальве (лев.)" })
                ] })
              ] }),
              (form.valsalva_reflux_right || form.valsalva_reflux_left) && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                form.valsalva_reflux_right && /* @__PURE__ */ jsx(MeasurementInput, { label: "Макс. скорость рефлюкса (пр.)", field: "valsalva_max_velocity_right", unit: "см/с", value: form.valsalva_max_velocity_right || "", onValueChange: update }),
                form.valsalva_reflux_left && /* @__PURE__ */ jsx(MeasurementInput, { label: "Макс. скорость рефлюкса (лев.)", field: "valsalva_max_velocity_left", unit: "см/с", value: form.valsalva_max_velocity_left || "", onValueChange: update })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Предстательная железа" }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsx(MeasurementInput, { label: "Объём", field: "prostate_volume", unit: "мл", value: form.prostate_volume || "", onValueChange: update }),
              prostateVol != null && usNorm && /* @__PURE__ */ jsxs("div", { className: cn("text-sm p-2 rounded", prostateVol < usNorm.prostateMl ? "bg-destructive/10 text-destructive" : "bg-accent/50"), children: [
                "Объём: ",
                /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
                  prostateVol,
                  " мл"
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs ml-2", children: [
                  "(норма ",
                  usNorm.prostateMl,
                  " мл)"
                ] }),
                prostateDeficit && /* @__PURE__ */ jsxs("div", { className: "text-xs font-medium text-destructive", children: [
                  "Дефицит: ",
                  prostateDeficit.deficit,
                  " мл (",
                  prostateDeficit.deficitPercent,
                  "%)"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Эхоструктура" }),
                /* @__PURE__ */ jsxs(Select, { value: form.prostate_echostructure || "", onValueChange: (v) => update("prostate_echostructure", v), children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8 text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "—" }) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: ECHOSTRUCTURE_OPTIONS.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o.value, children: o.label }, o.value)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Паренхима" }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      value: form.prostate_parenchyma ?? "не изменена",
                      onChange: (e) => update("prostate_parenchyma", e.target.value),
                      placeholder: "не изменена",
                      className: "h-8 text-sm"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Капсула" }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      value: form.prostate_capsule ?? "не выражена",
                      onChange: (e) => update("prostate_capsule", e.target.value),
                      placeholder: "не выражена",
                      className: "h-8 text-sm"
                    }
                  )
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Половой член" }) }),
            /* @__PURE__ */ jsx(CardContent, { className: "space-y-3", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsx(MeasurementInput, { label: "Длина", field: "penile_length", value: form.penile_length || "", onValueChange: update }),
              /* @__PURE__ */ jsx(MeasurementInput, { label: "Растянутая длина", field: "penile_stretched_length", value: form.penile_stretched_length || "", onValueChange: update })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Гидроцеле" }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Switch, { checked: form.right_hydrocele || false, onCheckedChange: (v) => update("right_hydrocele", v) }),
                  /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Справа" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Switch, { checked: form.left_hydrocele || false, onCheckedChange: (v) => update("left_hydrocele", v) }),
                  /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Слева" })
                ] })
              ] }),
              (form.right_hydrocele || form.left_hydrocele) && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                form.right_hydrocele && /* @__PURE__ */ jsx(MeasurementInput, { label: "Объём (пр.)", field: "hydrocele_volume_right", unit: "мл", value: form.hydrocele_volume_right || "", onValueChange: update }),
                form.left_hydrocele && /* @__PURE__ */ jsx(MeasurementInput, { label: "Объём (лев.)", field: "hydrocele_volume_left", unit: "мл", value: form.hydrocele_volume_left || "", onValueChange: update })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Паховые каналы" }) }),
            /* @__PURE__ */ jsx(CardContent, { className: "space-y-3", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Правый" }),
                /* @__PURE__ */ jsx(Input, { value: form.right_inguinal_canal || "", onChange: (e) => update("right_inguinal_canal", e.target.value), className: "h-8 text-sm", placeholder: "Без особенностей" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Левый" }),
                /* @__PURE__ */ jsx(Input, { value: form.left_inguinal_canal || "", onChange: (e) => update("left_inguinal_canal", e.target.value), className: "h-8 text-sm", placeholder: "Без особенностей" })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Мочевой пузырь / Почки" }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
                /* @__PURE__ */ jsx(MeasurementInput, { label: "Объём пузыря", field: "bladder_volume", unit: "мл", value: form.bladder_volume || "", onValueChange: update }),
                /* @__PURE__ */ jsx(MeasurementInput, { label: "Остаточная моча", field: "residual_urine", unit: "мл", value: form.residual_urine || "", onValueChange: update }),
                /* @__PURE__ */ jsx(MeasurementInput, { label: "Толщина стенки", field: "bladder_wall_thickness", value: form.bladder_wall_thickness || "", onValueChange: update })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsx(MeasurementInput, { label: "Почка правая (длина)", field: "right_kidney_length", value: form.right_kidney_length || "", onValueChange: update }),
                /* @__PURE__ */ jsx(MeasurementInput, { label: "Почка левая (длина)", field: "left_kidney_length", value: form.left_kidney_length || "", onValueChange: update })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { className: "lg:col-span-2", children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Заключение" }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
              /* @__PURE__ */ jsx(Textarea, { value: form.conclusion || "", onChange: (e) => update("conclusion", e.target.value), placeholder: "Заключение УЗИ...", rows: 3 }),
              /* @__PURE__ */ jsx(Textarea, { value: form.notes || "", onChange: (e) => update("notes", e.target.value), placeholder: "Дополнительные примечания...", rows: 2 })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: handleSave, disabled: saving || !patient, className: "w-full mt-4", children: [
          /* @__PURE__ */ jsx(Save, { className: "h-4 w-4 mr-2" }),
          saving ? "Сохранение..." : editingId ? "Обновить протокол" : "Сохранить результаты УЗИ"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "protocols", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "Поиск по фамилии пациента...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-9"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(Button, { onClick: handleNewProtocol, children: [
            /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
            " Новый"
          ] })
        ] }),
        !patient && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-3", children: "Показаны все протоколы. Выберите пациента для фильтрации." }),
        histLoading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-8", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) }) : filteredHistory.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-8 text-center text-muted-foreground", children: "Нет сохранённых протоколов УЗИ" }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: filteredHistory.map((u) => {
          var _a;
          const hLat = calcLateralization(u.right_testis_volume, u.left_testis_volume);
          const hGpi = calcGonadalProstaticIndex(u.right_testis_volume, u.left_testis_volume, u.prostate_volume);
          return /* @__PURE__ */ jsx(Card, { className: cn(editingId === u.id && "ring-2 ring-primary"), children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: ((_a = u.patients) == null ? void 0 : _a.full_name) || "—" }),
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-sm ml-3", children: format(new Date(u.exam_date), "dd.MM.yyyy") })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleEdit(u), title: "Редактировать", children: /* @__PURE__ */ jsx(Pencil, { className: "h-3 w-3" }) }),
                /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: () => setDeleteId(u.id), title: "Удалить", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3 text-destructive" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2 text-sm", children: [
              u.right_testis_volume && /* @__PURE__ */ jsxs("div", { className: "p-2 bg-secondary/30 rounded", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "Яичко (пр.)" }),
                /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                  u.right_testis_volume,
                  " мл"
                ] })
              ] }),
              u.left_testis_volume && /* @__PURE__ */ jsxs("div", { className: "p-2 bg-secondary/30 rounded", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "Яичко (лев.)" }),
                /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                  u.left_testis_volume,
                  " мл"
                ] })
              ] }),
              u.prostate_volume && /* @__PURE__ */ jsxs("div", { className: "p-2 bg-secondary/30 rounded", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "Простата" }),
                /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                  u.prostate_volume,
                  " мл"
                ] })
              ] }),
              hGpi && /* @__PURE__ */ jsxs("div", { className: cn("p-2 rounded", hGpi.ratio < 0.8 || hGpi.ratio > 1.3 ? "bg-amber-100 dark:bg-amber-950" : "bg-secondary/30"), children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "ГПИ" }),
                /* @__PURE__ */ jsx("div", { className: "font-medium", children: hGpi.ratio })
              ] }),
              hLat && /* @__PURE__ */ jsxs("div", { className: cn("p-2 rounded", hLat.diffPercent > 20 ? "bg-destructive/10" : "bg-secondary/30"), children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "Латерализация" }),
                /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                  hLat.diffPercent,
                  "% ",
                  hLat.side
                ] })
              ] }),
              u.penile_length && /* @__PURE__ */ jsxs("div", { className: "p-2 bg-secondary/30 rounded", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "Длина п/ч" }),
                /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                  u.penile_length,
                  " мм"
                ] })
              ] }),
              (u.valsalva_max_velocity_left || u.valsalva_max_velocity_right) && /* @__PURE__ */ jsxs("div", { className: "p-2 bg-secondary/30 rounded", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "V макс. Вальсальвы" }),
                /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                  u.valsalva_max_velocity_right && `Пр: ${u.valsalva_max_velocity_right} `,
                  u.valsalva_max_velocity_left && `Лев: ${u.valsalva_max_velocity_left}`,
                  " см/с"
                ] })
              ] }),
              u.left_varicocele_grade != null && u.left_varicocele_grade > 0 && /* @__PURE__ */ jsxs("div", { className: "p-2 bg-amber-50 dark:bg-amber-950 rounded border border-amber-200 dark:border-amber-800", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "Варикоцеле (лев.)" }),
                /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                  "Степень ",
                  u.left_varicocele_grade
                ] })
              ] })
            ] }),
            u.conclusion && /* @__PURE__ */ jsxs("p", { className: "text-sm mt-2 text-muted-foreground", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: "Заключение:" }),
              " ",
              u.conclusion
            ] })
          ] }) }, u.id);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteId, onOpenChange: (o) => !o && setDeleteId(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Удалить протокол УЗИ?" }),
        /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Это действие необратимо." })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Отмена" }),
        /* @__PURE__ */ jsx(AlertDialogAction, { onClick: handleDelete, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: "Удалить" })
      ] })
    ] }) })
  ] });
}
const AdminPrescriptions = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSection = searchParams.get("section") === "examinations" ? "examinations" : "prescriptions";
  const [section, setSection] = useState(initialSection);
  const [activeTab, setActiveTab] = useState("new");
  const [examTab, setExamTab] = useState("anthropometry");
  useState(null);
  const [repeatPrescriptionId, setRepeatPrescriptionId] = useState(null);
  const [repeatWithoutPatient, setRepeatWithoutPatient] = useState(false);
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/prescriptions" } });
    }
  }, [user, isAdmin, loading, navigate]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  if (!user || !isAdmin) return null;
  const handleRepeat = (prescriptionId) => {
    setRepeatPrescriptionId(prescriptionId);
    setRepeatWithoutPatient(false);
    setActiveTab("new");
  };
  const handleRepeatForOther = (prescriptionId) => {
    setRepeatPrescriptionId(prescriptionId);
    setRepeatWithoutPatient(true);
    setActiveTab("new");
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/admin",
        className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors",
        children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
          "Назад к панели администратора"
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground mb-2", children: "Медицинские инструменты" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Рецепты, обследования, анализы" })
      ] }),
      section === "prescriptions" && /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(SubstanceReference, {}),
        /* @__PURE__ */ jsx(DrugReference, {})
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-6", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: section === "prescriptions" ? "default" : "outline",
          onClick: () => setSection("prescriptions"),
          className: "gap-2",
          children: [
            /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
            "Рецепты"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: section === "examinations" ? "default" : "outline",
          onClick: () => setSection("examinations"),
          className: "gap-2",
          children: [
            /* @__PURE__ */ jsx(Stethoscope, { className: "h-4 w-4" }),
            "Обследования"
          ]
        }
      )
    ] }),
    section === "prescriptions" && /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "mb-6 flex-wrap h-auto gap-1", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "new", children: "Рецепт" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "extemporaneous", children: "Экстемпоральный" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "dosage", children: "Калькулятор дозы" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "history", children: "История рецептов" })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "new", children: /* @__PURE__ */ jsx(
        PrescriptionForm,
        {
          repeatPrescriptionId,
          repeatWithoutPatient,
          onSaved: () => {
            setRepeatPrescriptionId(null);
            setRepeatWithoutPatient(false);
            setActiveTab("history");
          }
        }
      ) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "extemporaneous", children: /* @__PURE__ */ jsx(ExtemporaneousForm, { onSaved: () => setActiveTab("history") }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "dosage", children: /* @__PURE__ */ jsx(DosageCalculator, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "history", children: /* @__PURE__ */ jsx(PrescriptionHistory, { onRepeat: handleRepeat, onRepeatForOther: handleRepeatForOther }) })
    ] }),
    section === "examinations" && /* @__PURE__ */ jsxs(Tabs, { value: examTab, onValueChange: setExamTab, children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "mb-6 flex-wrap h-auto gap-1", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "anthropometry", children: "Антропометрия" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "labs", children: "Анализы" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "ultrasound", children: "УЗИ" })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "anthropometry", children: /* @__PURE__ */ jsx(AnthropometryErrorBoundary, { children: /* @__PURE__ */ jsx(AnthropometryCalculator, {}) }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "labs", children: /* @__PURE__ */ jsx(LabResultsPanel, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "ultrasound", children: /* @__PURE__ */ jsx(UltrasoundPanel, {}) })
    ] })
  ] }) });
};
export {
  AdminPrescriptions as default
};
