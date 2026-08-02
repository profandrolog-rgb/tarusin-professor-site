import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { slugifyVideo, VIDEO_RUBRIC_FALLBACK } from "@/lib/video/constants";

interface Rubric {
  id?: string;
  slug: string;
  title: string;
  description: string | null;
  is_urgent: boolean;
  is_active: boolean;
  sort_order: number | null;
}

const AdminVideoRubrics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isEditor, loading: authLoading } = useAuth();
  const canEdit = isAdmin || isEditor;

  const [rows, setRows] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !canEdit) navigate("/auth");
  }, [authLoading, canEdit, navigate]);

  const load = async () => {
    const { data, error } = await supabase
      .from("video_rubrics")
      .select("id, slug, title, description, is_urgent, is_active, sort_order")
      .order("sort_order", { ascending: true });
    if (error) toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
    setRows((data ?? []) as Rubric[]);
    setLoading(false);
  };

  useEffect(() => {
    if (canEdit) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit]);

  const update = (i: number, patch: Partial<Rubric>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        slug: "",
        title: "",
        description: "",
        is_urgent: false,
        is_active: true,
        sort_order: (prev.length + 1) * 10,
      },
    ]);

  const seedDefaults = () =>
    setRows((prev) => {
      const existing = new Set(prev.map((r) => r.slug));
      const added = VIDEO_RUBRIC_FALLBACK.filter((r) => !existing.has(r.slug)).map((r, i) => ({
        slug: r.slug,
        title: r.title,
        description: "",
        is_urgent: !!r.is_urgent,
        is_active: true,
        sort_order: (prev.length + i + 1) * 10,
      }));
      return [...prev, ...added];
    });

  const saveAll = async () => {
    setSaving(true);
    try {
      const payload = rows
        .filter((r) => r.title.trim())
        .map((r) => ({
          ...(r.id ? { id: r.id } : {}),
          slug: r.slug.trim() || slugifyVideo(r.title),
          title: r.title.trim(),
          description: r.description || null,
          is_urgent: r.is_urgent,
          is_active: r.is_active,
          sort_order: r.sort_order ?? 0,
        }));
      const { error } = await supabase.from("video_rubrics").upsert(payload as any, { onConflict: "slug" });
      if (error) throw new Error(error.message);
      toast({ title: "Разделы сохранены" });
      await load();
    } catch (e) {
      toast({
        title: "Не удалось сохранить",
        description: e instanceof Error ? e.message : "Ошибка",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (i: number) => {
    const row = rows[i];
    if (row.id) {
      const { error } = await supabase.from("video_rubrics").delete().eq("id", row.id);
      if (error) {
        toast({ title: "Не удалось удалить", description: error.message, variant: "destructive" });
        return;
      }
    }
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link to="/admin/videos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> К списку видео
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">Разделы видео</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={seedDefaults}>Добавить стандартные</Button>
            <Button variant="outline" onClick={addRow}><Plus className="mr-2 h-4 w-4" /> Раздел</Button>
            <Button onClick={saveAll} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Сохранить
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="mt-8 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {rows.map((r, i) => (
              <div key={r.id ?? `new-${i}`} className="space-y-3 rounded-xl border border-border bg-card p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <Label>Название</Label>
                    <Input value={r.title} onChange={(e) => update(i, { title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={r.slug}
                      onChange={(e) => update(i, { slug: e.target.value })}
                      placeholder={slugifyVideo(r.title)}
                    />
                  </div>
                  <div>
                    <Label>Порядок</Label>
                    <Input
                      type="number"
                      value={r.sort_order ?? ""}
                      onChange={(e) => update(i, { sort_order: e.target.value === "" ? null : Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Описание</Label>
                  <Textarea rows={2} value={r.description ?? ""} onChange={(e) => update(i, { description: e.target.value })} />
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={r.is_urgent} onCheckedChange={(v) => update(i, { is_urgent: v })} />
                    <span className="text-sm text-foreground">Срочный раздел</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={r.is_active} onCheckedChange={(v) => update(i, { is_active: v })} />
                    <span className="text-sm text-foreground">Активен</span>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto" onClick={() => remove(i)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Удалить
                  </Button>
                </div>
              </div>
            ))}
            {!rows.length && <p className="text-muted-foreground">Разделов пока нет.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVideoRubrics;
