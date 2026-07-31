import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { NotebookPen, ChevronDown, ChevronRight, EyeOff } from "lucide-react";

interface Props {
  value?: string;
  onChange: (v: string) => void;
}

/**
 * «Заметки по визиту» — личные соображения врача (психология, реакция пациента).
 * Сохраняется в protocol_data.visit_notes.
 * КАТЕГОРИЧЕСКИ НИКОГДА не выводится на печать
 * (ключ `visit_notes` включён в KNOWN_KEYS в ProtocolPrintLayout и не рендерится).
 */
export function VisitNotesField({ value, onChange }: Props) {
  const [open, setOpen] = useState(!!value);
  return (
    <Card className="border-dashed border-sky-300/60 dark:border-sky-700/40 bg-sky-50/30 dark:bg-sky-950/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          <NotebookPen className="h-4 w-4 text-sky-600" />
          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            className="flex items-center gap-1 hover:underline"
          >
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Заметки по визиту (только для врача)
          </button>
          <span className="text-[10px] font-normal text-muted-foreground inline-flex items-center gap-1">
            <EyeOff className="h-3 w-3" /> никогда не печатается
          </span>
          {value && !open && (
            <span className="text-[10px] text-sky-700 dark:text-sky-400">· {value.length} симв.</span>
          )}
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            placeholder="Как прошёл визит: психология, реакция пациента и родителей, комплаентность, договорённости «между строк»."
            className="text-sm bg-background/60"
          />
        </CardContent>
      )}
    </Card>
  );
}
