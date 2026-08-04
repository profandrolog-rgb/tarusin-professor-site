import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Upload, LayoutList, Loader2, Eye, EyeOff, Search, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration, TRANSCRIPT_STATUS_LABELS, VIDEO_RUBRIC_FALLBACK } from "@/lib/video/constants";

interface Row {
  id: string;
  slug: string;
  title: string;
  poster_url: string | null;
  duration_sec: number | null;
  rubric: string | null;
  is_published: boolean;
  transcript_status: string | null;
  views: number | null;
}

const AdminVideos = () => {
  const { isAdmin, isEditor, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const canEdit = isAdmin || isEditor;

  useEffect(() => {
    if (!authLoading && !canEdit) navigate("/auth");
  }, [authLoading, canEdit, navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select("id, slug, title, poster_url, duration_sec, rubric, is_published, transcript_status, views")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Не удалось загрузить список", description: error.message, variant: "destructive" });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    if (canEdit) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit]);

  const togglePublish = async (row: Row) => {
    const { error } = await supabase
      .from("videos")
      .update({ is_published: !row.is_published })
      .eq("id", row.id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_published: !r.is_published } : r)));
  };

  const filtered = rows.filter((r) =>
    q.trim() ? (r.title + " " + r.slug).toLowerCase().includes(q.trim().toLowerCase()) : true,
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> В админку
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">Видео</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/video-rubrics"><LayoutList className="mr-2 h-4 w-4" /> Разделы</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/videos/organize"><GripVertical className="mr-2 h-4 w-4" /> Порядок</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/videos/import"><Upload className="mr-2 h-4 w-4" /> Импорт</Link>
            </Button>
            <Button asChild>
              <Link to="/admin/videos/new"><Plus className="mr-2 h-4 w-4" /> Новое видео</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по названию или slug" className="max-w-sm" />
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
          ) : filtered.length ? (
            filtered.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
                <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {r.poster_url && (
                    <img src={r.poster_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/videos/${r.id}`} className="font-medium text-foreground hover:text-primary">
                    {r.title}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">/video/{r.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={r.is_published ? "default" : "secondary"}>
                      {r.is_published ? "Опубликовано" : "Черновик"}
                    </Badge>
                    {r.rubric && (
                      <Badge variant="outline">
                        {VIDEO_RUBRIC_FALLBACK.find((x) => x.slug === r.rubric)?.title ?? r.rubric}
                      </Badge>
                    )}
                    {r.transcript_status && (
                      <Badge variant="outline">
                        {TRANSCRIPT_STATUS_LABELS[r.transcript_status] ?? r.transcript_status}
                      </Badge>
                    )}
                    {r.duration_sec ? <Badge variant="outline">{formatDuration(r.duration_sec)}</Badge> : null}
                    <Badge variant="outline">{r.views ?? 0} просм.</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => togglePublish(r)}>
                    {r.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" asChild>
                    <Link to={`/admin/videos/${r.id}`}>Открыть</Link>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Видео пока не добавлены.</p>
          )}
        </div>

        {authLoading && (
          <div className="mt-6 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Проверяю доступ…
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVideos;
