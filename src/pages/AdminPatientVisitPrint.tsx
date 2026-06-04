import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProtocolPrintLayout } from "@/components/visits/ProtocolPrintLayout";

export default function AdminPatientVisitPrint() {
  const { id } = useParams<{ id: string }>();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!visit) return <div className="p-8 text-center">Визит не найден</div>;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="no-print max-w-5xl mx-auto flex justify-between mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/admin/visits/${id}`}><ArrowLeft className="h-4 w-4 mr-1" /> Назад</Link>
        </Button>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Печать / PDF</Button>
      </div>

      <div className="max-w-5xl mx-auto bg-white shadow-md">
        <ProtocolPrintLayout visit={visit} />
      </div>
    </div>
  );
}
