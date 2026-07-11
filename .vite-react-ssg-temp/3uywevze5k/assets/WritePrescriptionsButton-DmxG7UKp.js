import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { B as Button } from "../main.mjs";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { R as RxItemsPreviewDialog } from "./RxItemsPreviewDialog-DH8JlDo_.js";
import { e as pushPendingRxItems } from "./protocolBridge-4TuhSmsW.js";
const RX_CATEGORIES = /* @__PURE__ */ new Set([
  "iv_drip",
  "iv_bolus",
  "im",
  "sc",
  "oral_rx",
  "rectal",
  "topical",
  "nasal",
  "sublingual"
]);
function isRxCategory(c) {
  return RX_CATEGORIES.has(c);
}
function planItemToRxItem(it) {
  const dose = it.dose != null ? `${it.dose}${it.dose_unit ? " " + it.dose_unit : ""}`.trim() : "";
  const duration = it.duration_days ? `${it.duration_days} дн.` : "";
  return {
    medication_ru_name: it.name_snapshot,
    medication_latin_name: it.inn_snapshot || it.name_snapshot,
    dosage_form: it.form_snapshot || "",
    dose,
    quantity: 1,
    frequency: it.frequency || "",
    duration,
    signa: it.notes ?? null
  };
}
function planItemsToRxItems(items) {
  return items.filter((i) => isRxCategory(i.section_category)).map(planItemToRxItem);
}
const newId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
function WritePrescriptionsButton({
  items,
  patientId,
  patientName,
  className,
  variant = "outline",
  size = "default"
}) {
  const [open, setOpen] = useState(false);
  const [editable, setEditable] = useState([]);
  const rxCount = items.filter((i) => isRxCategory(i.section_category)).length;
  const handleClick = () => {
    if (rxCount === 0) {
      toast.info("В назначениях нет аптечных форм для выписки рецептов", {
        description: "БАДы, пептиды, процедуры и физиотерапия выписке на бланке не подлежат."
      });
      return;
    }
    const parsed = planItemsToRxItems(items);
    setEditable(parsed.map((p) => ({ ...p, _id: newId(), _selected: true })));
    setOpen(true);
  };
  const handleConfirm = (selected) => {
    if (selected.length === 0) return;
    pushPendingRxItems(selected, patientId ?? void 0);
    setOpen(false);
    const url = `/admin/prescriptions${patientId ? `?patientId=${patientId}` : ""}`;
    window.open(url, "_blank", "noopener");
    toast.success(
      `${selected.length} бланк(ов) отправлено в выписку${patientName ? ` — ${patientName}` : ""}`,
      { description: "Откройте вкладку «Рецепты», подтвердите и печатайте по очереди." }
    );
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      Button,
      {
        type: "button",
        variant,
        size,
        onClick: handleClick,
        className,
        disabled: items.length === 0,
        children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 mr-2" }),
          "Выписать рецепты",
          rxCount > 0 ? ` (${rxCount})` : ""
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      RxItemsPreviewDialog,
      {
        open,
        onOpenChange: setOpen,
        items: editable,
        onItemsChange: setEditable,
        patientName: patientName ?? void 0,
        onConfirm: handleConfirm
      }
    )
  ] });
}
export {
  WritePrescriptionsButton as W
};
