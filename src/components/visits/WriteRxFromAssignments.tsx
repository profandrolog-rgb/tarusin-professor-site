import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { pushPendingRxItems, type ParsedRxItem } from "@/lib/protocolBridge";
import { RxItemsPreviewDialog, type EditableRxItem } from "@/components/cabinet/RxItemsPreviewDialog";
import { splitAssignmentLine } from "@/lib/prescriptions/normalizeRx";

interface Props {
  treatments: string[];
  patientId?: string | null;
  patientName?: string | null;
}

// Эвристика: исключаем БАДы, пептиды, процедуры, физиотерапию, гомеопатию,
// диету, режим — всё, что не выписывается на бланке 107-1/у.
const NON_RX_PATTERNS = [
  /бад\b/i, /добавк/i, /пептид/i, /процедур/i, /физиотерап/i,
  /массаж/i, /магнит/i, /узт\b/i, /электрофорез/i, /дарсонвал/i,
  /лазер/i, /ванн/i, /душ\b/i, /грязе/i,
  /диет/i, /режим/i, /пища/i, /гомеопат/i,
  /консультац/i, /осмотр/i, /контроль/i,
];

function isRxLine(s: string): boolean {
  const txt = s.trim();
  if (!txt) return false;
  return !NON_RX_PATTERNS.some((re) => re.test(txt));
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function WriteRxFromAssignments({ treatments, patientId, patientName }: Props) {
  const [open, setOpen] = useState(false);
  const [editable, setEditable] = useState<EditableRxItem[]>([]);
  const candidates = useMemo(() => treatments.filter(isRxLine), [treatments]);

  const openDialog = () => {
    if (candidates.length === 0) {
      toast.info("В назначениях нет препаратов в аптечной форме", {
        description: "БАДы, пептиды, физиотерапия и режим выписке на бланке не подлежат.",
      });
      return;
    }
    setEditable(
      candidates.map((line) => {
        const { name, raw_text } = splitAssignmentLine(line);
        return {
          _id: newId(),
          _selected: true,
          _needsLookup: true,
          _rawText: raw_text,
          medication_ru_name: name,
          medication_latin_name: "",
          dosage_form: "",
          dose: "",
          quantity: 1,
          frequency: "",
          duration: "",
          signa: null,
        } as EditableRxItem;
      }),
    );
    setOpen(true);
  };

  const confirm = (selected: ParsedRxItem[]) => {
    if (selected.length === 0) {
      toast.error("Не выбрано ни одного препарата");
      return;
    }
    pushPendingRxItems(selected, patientId ?? undefined);
    setOpen(false);
    const url = `/admin/prescriptions${patientId ? `?patientId=${patientId}` : ""}`;
    window.open(url, "_blank", "noopener");
    toast.success(
      `${selected.length} бланк(ов) отправлено в выписку${patientName ? ` — ${patientName}` : ""}`,
      { description: "Откройте вкладку «Рецепты», уточните дозы и печатайте." },
    );
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={openDialog}>
        <FileText className="h-4 w-4 mr-2" />
        Выписать рецепты{candidates.length > 0 ? ` (${candidates.length})` : ""}
      </Button>

      <RxItemsPreviewDialog
        open={open}
        onOpenChange={setOpen}
        items={editable}
        onItemsChange={setEditable}
        patientName={patientName ?? undefined}
        onConfirm={confirm}
      />
    </>
  );
}
