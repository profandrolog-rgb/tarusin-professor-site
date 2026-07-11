import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef } from "react";
import { e as useToast, C as Card, c as CardHeader, d as CardTitle, a as CardContent, B as Button, r as Checkbox, s as supabase } from "../main.mjs";
import { P as Progress } from "./progress-Y5q1JT93.js";
import { FileText, Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function PdfBatchUpload({ patientId, consultationCaseId, onComplete }) {
  const { toast } = useToast();
  const [files, setFiles] = useState([]);
  const [parseEnabled, setParseEnabled] = useState(true);
  const [running, setRunning] = useState(false);
  const inputRef = useRef(null);
  const addFiles = (list) => {
    if (!list) return;
    const arr = Array.from(list).filter((f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name));
    setFiles((prev) => [...prev, ...arr.map((f) => ({ file: f, progress: 0, status: "pending" }))]);
  };
  const run = async () => {
    if (!files.length) return;
    if (!patientId && !consultationCaseId) {
      toast({ title: "Не указан пациент/консультация", variant: "destructive" });
      return;
    }
    setRunning(true);
    const updated = [...files];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === "done") continue;
      updated[i] = { ...updated[i], status: "uploading", progress: 20 };
      setFiles([...updated]);
      try {
        const dataUrl = await fileToDataUrl(updated[i].file);
        if (!parseEnabled) {
          updated[i] = { ...updated[i], status: "done", progress: 100, message: "Загружено (без парсинга)" };
          setFiles([...updated]);
          continue;
        }
        updated[i] = { ...updated[i], status: "parsing", progress: 55 };
        setFiles([...updated]);
        const { data, error } = await supabase.functions.invoke("parse-medical-pdf", {
          body: {
            file_data: dataUrl,
            file_name: updated[i].file.name,
            patient_id: patientId,
            consultation_case_id: consultationCaseId
          }
        });
        if (error) throw error;
        if (data == null ? void 0 : data.error) throw new Error(data.error);
        updated[i] = {
          ...updated[i],
          status: "done",
          progress: 100,
          result: data
        };
      } catch (err) {
        updated[i] = { ...updated[i], status: "error", progress: 100, message: (err == null ? void 0 : err.message) || "Ошибка" };
      }
      setFiles([...updated]);
    }
    setRunning(false);
    onComplete == null ? void 0 : onComplete(updated);
    const totalLabs = updated.reduce((a, f) => {
      var _a;
      return a + (((_a = f.result) == null ? void 0 : _a.inserted_labs_count) || 0);
    }, 0);
    const totalDx = updated.reduce((a, f) => {
      var _a;
      return a + (((_a = f.result) == null ? void 0 : _a.inserted_diagnoses_count) || 0);
    }, 0);
    toast({
      title: "Обработка завершена",
      description: `Показателей: ${totalLabs}, диагнозов: ${totalDx}`
    });
  };
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
      "Загрузить анализы (PDF)"
    ] }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: inputRef,
            type: "file",
            multiple: true,
            accept: "application/pdf,.pdf",
            className: "hidden",
            onChange: (e) => addFiles(e.target.files)
          }
        ),
        /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
          var _a;
          return (_a = inputRef.current) == null ? void 0 : _a.click();
        }, disabled: running, children: [
          /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 mr-2" }),
          "Выбрать PDF"
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: run, disabled: !files.length || running, children: [
          running ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : null,
          "Обработать (",
          files.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm ml-auto", children: [
          /* @__PURE__ */ jsx(
            Checkbox,
            {
              checked: parseEnabled,
              onCheckedChange: (v) => setParseEnabled(!!v),
              disabled: running
            }
          ),
          "Парсить PDF в заключение"
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Можно выбирать несколько файлов из любого расположения (компьютер, флешка, сетевая папка)." }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: files.map((f, i) => {
        var _a;
        return /* @__PURE__ */ jsxs("div", { className: "border rounded p-2 space-y-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-primary shrink-0" }),
            /* @__PURE__ */ jsx("span", { className: "truncate flex-1", children: f.file.name }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
              (f.file.size / 1024).toFixed(0),
              " KB"
            ] }),
            f.status === "done" && /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-green-600" }),
            f.status === "error" && /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-destructive" })
          ] }),
          /* @__PURE__ */ jsx(Progress, { value: f.progress, className: "h-1" }),
          f.status === "error" && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: f.message }),
          f.status === "done" && f.result && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "Тип: ",
            f.result.document_type || "—",
            " · Показателей: ",
            f.result.inserted_labs_count ?? 0,
            " · ",
            "Диагнозов: ",
            f.result.inserted_diagnoses_count ?? 0,
            f.result.queued_unknown_count ? ` · На проверку: ${f.result.queued_unknown_count}` : ""
          ] }),
          f.status === "done" && ((_a = f.result) == null ? void 0 : _a.conclusion_text) && /* @__PURE__ */ jsxs("details", { className: "text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsx("summary", { className: "cursor-pointer", children: "Заключение из документа" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 whitespace-pre-wrap", children: f.result.conclusion_text })
          ] })
        ] }, i);
      }) })
    ] })
  ] });
}
export {
  PdfBatchUpload as P
};
