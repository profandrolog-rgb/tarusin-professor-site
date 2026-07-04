import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface Props { mode: "create" | "edit"; }

export default function AdminPatientForm({ mode }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [historyNumber, setHistoryNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [sex, setSex] = useState<"" | "M" | "F">("");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    (async () => {
      setBusy(true);
      const { data } = await supabase
        .from("patients")
        .select("full_name, birth_date, phone, history_number, sex")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        setFullName((data as any).full_name || "");
        setBirthDate((data as any).birth_date || "");
        setPhone((data as any).phone || "");
        setHistoryNumber((data as any).history_number || "");
        const s = (data as any).sex;
        setSex(s === "M" || s === "F" ? s : "");
      }
      setBusy(false);
    })();
  }, [id, mode]);

  const handleSave = async () => {
    const name = fullName.trim();
    if (!name) { toast.error("Укажите ФИО"); return; }
    setSaving(true);
    const payload = {
      full_name: name,
      birth_date: birthDate || null,
      phone: phone.trim() || null,
      history_number: historyNumber.trim() || null,
      sex: sex || null,
    };
    if (mode === "create") {
      const { data, error } = await supabase.from("patients").insert(payload).select("id").single();
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Пациент создан");
      navigate(`/admin/patients/${(data as any).id}`);
    } else {
      const { error } = await supabase.from("patients").update(payload).eq("id", id!);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Сохранено");
      navigate(`/admin/patients/${id}`);
    }
  };

  if (loading || busy) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>{mode === "create" ? "Новый пациент" : "Редактирование пациента"}</title><meta name="robots" content="noindex" /></Helmet>
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Link to="/admin/patients" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4"/>К списку пациентов
        </Link>

        <Card>
          <CardHeader><CardTitle>{mode === "create" ? "Новый пациент" : "Редактирование пациента"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>ФИО *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Дата рождения</Label>
                <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>№ истории болезни</Label>
                <Input value={historyNumber} onChange={(e) => setHistoryNumber(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Телефон</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => navigate(-1)}>Отмена</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                Сохранить
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
