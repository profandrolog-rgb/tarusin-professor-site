import { useRef, useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Printer, FileDown } from "lucide-react";
import { PrescriptionPrint, type PrescriptionLang } from "./PrescriptionPrint";
import { exportNodeToPdf } from "@/lib/exportPdf";
import { transliterateGOST } from "@/lib/transliterateGOST";

interface PrescriptionPreviewProps {
  prescription: any;
  trigger?: React.ReactNode;
}

export function PrescriptionPreview({ prescription, trigger }: PrescriptionPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState<PrescriptionLang>("ru");

  const autoLatin = useMemo(
    () =>
      prescription?.patient?.full_name_latin?.trim() ||
      transliterateGOST(prescription?.patient?.full_name || ""),
    [prescription?.patient?.full_name, prescription?.patient?.full_name_latin],
  );
  const [latinName, setLatinName] = useState<string>(autoLatin);
  useEffect(() => {
    setLatinName(autoLatin);
  }, [autoLatin]);

  const prescriptionForPrint = useMemo(() => {
    if (lang !== "en") return prescription;
    return {
      ...prescription,
      patient: { ...prescription.patient, full_name_latin: latinName || autoLatin },
    };
  }, [prescription, lang, latinName, autoLatin]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const title = lang === "en" ? "Prescription" : "Рецепт";
    printWindow.document.write(`
      <html><head><title>${title}</title>
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" /> Предпросмотр
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lang === "en" ? "Prescription preview" : "Предпросмотр рецепта"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <div className="inline-flex rounded-md border overflow-hidden" role="group" aria-label="Язык бланка">
            <button
              type="button"
              onClick={() => setLang("ru")}
              className={`px-3 py-1.5 text-xs font-medium transition ${lang === "ru" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              title="Русский"
            >
              RU
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 text-xs font-medium border-l transition ${lang === "en" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              title="English"
            >
              EN
            </button>
          </div>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {lang === "en" ? "Print" : "Печать"}
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (!printRef.current) return;
              const name = prescription?.patient_name?.replace(/\s+/g, "_") || "prescription";
              const suffix = lang === "en" ? "prescription" : "рецепт";
              await exportNodeToPdf(printRef.current, `${name}_${suffix}.pdf`);
            }}
          >
            <FileDown className="h-4 w-4 mr-2" />
            {lang === "en" ? "Download PDF" : "Скачать PDF"}
          </Button>
          {lang === "en" && (
            <span className="text-[11px] text-muted-foreground ml-1">
              MHH препаратов подставится после утверждения батч-перевода каталога
            </span>
          )}
        </div>
        {lang === "en" && (
          <div className="mb-3 p-2 rounded border bg-muted/30">
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Patient full name (auto-transliterated per RF passport / ICAO 9303)
            </label>
            <Input
              value={latinName}
              onChange={(e) => setLatinName(e.target.value)}
              placeholder={autoLatin}
              className="h-8 text-sm"
            />
            <div className="text-[10px] text-muted-foreground mt-1">
              edit if differs from passport
            </div>
          </div>
        )}
        <div ref={printRef} className="flex justify-center">
          <PrescriptionPrint prescription={prescriptionForPrint} lang={lang} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
