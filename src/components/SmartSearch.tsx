import { useState, useEffect, useRef, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Search, Loader2, BookOpen, Video, Stethoscope, FileText, Microscope, ArrowRight, TrendingUp, Headphones, Film } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { saveTrail, loadTrail } from "@/lib/smartSearchTrail";

type SmartResult = {
  kind: "disease" | "blog" | "video" | "clinical" | "research" | "podcast" | "video_file";
  id: string;
  title: string;
  excerpt: string;
  url: string;
  reason?: string;
  category?: string | null;
};

type Suggestion = {
  kind: SmartResult["kind"] | "popular";
  title: string;
  url?: string;
};

const KIND_META: Record<SmartResult["kind"], { label: string; icon: typeof BookOpen }> = {
  disease: { label: "Заболевание", icon: Stethoscope },
  blog: { label: "Статья", icon: FileText },
  video: { label: "Видео", icon: Video },
  clinical: { label: "Клинический случай", icon: BookOpen },
  research: { label: "Исследование", icon: Microscope },
};

const POPULAR = [
  "У ребёнка не опустилось яичко",
  "Когда оперировать варикоцеле?",
  "Преждевременная эякуляция, лечение",
  "Фимоз у мальчика 5 лет",
  "Водянка яичка у новорождённого",
  "Гипоспадия — когда оперировать",
  "Боль в мошонке у подростка",
  "Энурез у ребёнка 7 лет",
];

const SmartSearch = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SmartResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [focused, setFocused] = useState(false);
  const [autocomplete, setAutocomplete] = useState<Suggestion[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Click outside closes dropdown
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced autocomplete: titles from disease_articles + blog_posts
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setAutocomplete([]); return; }
    const handle = setTimeout(async () => {
      try {
        const term = `%${q}%`;
        const sb = supabase as any;
        const [diseases, blogs, videos] = await Promise.all([
          sb.from("disease_articles").select("id, title, slug").ilike("title", term).eq("published", true).limit(4),
          sb.from("blog_posts").select("id, title, slug").ilike("title", term).limit(4),
          sb.from("video_cases").select("id, title").ilike("title", term).limit(3),
        ]);
        const items: Suggestion[] = [];
        (diseases.data ?? []).forEach((r: any) => items.push({ kind: "disease", title: r.title, url: `/for-parents/${r.slug}` }));
        (blogs.data ?? []).forEach((r: any) => items.push({ kind: "blog", title: r.title, url: `/blog#post-${r.slug ?? r.id}` }));
        (videos.data ?? []).forEach((r: any) => items.push({ kind: "video", title: r.title, url: `/video-cases#video-${r.id}` }));
        setAutocomplete(items.slice(0, 8));
      } catch {
        setAutocomplete([]);
      }
    }, 220);
    return () => clearTimeout(handle);
  }, [query]);

  const runSearch = async (q: string) => {
    if (!q.trim() || q.trim().length < 3) return;
    setFocused(false);
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("smart-search", { body: { query: q } });
      if (error) throw error;
      const list = (data?.results ?? []) as SmartResult[];
      setResults(list);
      if (list.length) {
        saveTrail({
          query: q.trim(),
          results: list.map((r) => ({ kind: r.kind, id: r.id, title: r.title, url: r.url, category: r.category, reason: r.reason })),
        });
      }
    } catch (e: any) {
      setError("Не удалось выполнить поиск. Попробуйте чуть позже.");
    } finally {
      setLoading(false);
    }
  };

  // Restore the most recent search when the visitor returns to the homepage.
  useEffect(() => {
    if (results) return;
    const trail = loadTrail();
    if (!trail) return;
    setQuery(trail.query);
    setResults(trail.results.map((r) => ({
      kind: r.kind, id: r.id, title: r.title, url: r.url, excerpt: "", reason: r.reason, category: r.category,
    })));
    // If user explicitly asked to return, scroll into view.
    if (typeof window !== "undefined" && window.location.search.includes("smart=restore")) {
      setTimeout(() => {
        document.getElementById("smart-search")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  // Build dropdown items: filtered popular + autocomplete
  const popularFiltered = (() => {
    const q = query.trim().toLowerCase();
    const base = q ? POPULAR.filter((p) => p.toLowerCase().includes(q)) : POPULAR;
    return base.slice(0, 5);
  })();

  const dropdownItems: Suggestion[] = [
    ...autocomplete,
    ...popularFiltered.map<Suggestion>((title) => ({ kind: "popular", title })),
  ];

  const showDropdown = focused && dropdownItems.length > 0;

  const pickItem = (item: Suggestion) => {
    if (item.url) {
      window.location.href = item.url;
      return;
    }
    setQuery(item.title);
    runSearch(item.title);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, dropdownItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      pickItem(dropdownItems[activeIdx]);
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };

  return (
    <section id="smart-search" className="container mx-auto px-4 py-10 md:py-14 scroll-mt-24">
      <div className="relative max-w-4xl mx-auto">
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
            <div ref={wrapRef} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIdx(-1); }}
                onFocus={() => setFocused(true)}
                onKeyDown={onKeyDown}
                placeholder="Например: водянка яичка у ребёнка 3 лет"
                className="pl-10 h-12 text-base"
                maxLength={300}
                autoComplete="off"
              />

              {showDropdown && (
                <div className="absolute z-50 left-0 right-0 top-[calc(100%+6px)] rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
                  {autocomplete.length > 0 && (
                    <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Подходящие материалы
                    </div>
                  )}
                  {autocomplete.map((item, idx) => {
                    const Meta = KIND_META[item.kind as SmartResult["kind"]];
                    const Icon = Meta?.icon ?? FileText;
                    const active = idx === activeIdx;
                    return (
                      <button
                        key={`ac-${idx}`}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); pickItem(item); }}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${active ? "bg-accent" : "hover:bg-accent/60"}`}
                      >
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="flex-1 truncate">{item.title}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{Meta?.label}</span>
                      </button>
                    );
                  })}

                  {popularFiltered.length > 0 && (
                    <>
                      {autocomplete.length > 0 && <div className="h-px bg-border" />}
                      <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        Популярные вопросы
                      </div>
                      {popularFiltered.map((title, i) => {
                        const idx = autocomplete.length + i;
                        const active = idx === activeIdx;
                        return (
                          <button
                            key={`pop-${i}`}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); pickItem({ kind: "popular", title }); }}
                            onMouseEnter={() => setActiveIdx(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${active ? "bg-accent" : "hover:bg-accent/60"}`}
                          >
                            <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="flex-1 truncate">{title}</span>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
            <Button type="submit" size="lg" className="h-12 px-6" disabled={loading || query.trim().length < 3}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? "Подбираю..." : "Найти"}
            </Button>
          </form>

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
