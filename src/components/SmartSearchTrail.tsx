import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles, X, List, ArrowUp, Stethoscope, FileText, Video, BookOpen, Microscope, Headphones, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadTrail, clearTrail, type SmartTrail, type SmartTrailItem } from "@/lib/smartSearchTrail";
import { cn } from "@/lib/utils";

const KIND_ICON = {
  disease: Stethoscope,
  blog: FileText,
  video: Video,
  clinical: BookOpen,
  research: Microscope,
  podcast: Headphones,
  video_file: Film,
} as const;

const KIND_LABEL = {
  disease: "Заболевание",
  blog: "Статья",
  video: "Видео",
  clinical: "Клинический случай",
  research: "Исследование",
  podcast: "Подкаст",
  video_file: "Видео",
} as const;

function matchIndex(items: SmartTrailItem[], pathname: string): number {
  // Strip hash/query for comparison
  const norm = (u: string) => u.split("#")[0].split("?")[0].replace(/\/+$/, "");
  const here = norm(pathname);
  return items.findIndex((it) => {
    const u = norm(it.url);
    return u === here || here.startsWith(u + "/");
  });
}

const SmartSearchTrail = () => {
  const [trail, setTrail] = useState<SmartTrail | null>(null);
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Subscribe to trail changes (storage + same-tab custom event)
  useEffect(() => {
    const refresh = () => setTrail(loadTrail());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("smart-trail:changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("smart-trail:changed", refresh);
    };
  }, []);

  // Close expanded panel on navigation
  useEffect(() => { setExpanded(false); }, [location.pathname]);

  const currentIdx = useMemo(
    () => (trail ? matchIndex(trail.results, location.pathname) : -1),
    [trail, location.pathname],
  );

  // Hide on the homepage (results are already visible there) and when no trail.
  if (!trail || trail.results.length === 0) return null;
  if (location.pathname === "/" || location.pathname === "") return null;

  const prev = currentIdx > 0 ? trail.results[currentIdx - 1] : null;
  const next = currentIdx >= 0 && currentIdx < trail.results.length - 1 ? trail.results[currentIdx + 1] : null;

  const goHomeWithResults = () => {
    // SmartSearch component restores results from sessionStorage on mount.
    navigate("/?smart=restore#smart-search");
  };

  return (
    <>
      {/* Floating compact bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[min(96vw,720px)] w-full px-3 print:hidden">
        <div className="relative rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-2 px-3 py-2">
            <button
              onClick={goHomeWithResults}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline shrink-0"
              title="К результатам поиска"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Подборка по запросу</span>
              <span className="sm:hidden">Подборка</span>
            </button>
            <span className="text-xs text-muted-foreground truncate flex-1 min-w-0" title={trail.query}>
              «{trail.query}»
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">
              {currentIdx >= 0 ? `${currentIdx + 1} из ${trail.results.length}` : `${trail.results.length} материалов`}
            </span>

            <div className="flex items-center gap-1 ml-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!prev}
                onClick={() => prev && navigate(prev.url)}
                title={prev ? `Предыдущий: ${prev.title}` : "Это первый материал"}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!next}
                onClick={() => next && navigate(next.url)}
                title={next ? `Следующий: ${next.title}` : "Это последний материал"}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", expanded && "bg-accent")}
                onClick={() => setExpanded((v) => !v)}
                title="Показать все"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={clearTrail}
                title="Закрыть подборку"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Expanded list */}
          {expanded && (
            <div className="border-t border-border max-h-[55vh] overflow-y-auto overscroll-contain p-2 space-y-1">
              {trail.results.map((r, i) => {
                const Icon = KIND_ICON[r.kind] ?? FileText;
                const active = i === currentIdx;
                return (
                  <Link
                    key={`${r.kind}-${r.id}`}
                    to={r.url}
                    onClick={() => setExpanded(false)}
                    className={cn(
                      "flex items-start gap-3 px-2 py-2 rounded-lg text-sm transition-colors",
                      active ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-accent/60",
                    )}
                  >
                    <div className="shrink-0 w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {KIND_LABEL[r.kind]}{r.category ? ` · ${r.category}` : ""}
                      </div>
                      <div className={cn("leading-snug truncate", active && "font-semibold text-primary")}>
                        {r.title}
                      </div>
                    </div>
                    {active && <span className="text-[10px] text-primary shrink-0 self-center">вы здесь</span>}
                  </Link>
                );
              })}
              <button
                onClick={goHomeWithResults}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary py-2 mt-1 border-t border-border"
              >
                <ArrowUp className="w-3 h-3" /> вернуться к умному поиску
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SmartSearchTrail;
