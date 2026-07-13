import { useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Printer, FileDown, FlaskConical } from "lucide-react";
import { METABOLIC_MAP_ITEMS, CATS, normalizeChecklistCodes, type ChecklistItem } from "@/data/metabolicMapChecklist";
import {
  MetabolicMapChecklistPrint,
  type ChecklistPrintMode,
} from "./MetabolicMapChecklistPrint";
import { exportNodeToPdf } from "@/lib/exportPdf";
import { cn } from "@/lib/utils";

interface Props {
  patientName?: string;
  birthDate?: string | null;
  doctorName?: string;
  value: string[];
  onChange: (codes: string[]) => void;
  trigger?: React.ReactNode;
}

const TOTAL = METABOLIC_MAP_ITEMS.length;

export function MetabolicMapChecklistDialog({
  patientName,
  birthDate,
  doctorName,
  value,
  onChange,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChecklistPrintMode>("patient");
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set());
  const [extraNote, setExtraNote] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(() => new Set(normalizeChecklistCodes(value)), [value]);

  const visibleItems = useMemo(
    () =>
      METABOLIC_MAP_ITEMS.filter(
        (i) => activeCats.size === 0 || i.cats.some((c) => activeCats.has(c)),
      ),
    [activeCats],
  );

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const k of Object.keys(CATS)) counts[k] = 0;
    for (const it of METABOLIC_MAP_ITEMS)
      for (const c of it.cats) counts[c] = (counts[c] || 0) + 1;
    return counts;
  }, []);

  const toggleCat = (c: string) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const toggleCode = (code: string) => {
    const next = new Set(selectedSet);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(Array.from(next));
  };

  const setVisible = (on: boolean) => {
    const next = new Set(selectedSet);
    for (const it of visibleItems) {
      if (on) next.add(it.code);
      else next.delete(it.code);
    }
    onChange(Array.from(next));
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const title =
      mode === "patient"
        ? "Бланк метаболической карты"
        : "Справочник параметров метаболической карты";
    w.document.write(`
      <html><head><title>${title}</title>
      <style>
        @page{size:A4 portrait;margin:0}
        body{margin:0;padding:0}
        *{box-sizing:border-box}
      </style>
      </head><body>${printContent.innerHTML}</body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  const handlePdf = async () => {
    if (!printRef.current) return;
    const filename =
      mode === "patient"
        ? "metabolicheskaya-karta-blank.pdf"
        : "metabolicheskaya-karta-spravochnik.pdf";
    await exportNodeToPdf(printRef.current, filename);
  };

  const renderItem = (it: ChecklistItem) => {
    const on = selectedSet.has(it.code);
    if (mode === "doctor") {
      return (
        <div
          key={it.code}
          className="flex flex-col gap-0.5 text-sm px-1 py-1 rounded hover:bg-muted/40"
        >
          <div>
            <span className="font-mono text-xs text-muted-foreground mr-1.5">
              {it.code}
            </span>
            {it.label}
          </div>
          <div className="flex flex-wrap gap-1">
            {it.cats.map((c) => (
              <span
                key={c}
                className="inline-block text-[10px] px-1.5 py-0.5 rounded border bg-background text-muted-foreground"
              >
                {CATS[c]}
              </span>
            ))}
          </div>
        </div>
      );
    }
    return (
      <label
        key={it.code}
        className="flex items-start gap-2 cursor-pointer text-sm hover:bg-muted/40 rounded px-1 py-0.5"
      >
        <Checkbox
          checked={on}
          onCheckedChange={() => toggleCode(it.code)}
          className="mt-0.5"
        />
        <span>
          <span className="font-mono text-xs text-muted-foreground mr-1.5">
            {it.code}
          </span>
          {it.label}
        </span>
      </label>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FlaskConical className="h-4 w-4 mr-2" />
            🧬 Метаболическая карта — бланк/справочник
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Метаболическая карта — {mode === "patient" ? "бланк пациента" : "справочник врача"}
          </DialogTitle>
        </DialogHeader>

        {/* Mode + counter */}
        <div className="flex flex-wrap items-center gap-3 py-2 border-b">
          <div className="inline-flex rounded-md border overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setMode("patient")}
              className={cn(
                "px-3 py-1.5 font-medium transition",
                mode === "patient"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted",
              )}
            >
              Бланк пациента
            </button>
            <button
              type="button"
              onClick={() => setMode("doctor")}
              className={cn(
                "px-3 py-1.5 font-medium border-l transition",
                mode === "doctor"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted",
              )}
            >
              Справочник врача
            </button>
          </div>
          <div className="text-xs text-muted-foreground">
            {mode === "patient"
              ? `Отмечено: ${selectedSet.size} из ${TOTAL}`
              : `Показано: ${visibleItems.length} из ${TOTAL}`}
          </div>
          <div className="ml-auto flex gap-2">
            <Button onClick={handlePrint} size="sm">
              <Printer className="h-4 w-4 mr-2" /> Печать
            </Button>
            <Button onClick={handlePdf} variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" /> Скачать PDF
            </Button>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5 py-2 border-b">
          <button
            type="button"
            onClick={() => setActiveCats(new Set())}
            className={cn(
              "text-xs px-2 py-1 rounded-full border transition",
              activeCats.size === 0
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted",
            )}
          >
            Все категории · {TOTAL}
          </button>
          {Object.entries(CATS).map(([key, label]) => {
            const on = activeCats.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleCat(key)}
                className={cn(
                  "text-xs px-2 py-1 rounded-full border transition",
                  on
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted",
                )}
              >
                {label} · {catCounts[key] || 0}
              </button>
            );
          })}
        </div>

        {mode === "patient" && (
          <div className="flex gap-3 text-xs py-1.5 border-b">
            <button
              type="button"
              onClick={() => setVisible(true)}
              className="text-primary hover:underline"
            >
              отметить все видимые
            </button>
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="text-muted-foreground hover:underline"
            >
              снять все видимые
            </button>
          </div>
        )}

        <ScrollArea className="flex-1 pr-3">
          <div className="py-3">
            {visibleItems.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 text-center">
                Нет параметров по выбранным категориям.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                {visibleItems.map(renderItem)}
              </div>
            )}
          </div>
        </ScrollArea>

        {mode === "patient" && (
          <div className="border-t pt-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Дополнительно (печатается на бланке)
            </label>
            <Textarea
              value={extraNote}
              onChange={(e) => setExtraNote(e.target.value)}
              placeholder="Комментарии, особые указания для лаборатории и родителей…"
              className="text-sm min-h-[60px]"
            />
          </div>
        )}

        {/* Hidden print source */}
        <div style={{ position: "absolute", left: -99999, top: 0 }} aria-hidden>
          <div ref={printRef}>
            <MetabolicMapChecklistPrint
              mode={mode}
              patientName={patientName || ""}
              birthDate={birthDate}
              doctorName={doctorName}
              selectedCodes={Array.from(selectedSet)}
              activeCats={Array.from(activeCats)}
              extraNote={extraNote}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
