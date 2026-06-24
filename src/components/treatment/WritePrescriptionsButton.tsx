import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { RxItemsPreviewDialog, type EditableRxItem } from "@/components/cabinet/RxItemsPreviewDialog";
import { planItemsToRxItems, isRxCategory, type PlanItemLike } from "@/lib/treatment/planToRx";
import { pushPendingRxItems, type ParsedRxItem } from "@/lib/protocolBridge";

interface Props {
  items: PlanItemLike[];
  patientId?: string | null;
  patientName?: string | null;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

/**
 * Кнопка «Выписать рецепты» — берёт назначения с аптечными формами,
 * показывает диалог подтверждения, кладёт их в очередь Rx и
 * открывает страницу выписки рецептов, где каждый препарат превращается
 * в отдельный бланк 107-1/у с подтверждением и печатью по очереди.
 */
export function WritePrescriptionsButton({
  items,
  patientId,
  patientName,
  className,
  variant = "outline",
  size = "default",
}: Props) {
  const [open, setOpen] = useState(false);
  const [editable, setEditable] = useState<EditableRxItem[]>([]);

  const rxCount = items.filter((i) => isRxCategory(i.section_category)).length;

  const handleClick = () => {
    if (rxCount === 0) {
      toast.info("В назначениях нет аптечных форм для выписки рецептов", {
        description: "БАДы, пептиды, процедуры и физиотерапия выписке на бланке не подлежат.",
      });
      return;
    }
    const parsed = planItemsToRxItems(items);
    setEditable(parsed.map((p) => ({ ...p, _id: newId(), _selected: true })));
    setOpen(true);
  };

  const handleConfirm = (selected: ParsedRxItem[]) => {
    if (selected.length === 0) return;
    pushPendingRxItems(selected, patientId ?? undefined);
    setOpen(false);
    const url = `/admin/prescriptions${patientId ? `?patientId=${patientId}` : ""}`;
    window.open(url, "_blank", "noopener");
    toast.success(
      `${selected.length} бланк(ов) отправлено в выписку${patientName ? ` — ${patientName}` : ""}`,
      { description: "Откройте вкладку «Рецепты», подтвердите и печатайте по очереди." },
    );
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
        disabled={items.length === 0}
      >
        <FileText className="w-4 h-4 mr-2" />
        Выписать рецепты{rxCount > 0 ? ` (${rxCount})` : ""}
      </Button>

      <RxItemsPreviewDialog
        open={open}
        onOpenChange={setOpen}
        items={editable}
        onItemsChange={setEditable}
        patientName={patientName ?? undefined}
        onConfirm={handleConfirm}
      />
    </>
  );
}
