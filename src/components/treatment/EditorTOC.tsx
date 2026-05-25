import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, FlaskConical, Wallet, Share2, Menu } from "lucide-react";
import { SECTIONS, TreatmentCategory } from "./sections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface EditorTOCProps {
  counts: Record<string, number>;
  labControlEnabled: boolean;
  isPublic: boolean;
  hasPlan: boolean;
}

interface TocEntry {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

function buildEntries(p: EditorTOCProps): TocEntry[] {
  const list: TocEntry[] = SECTIONS.map(s => ({
    key: s.key,
    label: s.short,
    icon: s.icon,
    count: p.counts[s.key] || 0,
  }));
  if (p.labControlEnabled) list.push({ key: "lab-control", label: "Лабконтроль", icon: FlaskConical });
  if (p.hasPlan) list.push({ key: "cost", label: "Стоимость", icon: Wallet });
  if (p.isPublic) list.push({ key: "public", label: "Публикация", icon: Share2 });
  return list;
}

function scrollToSection(key: string) {
  const el = document.querySelector<HTMLElement>(`[data-section-key="${key}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function useActiveSection(keys: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const targets = keys
      .map(k => document.querySelector<HTMLElement>(`[data-section-key="${k}"]`))
      .filter((x): x is HTMLElement => !!x);
    if (!targets.length) return;
    const visible = new Map<string, number>();
    const obs = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          const k = e.target.getAttribute("data-section-key");
          if (!k) continue;
          if (e.isIntersecting) visible.set(k, e.intersectionRatio);
          else visible.delete(k);
        }
        let best: string | null = null;
        let bestRatio = -1;
        for (const [k, r] of visible) {
          if (r > bestRatio) { bestRatio = r; best = k; }
        }
        if (best) setActive(best);
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    targets.forEach(t => obs.observe(t));
    return () => obs.disconnect();
  }, [keys.join("|")]);
  return active;
}

function TOCList({ entries, active, collapsed, onPick }: {
  entries: TocEntry[]; active: string | null; collapsed: boolean;
  onPick: (k: string) => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      {entries.map(e => {
        const Icon = e.icon;
        const isActive = active === e.key;
        const empty = e.count === 0;
        return (
          <button
            key={e.key}
            type="button"
            onClick={() => onPick(e.key)}
            title={collapsed ? `${e.label}${e.count ? ` (${e.count})` : ""}` : undefined}
            className={cn(
              "group flex items-center gap-2 rounded-md text-left transition-colors min-h-[36px]",
              collapsed ? "justify-center px-0 w-10" : "px-2",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              empty && !isActive && "opacity-60"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="text-sm truncate flex-1">{e.label}</span>
                {e.count != null && e.count > 0 && (
                  <Badge variant={isActive ? "default" : "secondary"} className="h-5 px-1.5 text-[10px]">
                    {e.count}
                  </Badge>
                )}
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export function EditorTOC(props: EditorTOCProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const entries = buildEntries(props);
  const active = useActiveSection(entries.map(e => e.key));

  const handlePick = (k: string) => {
    scrollToSection(k);
    setMobileOpen(false);
  };

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile trigger */}
      <div className="lg:hidden fixed bottom-4 left-4 z-30">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="h-12 w-12 rounded-full shadow-lg" aria-label="Содержание">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 mt-2">
              Содержание
            </div>
            <TOCList entries={entries} active={active} collapsed={false} onPick={handlePick} />
            <div className="mt-4 pt-3 border-t">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={scrollTop}>
                <ChevronUp className="w-4 h-4" />К началу
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0 sticky self-start top-4 max-h-[calc(100vh-2rem)] overflow-y-auto",
          "border rounded-lg bg-card p-2 transition-[width] duration-200",
          collapsed ? "w-12" : "w-60"
        )}
      >
        <div className={cn("flex items-center mb-2", collapsed ? "justify-center" : "justify-between px-1")}>
          {!collapsed && (
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Содержание
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Развернуть" : "Свернуть"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
        <TOCList entries={entries} active={active} collapsed={collapsed} onPick={handlePick} />
        <div className={cn("mt-3 pt-2 border-t", collapsed ? "px-0" : "px-1")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollTop}
            className={cn("w-full gap-2", collapsed ? "px-0 justify-center" : "justify-start")}
            title="К началу"
          >
            <ChevronUp className="w-4 h-4" />
            {!collapsed && <span>К началу</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
