import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, AlertTriangle, Save, Move } from "lucide-react";
import { toast } from "sonner";

interface Acupoint {
  id: string;
  who_code: string;
  pinyin: string | null;
  name_ru: string | null;
  meridian_id: string | null;
  location_description: string | null;
  depth_mm: string | null;
  manipulation_default: string | null;
  indications: string | null;
  contraindications: string | null;
  is_caution: boolean;
  svg_view: string | null;
  svg_marker_x: number | null;
  svg_marker_y: number | null;
}

const VIEWS = [
  { key: "front", label: "Передняя" },
  { key: "back", label: "Задняя" },
  { key: "side", label: "Боковая" },
  { key: "head", label: "Голова" },
  { key: "hand", label: "Кисть" },
  { key: "foot", label: "Стопа" },
];

// Simple anatomical schematic (placeholder) — silhouette is decorative; clickable layer is the markers themselves.
function BodySilhouette({ view }: { view: string }) {
  // basic head+torso+limbs proportions in a 200×500 viewBox
  if (view === "front" || view === "back") {
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.2" className="text-muted-foreground/40">
        <ellipse cx="100" cy="40" rx="22" ry="28"/>
        <path d="M82 65 L72 95 L60 200 L55 320 L60 480 L80 480 L88 350 L100 200 L112 350 L120 480 L140 480 L145 320 L140 200 L128 95 L118 65 Z"/>
        <path d="M75 100 L40 240 L48 360 L62 360 L58 240 L80 130"/>
        <path d="M125 100 L160 240 L152 360 L138 360 L142 240 L120 130"/>
      </g>
    );
  }
  if (view === "side") {
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.2" className="text-muted-foreground/40">
        <ellipse cx="105" cy="40" rx="20" ry="28"/>
        <path d="M100 65 L90 120 L95 220 L90 320 L95 480 L115 480 L120 320 L115 220 L120 120 Z"/>
      </g>
    );
  }
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.2" className="text-muted-foreground/40">
      <rect x="60" y="40" width="80" height="420" rx="40"/>
    </g>
  );
}

export default function AdminAcupointsAtlas() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(true);
  const [points, setPoints] = useState<Acupoint[]>([]);
  const [view, setView] = useState("front");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Acupoint | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draftCoords, setDraftCoords] = useState<Record<string, { x: number; y: number; view: string }>>({});

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth", { state: { from: "/admin/acupoints/atlas" } });
  }, [user, isAdmin, loading, navigate]);

  const load = async () => {
    setBusy(true);
    const { data } = await supabase.from("acupoints").select("*").order("who_code");
    setPoints(((data as any) || []) as Acupoint[]);
    setBusy(false);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return points.filter(p => {
      const v = draftCoords[p.id]?.view ?? p.svg_view ?? "front";
      if (v !== view) return false;
      if (!s) return true;
      return p.who_code.toLowerCase().includes(s)
        || (p.pinyin || "").toLowerCase().includes(s)
        || (p.name_ru || "").toLowerCase().includes(s);
    });
  }, [points, view, q, draftCoords]);

  const unplacedHere = useMemo(() => points.filter(p => {
    const v = draftCoords[p.id]?.view ?? p.svg_view;
    const x = draftCoords[p.id]?.x ?? p.svg_marker_x;
    return (!v || v !== view) && !x && view === "front";
  }), [points, view, draftCoords]);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!editMode || !open) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const loc = pt.matrixTransform(ctm.inverse());
    setDraftCoords(prev => ({ ...prev, [open.id]: { x: +loc.x.toFixed(1), y: +loc.y.toFixed(1), view } }));
    toast.success(`Координаты ${loc.x.toFixed(0)}, ${loc.y.toFixed(0)} — нажмите «Сохранить»`);
  };

  const saveDrafts = async () => {
    const entries = Object.entries(draftCoords);
    if (!entries.length) { toast.info("Нет изменений"); return; }
    for (const [id, c] of entries) {
      const { error } = await supabase.from("acupoints").update({
        svg_marker_x: c.x, svg_marker_y: c.y, svg_view: c.view,
      } as any).eq("id", id);
      if (error) { toast.error(error.message); return; }
    }
    toast.success(`Сохранено координат: ${entries.length}`);
    setDraftCoords({});
    await load();
  };

  if (loading || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/admin/acupoints"><ArrowLeft className="w-4 h-4 mr-2"/>К каталогу</Link></Button>
            <h1 className="text-xl font-bold">Анатомический атлас точек</h1>
          </div>
          <div className="flex gap-2 items-center">
            <Button variant={editMode ? "default" : "outline"} size="sm" onClick={() => setEditMode(!editMode)}>
              <Move className="w-4 h-4 mr-2"/>{editMode ? "Режим расстановки ВКЛ" : "Расставить точки"}
            </Button>
            {Object.keys(draftCoords).length > 0 && (
              <Button size="sm" onClick={saveDrafts}><Save className="w-4 h-4 mr-2"/>Сохранить ({Object.keys(draftCoords).length})</Button>
            )}
          </div>
        </div>

        {editMode && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="py-3 text-sm">
              <strong>Режим расстановки:</strong> выберите точку в списке справа → кликните на схеме, чтобы установить координату. Затем нажмите «Сохранить».
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-12 gap-4">
          {/* Left: SVG */}
          <Card className="col-span-12 lg:col-span-7">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <Select value={view} onValueChange={setView}>
                  <SelectTrigger className="w-44"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {VIEWS.map(v => <SelectItem key={v.key} value={v.key}>{v.label} проекция</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">Точек на проекции: {filtered.length}</span>
              </div>
              <div className="bg-muted/20 rounded-lg p-2">
                <svg
                  viewBox="0 0 200 500"
                  className={`w-full h-auto max-h-[75vh] ${editMode ? "cursor-crosshair" : ""}`}
                  onClick={handleSvgClick}
                >
                  <BodySilhouette view={view}/>
                  {filtered.map(p => {
                    const c = draftCoords[p.id];
                    const x = c?.x ?? p.svg_marker_x ?? 0;
                    const y = c?.y ?? p.svg_marker_y ?? 0;
                    if (!x || !y) return null;
                    const isDraft = !!c;
                    return (
                      <g key={p.id} onClick={(e) => { e.stopPropagation(); if (!editMode) setOpen(p); }}
                         className={editMode ? "" : "cursor-pointer"}>
                        <circle cx={x} cy={y} r={4}
                          className={p.is_caution ? "fill-amber-500" : "fill-primary"}
                          stroke={isDraft ? "hsl(var(--accent))" : "hsl(var(--background))"} strokeWidth="1.5"/>
                        <text x={x + 6} y={y + 3} className="fill-foreground" style={{ fontSize: "6px" }}>{p.who_code}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* Right: point list */}
          <Card className="col-span-12 lg:col-span-5">
            <CardContent className="pt-6 space-y-3">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск точки…"/>
              {busy ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary"/></div>
              ) : (
                <div className="space-y-1 max-h-[65vh] overflow-y-auto">
                  {editMode && unplacedHere.length > 0 && (
                    <div className="text-xs text-muted-foreground py-2">
                      Не расставленные точки ({unplacedHere.length}). Кликните любую, затем место на схеме.
                    </div>
                  )}
                  {(editMode ? points : filtered).map(p => (
                    <button key={p.id} type="button"
                      onClick={() => setOpen(p)}
                      className={`w-full text-left px-3 py-1.5 rounded hover:bg-muted flex items-center gap-2 ${open?.id === p.id ? "bg-muted" : ""}`}>
                      <Badge variant="outline" className="font-mono text-xs shrink-0">{p.who_code}</Badge>
                      <span className="truncate text-sm">{p.name_ru || p.pinyin}</span>
                      {p.is_caution && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0"/>}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={!!open && !editMode} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="overflow-y-auto">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">{open.who_code}</Badge>
                  {open.name_ru || open.pinyin}
                </SheetTitle>
                <SheetDescription>{open.pinyin} {open.location_description ? `· ${open.location_description}` : ""}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                {open.is_caution && (
                  <div className="border border-amber-500/50 bg-amber-500/10 rounded p-3 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"/>
                    <span>Точка осторожного применения</span>
                  </div>
                )}
                {open.depth_mm && <div><strong>Глубина:</strong> {open.depth_mm}</div>}
                {open.manipulation_default && <div><strong>Манипуляция:</strong> {open.manipulation_default}</div>}
                {open.indications && <div><strong>Показания:</strong><br/>{open.indications}</div>}
                {open.contraindications && <div><strong>Противопоказания:</strong><br/>{open.contraindications}</div>}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {editMode && open && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card border shadow-lg rounded-lg px-4 py-2 flex items-center gap-3 z-50">
          <Badge variant="outline" className="font-mono">{open.who_code}</Badge>
          <span className="text-sm">Кликните на схеме место точки</span>
          <Button variant="ghost" size="sm" onClick={() => setOpen(null)}>Отмена</Button>
        </div>
      )}
    </div>
  );
}
