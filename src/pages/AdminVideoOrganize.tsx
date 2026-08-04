import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { VIDEO_RUBRIC_FALLBACK } from "@/lib/video/constants";

interface VideoRow {
  id: string;
  slug: string;
  title: string;
  poster_url: string | null;
  rubric: string | null;
  sort_order: number | null;
  is_published: boolean;
}

interface RubricRow {
  slug: string;
  title: string;
}

const UNSORTED = "__unsorted__";

const AdminVideoOrganize = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isEditor, loading: authLoading } = useAuth();
  const canEdit = isAdmin || isEditor;

  const [rubrics, setRubrics] = useState<RubricRow[]>([]);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const dragId = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoading && !canEdit) navigate("/auth");
  }, [authLoading, canEdit, navigate]);

  useEffect(() => {
    if (!canEdit) return;
    (async () => {
      const [r, v] = await Promise.all([
        supabase.from("video_rubrics").select("slug, title").order("sort_order", { ascending: true }),
        supabase
          .from("videos")
          .select("id, slug, title, poster_url, rubric, sort_order, is_published")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false }),
      ]);
      setRubrics(r.data?.length ? (r.data as RubricRow[]) : (VIDEO_RUBRIC_FALLBACK as RubricRow[]));
      setVideos((v.data ?? []) as VideoRow[]);
      setLoading(false);
    })();
  }, [canEdit]);

  const columns = useMemo(() => {
    const map = new Map<string, VideoRow[]>();
    map.set(UNSORTED, []);
    for (const r of rubrics) map.set(r.slug, []);
    for (const v of videos) {
      const key = v.rubric && map.has(v.rubric) ? v.rubric : UNSORTED;
      map.get(key)!.push(v);
    }
    return map;
  }, [rubrics, videos]);

  /** Перекладывает видео в целевую рубрику перед указанным элементом. */
  const drop = (targetRubric: string, beforeId: string | null) => {
    const id = dragId.current;
    dragId.current = null;
    if (!id) return;
    setVideos((prev) => {
      const moving = prev.find((v) => v.id === id);
      if (!moving) return prev;
      const rest = prev.filter((v) => v.id !== id);
      const updated: VideoRow = {
        ...moving,
        rubric: targetRubric === UNSORTED ? null : targetRubric,
      };
      const idx = beforeId ? rest.findIndex((v) => v.id === beforeId) : -1;
      if (idx === -1) rest.push(updated);
      else rest.splice(idx, 0, updated);
      return rest;
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const updates: { id: string; rubric: string | null; sort_order: number }[] = [];
      for (const [key, list] of columns.entries()) {
        list.forEach((v, i) => {
          updates.push({ id: v.id, rubric: key === UNSORTED ? null : key, sort_order: (i + 1) * 10 });
        });
      }
      for (const u of updates) {
        const { error } = await supabase
          .from("videos")
          .update({ rubric: u.rubric, sort_order: u.sort_order })
          .eq("id", u.id);
        if (error) throw new Error(error.message);
      }
      setDirty(false);
      toast({ title: "Порядок сохранён", description: `Обновлено видео: ${updates.length}` });
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

  const columnEntries: { key: string; title: string }[] = [
    ...rubrics.map((r) => ({ key: r.slug, title: r.title })),
    { key: UNSORTED, title: "Без раздела" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link
          to="/admin/videos"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> К списку видео
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Порядок и разделы</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Перетаскивайте карточки внутри раздела или между разделами, затем сохраните.
            </p>
          </div>
          <Button onClick={save} disabled={saving || !dirty}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Сохранить порядок
          </Button>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {columnEntries.map((col) => {
              const list = columns.get(col.key) ?? [];
              return (
                <div
                  key={col.key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    drop(col.key, null);
                  }}
                  className="rounded-xl border border-border bg-muted/20 p-3"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground">{col.title}</h2>
                    <Badge variant="secondary">{list.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {list.map((v) => (
                      <div
                        key={v.id}
                        draggable
                        onDragStart={() => {
                          dragId.current = v.id;
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          drop(col.key, v.id);
                        }}
                        className="flex cursor-grab items-center gap-3 rounded-lg border border-border bg-card p-2 active:cursor-grabbing"
                      >
                        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="h-10 w-16 shrink-0 overflow-hidden rounded bg-muted">
                          {v.poster_url && (
                            <img src={v.poster_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{v.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {v.is_published ? "Опубликовано" : "Черновик"} · {v.slug}
                          </p>
                        </div>
                      </div>
                    ))}
                    {!list.length && (
                      <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                        Перетащите видео сюда
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVideoOrganize;
