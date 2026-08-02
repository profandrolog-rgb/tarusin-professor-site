import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, AlertTriangle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PageMeta from "@/components/PageMeta";
import VideoCard from "@/components/video/VideoCard";
import VideoSearchBox from "@/components/video/VideoSearchBox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUDIENCE_LABELS, AGE_LABELS, FORMAT_LABELS } from "@/lib/video/constants";

interface Source {
  slug: string;
  title: string;
  poster_url: string | null;
  duration_sec: number | null;
  rubric: string | null;
  start_sec: number;
  snippet: string;
  same_cluster: Array<{ slug: string; title: string; poster_url: string | null }>;
}

interface SearchResult {
  answer: string;
  urgent: boolean;
  sources: Source[];
  related_questions: string[];
}

const ANY = "any";

const VideoSearchPage = () => {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const [audience, setAudience] = useState(ANY);
  const [age, setAge] = useState(ANY);
  const [format, setFormat] = useState(ANY);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      audience: audience === ANY ? undefined : audience,
      age: age === ANY ? undefined : age,
      format: format === ANY ? undefined : format,
    }),
    [audience, age, format],
  );

  useEffect(() => {
    if (query.trim().length < 2) {
      setResult(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    supabase.functions
      .invoke("video-search", { body: { query, filters } })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError("Не удалось выполнить поиск. Попробуйте ещё раз.");
        else setResult(data as SearchResult);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, filters]);

  const setQuery = (q: string) => setParams(q ? { q } : {});

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Поиск по видео — профессор Тарусин Д.И."
        description="Опишите ситуацию своими словами и найдите видео профессора Тарусина с ответом на ваш вопрос."
        path="/video/search/"
      />

      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Поиск по видео</h1>
        <div className="mt-6">
          <VideoSearchBox initialQuery={query} onSubmit={setQuery} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger aria-label="Аудитория">
              <SelectValue placeholder="Кому" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Кому: любая</SelectItem>
              {Object.entries(AUDIENCE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={age} onValueChange={setAge}>
            <SelectTrigger aria-label="Возраст">
              <SelectValue placeholder="Возраст" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Возраст: любой</SelectItem>
              {Object.entries(AGE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger aria-label="Формат">
              <SelectValue placeholder="Формат" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Формат: любой</SelectItem>
              {Object.entries(FORMAT_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="mt-10 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Подбираю видео…
          </div>
        )}

        {error && <p className="mt-10 text-destructive">{error}</p>}

        {result?.urgent && (
          <div className="mt-8 rounded-xl border border-destructive/40 bg-destructive/10 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold text-foreground">Похоже на острую ситуацию</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Если боль возникла резко, мошонка отекла или изменила цвет — не ждите. Обратитесь
                  в приёмное отделение детской больницы или вызовите скорую помощь.
                </p>
                <Button asChild variant="destructive" size="sm" className="mt-3">
                  <a href="tel:103">
                    <Phone className="mr-2 h-4 w-4" /> 103
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {result?.answer && (
          <div className="mt-8 rounded-xl border border-border bg-card p-5">
            <p className="whitespace-pre-line text-foreground">{result.answer}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              Это информация для понимания ситуации, а не назначение. Решение принимается на приёме.
            </p>
          </div>
        )}

        {!!result?.sources?.length && (
          <div className="mt-10">
            <h2 className="mb-5 text-xl font-semibold text-foreground">Видео по вашему вопросу</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {result.sources.map((s) => (
                <div key={s.slug} className="space-y-2">
                  <VideoCard video={s} startSec={s.start_sec} />
                  {!!s.same_cluster.length && (
                    <p className="text-xs text-muted-foreground">
                      Ещё по теме: {s.same_cluster.map((c) => c.title).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!!result?.related_questions?.length && (
          <div className="mt-10">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Похожие вопросы</h2>
            <div className="flex flex-wrap gap-2">
              {result.related_questions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuery(q)}
                  className="rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {result && !result.sources.length && !loading && (
          <p className="mt-10 text-muted-foreground">
            По этому запросу видео пока нет. Попробуйте описать ситуацию другими словами.
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoSearchPage;
