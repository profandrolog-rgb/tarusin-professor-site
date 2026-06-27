import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles, Stethoscope, FileText, Video, BookOpen, Microscope, Headphones, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadTrail, type SmartTrail, type SmartTrailItem } from "@/lib/smartSearchTrail";

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
  const norm = (u: string) => u.split("#")[0].split("?")[0].replace(/\/+$/, "");
  const here = norm(pathname);
  return items.findIndex((it) => {
    const u = norm(it.url);
    return u === here || here.startsWith(u + "/");
  });
}

const SmartSearchEndCTA = () => {
  const [trail, setTrail] = useState<SmartTrail | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const refresh = () => setTrail(loadTrail());
    refresh();
    window.addEventListener("smart-trail:changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("smart-trail:changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [location.pathname]);

  const currentIdx = useMemo(
    () => (trail ? matchIndex(trail.results, location.pathname) : -1),
    [trail, location.pathname],
  );

  if (!trail || trail.results.length === 0) return null;
  if (location.pathname === "/" || location.pathname === "") return null;
  if (currentIdx < 0) return null;

  // up to 3 other recommendations (skipping the current one)
  const others = trail.results.filter((_, i) => i !== currentIdx).slice(0, 3);
  const next = currentIdx < trail.results.length - 1 ? trail.results[currentIdx + 1] : null;

  return (
    <section className="container mx-auto px-4 my-10 print:hidden">
      <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-base md:text-lg font-semibold">
            Хотите узнать больше по теме?
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Вы пришли сюда по запросу <span className="text-foreground">«{trail.query}»</span>.
          Вернитесь к подборке или почитайте ещё материалы по этой теме.
        </p>

        {others.length > 0 && (
          <ul className="grid gap-2 mb-5 sm:grid-cols-2">
            {others.map((r) => {
              const Icon = KIND_ICON[r.kind] ?? FileText;
              return (
                <li key={`${r.kind}-${r.id}`}>
                  <Link
                    to={r.url}
                    className="group flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/40 transition-all h-full"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {KIND_LABEL[r.kind]}{r.category ? ` · ${r.category}` : ""}
                      </div>
                      <div className="text-sm leading-snug group-hover:text-primary line-clamp-2">
                        {r.title}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <Button
            variant="outline"
            className="sm:w-auto"
            onClick={() => navigate("/?smart=restore#smart-search")}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            К умному поиску
          </Button>
          <Button
            className="sm:w-auto"
            onClick={() => navigate((next ?? trail.results[0]).url)}
            title={next ? `Дальше: ${next.title}` : `К началу подборки: ${trail.results[0].title}`}
          >
            Почитать ещё по теме
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SmartSearchEndCTA;
