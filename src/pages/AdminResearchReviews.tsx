import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const AdminResearchReviews = () => {
  const nav = useNavigate();
  const [creating, setCreating] = useState(false);

  const { data: reviews = [], refetch } = useQuery({
    queryKey: ["admin-research-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research_reviews" as any)
        .select("id, slug, title, status, workflow_state, voice_mode, updated_at, source_type, topic")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  async function createEmpty() {
    setCreating(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Не авторизован");
      const slug = `draft-${Date.now()}`;
      const { data, error } = await supabase
        .from("research_reviews" as any)
        .insert({
          slug,
          title: "Новый обзор",
          topic: "",
          status: "draft",
          source_type: "manual_import",
          content: "",
          author_id: uid,
        } as any)
        .select("id")
        .single();
      if (error) throw error;
      await refetch();
      nav(`/admin/research-reviews/${(data as any).id}`);
    } catch (e: any) {
      toast.error(e?.message || "Не удалось создать обзор");
    } finally {
      setCreating(false);
    }
  }

  async function del(id: string) {
    if (!confirm("Удалить обзор?")) return;
    const { error } = await supabase.from("research_reviews" as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Удалено");
      refetch();
    }
  }

  const wfLabel = (s: string) =>
    s === "published" ? "Опубликован" :
    s === "consilium" ? "На консилиуме" :
    s === "editing" ? "Научное редактирование" :
    s === "writing" ? "В написании" :
    "Черновик";
  const wfVariant = (s: string): "default" | "secondary" | "outline" | "destructive" =>
    s === "published" ? "default" :
    s === "consilium" ? "destructive" :
    s === "editing" || s === "writing" ? "secondary" :
    "outline";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Админка</Button></Link>
          <h1 className="text-2xl font-bold">Мои исследования и литературные обзоры</h1>
        </div>
        <Button onClick={createEmpty} disabled={creating}>
          {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-1" />}
          Новый обзор
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Обзоры ({reviews.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {reviews.length === 0 && <p className="text-sm text-muted-foreground">Пока нет обзоров.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.title || "(без названия)"}</div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Badge variant={wfVariant(r.workflow_state || "draft")}>{wfLabel(r.workflow_state || "draft")}</Badge>
                  {r.topic && <span>· {r.topic}</span>}
                  <span>· {format(new Date(r.updated_at), "d MMM yyyy HH:mm", { locale: ru })}</span>
                  <span>· {r.source_type === "orchestrator_generated" ? "оркестратор" : "импорт"}</span>
                </div>
              </div>
              <Link to={`/admin/research-reviews/${r.id}`}>
                <Button variant="outline" size="sm"><Pencil className="w-4 h-4 mr-1" /> Открыть</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => del(r.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminResearchReviews;
