import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Printer, FileDown } from "lucide-react";
import { PrescriptionPrint } from "./PrescriptionPrint";
import { exportNodeToPdf } from "@/lib/exportPdf";

interface PrescriptionPreviewProps {
  prescription: any;
  trigger?: React.ReactNode;
}

export function PrescriptionPreview({ prescription, trigger }: PrescriptionPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

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
          <DialogTitle>Предпросмотр рецепта</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Печать
          </Button>
        </div>
        <div ref={printRef} className="flex justify-center">
          <PrescriptionPrint prescription={prescription} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
