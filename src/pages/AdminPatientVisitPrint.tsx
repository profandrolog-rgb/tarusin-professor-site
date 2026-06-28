import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Printer, ArrowLeft, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProtocolPrintLayout } from "@/components/visits/ProtocolPrintLayout";
import { exportNodeToPdf } from "@/lib/exportPdf";
import { useToast } from "@/hooks/use-toast";

export default function AdminPatientVisitPrint() {
  const { id } = useParams<{ id: string }>();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    supabase
      .from("patient_visits")
      .select("*, patient:patients(full_name, birth_date, history_number)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setVisit(data);
        setLoading(false);
      });
  }, [id]);

  const handlePdf = async () => {
    if (!printRef.current) return;
    setPdfBusy(true);
    try {
      const name = visit?.patient?.full_name?.replace(/\s+/g, "_") || "protocol";
      const date = visit?.visit_date ? String(visit.visit_date).slice(0, 10) : "";
      await exportNodeToPdf(printRef.current, `${name}_${date}.pdf`);
    } catch (e: any) {
      toast({ title: "Не удалось создать PDF", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setPdfBusy(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!visit) return <div className="p-8 text-center">Визит не найден</div>;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="no-print max-w-5xl mx-auto flex justify-between mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/admin/visits/${id}`}><ArrowLeft className="h-4 w-4 mr-1" /> Назад</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePdf} disabled={pdfBusy}>
            {pdfBusy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}
            Скачать PDF
          </Button>
          <Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Печать</Button>
        </div>
      </div>

      <div ref={printRef} className="max-w-5xl mx-auto bg-white shadow-md">
        <ProtocolPrintLayout visit={visit} />
      </div>
    </div>
  );
}
