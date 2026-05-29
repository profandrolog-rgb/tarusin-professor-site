import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { PatientSelect } from "@/components/prescriptions/PatientSelect";
import { PROTOCOL_TYPES, ProtocolType } from "@/lib/visits/protocolTypes";
import { DEFAULT_PROTOCOL_DATA } from "@/lib/visits/protocolSchemas";

interface Patient {
  id: string;
  full_name: string;
  birth_date: string;
}

export default function AdminPatientVisitNew() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading: authLoading, isAdmin, isSurgeon } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!authLoading && user && !isAdmin && !isSurgeon) navigate("/");
  }, [authLoading, user, isAdmin, isSurgeon, navigate]);

  useEffect(() => {
    const pid = params.get("patient_id");
    if (pid && !patient) {
      supabase.from("patients").select("id, full_name, birth_date").eq("id", pid).maybeSingle()
        .then(({ data }) => { if (data) setPatient(data as Patient); });
    }
  }, [params, patient]);

  const handleCreate = async (type: ProtocolType) => {
    if (!patient) {
      toast({ title: "Выберите пациента", variant: "destructive" });
      return;
    }
    setCreating(true);
    const { data, error } = await supabase
      .from("patient_visits")
      .insert({
        patient_id: patient.id,
        protocol_type: type,
        protocol_data: (DEFAULT_PROTOCOL_DATA[type] as any) || {},
        created_by: user?.id,
      })
      .select()
      .single();
    setCreating(false);
    if (error) {
      toast({ title: "Не удалось создать протокол", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Протокол создан" });
    navigate(`/admin/visits/${data.id}`);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/visits"><ArrowLeft className="h-4 w-4 mr-1" /> К журналу визитов</Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Новый протокол</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Выберите пациента</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientSelect selectedPatient={patient} onSelect={setPatient} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Выберите тип протокола</CardTitle>
            <CardDescription>
              {patient ? `Будет создан протокол для пациента: ${patient.full_name}` : "Сначала выберите пациента выше"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {PROTOCOL_TYPES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  disabled={!patient || creating}
                  onClick={() => handleCreate(p.key)}
                  className="text-left p-4 rounded-lg border bg-card hover:border-primary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium leading-tight">{p.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{p.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
