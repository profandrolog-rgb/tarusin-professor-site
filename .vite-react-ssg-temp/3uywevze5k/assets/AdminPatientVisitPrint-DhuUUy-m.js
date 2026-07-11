import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, FileDown, Printer } from "lucide-react";
import { e as useToast, s as supabase, B as Button } from "../main.mjs";
import { P as ProtocolPrintLayout } from "./ProtocolPrintLayout-CGOJZTTp.js";
import { e as exportNodeToPdf } from "./exportPdf-BAJanap8.js";
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
import "react-helmet-async";
import "date-fns";
import "date-fns/locale";
import "./protocolTypes-BWCSK0Md.js";
import "jspdf";
import "html2canvas";
function AdminPatientVisitPrint() {
  const { id } = useParams();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const printRef = useRef(null);
  const { toast } = useToast();
  useEffect(() => {
    if (!id) return;
    supabase.from("patient_visits").select("*, patient:patients(full_name, birth_date, history_number)").eq("id", id).maybeSingle().then(({ data }) => {
      setVisit(data);
      setLoading(false);
    });
  }, [id]);
  const handlePdf = async () => {
    var _a, _b;
    if (!printRef.current) return;
    setPdfBusy(true);
    try {
      const name = ((_b = (_a = visit == null ? void 0 : visit.patient) == null ? void 0 : _a.full_name) == null ? void 0 : _b.replace(/\s+/g, "_")) || "protocol";
      const date = (visit == null ? void 0 : visit.visit_date) ? String(visit.visit_date).slice(0, 10) : "";
      await exportNodeToPdf(printRef.current, `${name}_${date}.pdf`);
    } catch (e) {
      toast({ title: "Не удалось создать PDF", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setPdfBusy(false);
    }
  };
  if (loading) return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin" }) });
  if (!visit) return /* @__PURE__ */ jsx("div", { className: "p-8 text-center", children: "Визит не найден" });
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-muted/30 p-4 md:p-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "no-print max-w-5xl mx-auto flex justify-between mb-4", children: [
      /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: `/admin/visits/${id}`, children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }),
        " Назад"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: handlePdf, disabled: pdfBusy, children: [
          pdfBusy ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 mr-1 animate-spin" }) : /* @__PURE__ */ jsx(FileDown, { className: "h-4 w-4 mr-1" }),
          "Скачать PDF"
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: () => window.print(), children: [
          /* @__PURE__ */ jsx(Printer, { className: "h-4 w-4 mr-1" }),
          " Печать"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { ref: printRef, className: "max-w-5xl mx-auto bg-white shadow-md", children: /* @__PURE__ */ jsx(ProtocolPrintLayout, { visit }) })
  ] });
}
export {
  AdminPatientVisitPrint as default
};
