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
import { Printer, FileDown, FlaskConical } from "lucide-react";
import { METABOLIC_MAP_CHECKLIST } from "@/data/metabolicMapChecklist";
import { MetabolicMapChecklistPrint } from "./MetabolicMapChecklistPrint";
import { exportNodeToPdf } from "@/lib/exportPdf";

interface Props {
  patientName?: string;
  birthDate?: string | null;
  doctorName?: string;
  value: string[];
  onChange: (codes: string[]) => void;
  trigger?: React.ReactNode;
}

export function MetabolicMapChecklistDialog({
  patientName,
  birthDate,
  doctorName,
  value,
  onChange,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(() => new Set(value || []), [value]);

  const toggle = (code: string) => {
    const next = new Set(selectedSet);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(Array.from(next));
  };

  const setSection = (codes: string[], on: boolean) => {
    const next = new Set(selectedSet);
    for (const c of codes) {
      if (on) next.add(c);
      else next.delete(c);
    }
    onChange(Array.from(next));
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Бланк метаболической карты</title>
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
    const name = (patientName || "patient").replace(/\s+/g, "_");
    await exportNodeToPdf(printRef.current, `${name}_metabolic_checklist.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FlaskConical className="h-4 w-4 mr-2" />
            🧬 Печать бланка метаболической карты
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Бланк метаболической карты — выбор исследований</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 py-2 border-b">
          <Button onClick={handlePrint} size="sm">
            <Printer className="h-4 w-4 mr-2" /> Печать
          </Button>
          <Button onClick={handlePdf} variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" /> Скачать PDF
          </Button>
          <div className="text-xs text-muted-foreground ml-auto self-center">
            Отмечено: {selectedSet.size}
          </div>
        </div>

        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-4 py-3">
            {METABOLIC_MAP_CHECKLIST.map((section) => {
              const codes = section.items.map((i) => i.code);
              const allOn = codes.every((c) => selectedSet.has(c));
              return (
                <div key={section.title} className="border rounded-md p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="font-semibold text-sm">{section.title}</div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSection(codes, !allOn)}
                      >
                        {allOn ? "Снять все" : "Отметить все"}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                    {section.items.map((it) => {
                      const on = selectedSet.has(it.code);
                      return (
                        <label
                          key={it.code}
                          className="flex items-start gap-2 cursor-pointer text-sm hover:bg-muted/40 rounded px-1 py-0.5"
                        >
                          <Checkbox
                            checked={on}
                            onCheckedChange={() => toggle(it.code)}
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
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Hidden print source */}
        <div style={{ position: "absolute", left: -99999, top: 0 }} aria-hidden>
          <div ref={printRef}>
            <MetabolicMapChecklistPrint
              patientName={patientName || ""}
              birthDate={birthDate}
              doctorName={doctorName}
              selectedCodes={Array.from(selectedSet)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
