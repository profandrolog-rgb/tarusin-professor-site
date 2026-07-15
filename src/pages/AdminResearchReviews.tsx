import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const AdminResearchReviews = () => {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aTopic, setATopic] = useState("");
  const [aText, setAText] = useState("");
  const [bTopic, setBTopic] = useState("");

  const { data: reviews = [], refetch } = useQuery({
    queryKey: ["admin-research-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research_reviews" as any)
        .select("id, slug, title, status, updated_at, source_type, topic")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  async function runImport() {
    if (!aTopic.trim() || !aText.trim()) {
      toast.error("Заполните тему и текст");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("research-review-import", {
        body: { topic: aTopic, raw_text: aText },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Черновик создан");
      setOpen(false);
      setATopic("");
      setAText("");
      await refetch();
      nav(`/admin/research-reviews/${(data as any).review.id}`);
    } catch (e: any) {
      toast.error(e?.message || "Ошибка обработки");
    } finally {
      setLoading(false);
    }
  }

  async function runOrchestrate() {
    if (!bTopic.trim()) {
      toast.error("Укажите тему");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("research-review-orchestrate", {
        body: { topic: bTopic },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Обзор сгенерирован");
      setOpen(false);
      setBTopic("");
      await refetch();
      nav(`/admin/research-reviews/${(data as any).review.id}`);
    } catch (e: any) {
      toast.error(e?.message || "Ошибка оркестратора");
    } finally {
      setLoading(false);
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

  const statusLabel = (s: string) =>
    s === "published" ? "Опубликован" : s === "in_review" ? "На проверке" : "Черновик";
  const statusVariant = (s: string): "default" | "secondary" | "outline" =>
    s === "published" ? "default" : s === "in_review" ? "secondary" : "outline";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Админка</Button></Link>
          <h1 className="text-2xl font-bold">Мои исследования и литературные обзоры</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Новый обзор</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Создание черновика обзора</DialogTitle></DialogHeader>
            <Tabs defaultValue="a">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="a">A. Причесать готовый текст</TabsTrigger>
                <TabsTrigger value="b">B. Полный поиск и написание</TabsTrigger>
              </TabsList>
              <TabsContent value="a" className="space-y-3 pt-3">
                <div>
                  <Label>Тема</Label>
                  <Input value={aTopic} onChange={(e) => setATopic(e.target.value)} placeholder="Например: Микрохирургическое лечение варикоцеле у подростков" />
                </div>
                <div>
                  <Label>Исходный текст</Label>
                  <Textarea value={aText} onChange={(e) => setAText(e.target.value)} rows={12} placeholder="Вставьте готовый текст исследования..." />
                </div>
                <Button onClick={runImport} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Обработать через Claude Sonnet
                </Button>
              </TabsContent>
              <TabsContent value="b" className="space-y-3 pt-3">
                <div>
                  <Label>Тема / вопрос для обзора</Label>
                  <Textarea value={bTopic} onChange={(e) => setBTopic(e.target.value)} rows={5} placeholder="Например: Современные подходы к диагностике тестикулярного микролитиаза у детей" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Пайплайн: поиск литературы (Perplexity Sonar + PubMed) → синтез → написание обзора (Claude Sonnet) → факт-чек. Занимает 1-3 минуты.
                </p>
                <Button onClick={runOrchestrate} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Запустить оркестратор
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
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
                  <Badge variant={statusVariant(r.status)}>{statusLabel(r.status)}</Badge>
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
