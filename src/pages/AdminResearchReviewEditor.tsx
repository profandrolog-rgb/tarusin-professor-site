import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import RichTextEditor from "@/components/blog/RichTextEditor";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, Send, ChevronDown, Loader2, Trash2, Plus } from "lucide-react";

interface Ref {
  number: number;
  authors?: string;
  title?: string;
  journal?: string;
  year?: string;
  volume_issue?: string;
  pages?: string;
  doi_or_pmid?: string;
  verified?: boolean;
}
interface FactCheck { quote: string; issue: string; suggested_fix: string; confidence: string }

const AdminResearchReviewEditor = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("research_reviews" as any).select("*").eq("id", id!).single();
      if (error) toast.error(error.message);
      else setRow(data);
      setLoading(false);
    })();
  }, [id]);

  function update(patch: any) { setRow((r: any) => ({ ...r, ...patch })); }

  async function save(newStatus?: string) {
    if (!row) return;
    setSaving(true);
    const payload: any = {
      slug: row.slug,
      title: row.title,
      annotation: row.annotation,
      content: row.content,
      topic: row.topic,
      references_list: row.references_list,
      fact_check_report: row.fact_check_report,
      seo_title: row.seo_title,
      seo_meta_description: row.seo_meta_description,
      cover_image_path: row.cover_image_path,
    };
    if (newStatus) {
      payload.status = newStatus;
      if (newStatus === "published" && !row.published_at) payload.published_at = new Date().toISOString();
    }
    const { error } = await supabase.from("research_reviews" as any).update(payload).eq("id", row.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(newStatus ? `Статус: ${newStatus}` : "Сохранено");
      if (newStatus) setRow({ ...row, ...payload });
    }
  }

  if (loading) return <div className="p-6"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!row) return <div className="p-6">Не найдено</div>;

  const refs: Ref[] = Array.isArray(row.references_list) ? row.references_list : [];
  const fc: FactCheck[] = Array.isArray(row.fact_check_report) ? row.fact_check_report : [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/admin/research-reviews"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Список</Button></Link>
          <Badge variant={row.status === "published" ? "default" : row.status === "in_review" ? "secondary" : "outline"}>
            {row.status === "published" ? "Опубликован" : row.status === "in_review" ? "На проверке" : "Черновик"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => save()} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> Сохранить
          </Button>
          {row.status === "draft" && (
            <Button variant="secondary" size="sm" onClick={() => save("in_review")} disabled={saving}>
              <Eye className="w-4 h-4 mr-1" /> На проверку
            </Button>
          )}
          {row.status === "in_review" && (
            <>
              <Button variant="outline" size="sm" onClick={() => save("draft")}>Вернуть в draft</Button>
              <Button size="sm" onClick={() => save("published")}>
                <Send className="w-4 h-4 mr-1" /> Опубликовать
              </Button>
            </>
          )}
          {row.status === "published" && (
            <>
              <Link to={`/for-doctors/research/${row.slug}`} target="_blank">
                <Button variant="outline" size="sm">Открыть на сайте</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => save("draft")}>Снять с публикации</Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Основное</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Заголовок</Label><Input value={row.title || ""} onChange={(e) => update({ title: e.target.value })} /></div>
          <div><Label>Slug (URL)</Label><Input value={row.slug || ""} onChange={(e) => update({ slug: e.target.value })} /></div>
          <div><Label>Тема (фильтр)</Label><Input value={row.topic || ""} onChange={(e) => update({ topic: e.target.value })} /></div>
          <div><Label>Аннотация</Label><Textarea value={row.annotation || ""} onChange={(e) => update({ annotation: e.target.value })} rows={4} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Текст обзора</CardTitle></CardHeader>
        <CardContent>
          <RichTextEditor content={row.content || ""} onChange={(html) => update({ content: html })} storageBucket="disease-media" storageFolder="research-images" />
          <p className="text-xs text-muted-foreground mt-2">Ссылки на источники в тексте — в квадратных скобках: [1], [2]. На публичной странице они станут якорями к списку литературы.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Список литературы ({refs.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={() => update({ references_list: [...refs, { number: refs.length + 1, verified: false }] })}>
              <Plus className="w-4 h-4 mr-1" /> Добавить
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {refs.map((r, i) => (
            <div key={i} className="border rounded p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input className="w-16" type="number" value={r.number ?? i + 1} onChange={(e) => {
                  const arr = [...refs]; arr[i] = { ...r, number: Number(e.target.value) }; update({ references_list: arr });
                }} />
                <Input placeholder="Авторы" value={r.authors || ""} onChange={(e) => {
                  const arr = [...refs]; arr[i] = { ...r, authors: e.target.value }; update({ references_list: arr });
                }} />
                <Button variant="ghost" size="sm" onClick={() => update({ references_list: refs.filter((_, j) => j !== i) })}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <Input placeholder="Название статьи" value={r.title || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, title: e.target.value }; update({ references_list: a }); }} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Input placeholder="Журнал" value={r.journal || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, journal: e.target.value }; update({ references_list: a }); }} />
                <Input placeholder="Год" value={r.year || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, year: e.target.value }; update({ references_list: a }); }} />
                <Input placeholder="Том(номер)" value={r.volume_issue || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, volume_issue: e.target.value }; update({ references_list: a }); }} />
                <Input placeholder="Страницы" value={r.pages || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, pages: e.target.value }; update({ references_list: a }); }} />
              </div>
              <div className="flex items-center gap-3">
                <Input placeholder="DOI / PMID" value={r.doi_or_pmid || ""} onChange={(e) => { const a = [...refs]; a[i] = { ...r, doi_or_pmid: e.target.value }; update({ references_list: a }); }} />
                <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                  <input type="checkbox" checked={!!r.verified} onChange={(e) => { const a = [...refs]; a[i] = { ...r, verified: e.target.checked }; update({ references_list: a }); }} />
                  проверено
                </label>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Collapsible>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <CardTitle className="flex items-center justify-between">
                <span>Отчёт факт-чека ({fc.length}) — только для админа</span>
                <ChevronDown className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              {fc.length === 0 && <p className="text-sm text-muted-foreground">Замечаний нет.</p>}
              {fc.map((f, i) => (
                <div key={i} className="border rounded p-3 space-y-2 bg-muted/20">
                  <Textarea rows={2} placeholder="Цитата" value={f.quote || ""} onChange={(e) => { const a = [...fc]; a[i] = { ...f, quote: e.target.value }; update({ fact_check_report: a }); }} />
                  <Textarea rows={2} placeholder="Что не так" value={f.issue || ""} onChange={(e) => { const a = [...fc]; a[i] = { ...f, issue: e.target.value }; update({ fact_check_report: a }); }} />
                  <Textarea rows={2} placeholder="Предлагаемая правка" value={f.suggested_fix || ""} onChange={(e) => { const a = [...fc]; a[i] = { ...f, suggested_fix: e.target.value }; update({ fact_check_report: a }); }} />
                  <div className="flex items-center gap-2">
                    <Input className="w-64" placeholder="Уверенность" value={f.confidence || ""} onChange={(e) => { const a = [...fc]; a[i] = { ...f, confidence: e.target.value }; update({ fact_check_report: a }); }} />
                    <Button variant="ghost" size="sm" onClick={() => update({ fact_check_report: fc.filter((_, j) => j !== i) })}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => update({ fact_check_report: [...fc, { quote: "", issue: "", suggested_fix: "", confidence: "" }] })}>
                <Plus className="w-4 h-4 mr-1" /> Добавить замечание
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card>
        <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>SEO title (≤60 симв.)</Label><Input value={row.seo_title || ""} onChange={(e) => update({ seo_title: e.target.value })} maxLength={70} /></div>
          <div><Label>Meta description (≤160 симв.)</Label><Textarea value={row.seo_meta_description || ""} onChange={(e) => update({ seo_meta_description: e.target.value })} rows={2} maxLength={200} /></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminResearchReviewEditor;
