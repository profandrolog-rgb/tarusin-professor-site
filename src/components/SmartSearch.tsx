import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Search, Loader2, BookOpen, Video, Stethoscope, FileText, Microscope, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type SmartResult = {
  kind: "disease" | "blog" | "video" | "clinical" | "research";
  id: string;
  title: string;
  excerpt: string;
  url: string;
  reason?: string;
  category?: string | null;
};

const KIND_META: Record<SmartResult["kind"], { label: string; icon: typeof BookOpen }> = {
  disease: { label: "Заболевание", icon: Stethoscope },
  blog: { label: "Статья", icon: FileText },
  video: { label: "Видео", icon: Video },
  clinical: { label: "Клинический случай", icon: BookOpen },
  research: { label: "Исследование", icon: Microscope },
};

const SUGGESTIONS = [
  "У ребёнка не опустилось яичко",
  "Когда оперировать варикоцеле?",
  "Преждевременная эякуляция, лечение",
  "Фимоз у мальчика 5 лет",
];

const SmartSearch = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SmartResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async (q: string) => {
    if (!q.trim() || q.trim().length < 3) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("smart-search", { body: { query: q } });
      if (error) throw error;
      setResults((data?.results ?? []) as SmartResult[]);
    } catch (e: any) {
      setError("Не удалось выполнить поиск. Попробуйте чуть позже.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  return (
    <section className="container mx-auto px-4 py-10 md:py-14">
      <div className="relative max-w-4xl mx-auto">
        {/* Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-2xl opacity-60" aria-hidden />

        <div className="relative rounded-3xl border border-border bg-card/95 backdrop-blur-sm shadow-xl p-6 md:p-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Умный поиск
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Не тратьте время на поиски — спросите своими словами
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl">
            На сайте собран большой объём материалов о заболеваниях и методах лечения: статьи,
            видео, клинические случаи и исследования. Напишите свой вопрос — я подберу для Вас
            самые подходящие материалы.
          </p>

          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Например: водянка яичка у ребёнка 3 лет"
                className="pl-10 h-12 text-base"
                maxLength={300}
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-6" disabled={loading || query.trim().length < 3}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? "Подбираю..." : "Найти"}
            </Button>
          </form>

          {!results && !loading && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center mr-1">Популярные вопросы:</span>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setQuery(s); runSearch(s); }}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          {loading && (
            <div className="mt-6 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          )}

          {results && !loading && (
            <div className="mt-6">
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  По Вашему запросу подходящих материалов не нашлось. Попробуйте переформулировать вопрос
                  или воспользуйтесь чатом внизу страницы.
                </p>
              ) : (
                <>
                  <div className="text-xs text-muted-foreground mb-3">
                    Нашёл {results.length} подходящих материалов:
                  </div>
                  <ul className="space-y-3">
                    {results.map((r) => {
                      const Meta = KIND_META[r.kind];
                      const Icon = Meta.icon;
                      return (
                        <li key={`${r.kind}-${r.id}`}>
                          <Link
                            to={r.url}
                            className="group flex gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-accent/5 transition-all"
                          >
                            <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-primary/80">
                                  {Meta.label}
                                </span>
                                {r.category && (
                                  <span className="text-[10px] text-muted-foreground">· {r.category}</span>
                                )}
                              </div>
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                                {r.title}
                              </h3>
                              {r.reason && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.reason}</p>
                              )}
                            </div>
                            <ArrowRight className="shrink-0 w-4 h-4 text-muted-foreground self-center group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SmartSearch;
