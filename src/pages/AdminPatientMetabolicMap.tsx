import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Activity, AlertTriangle, Info, ShieldAlert, Pill, Sparkles } from "lucide-react";

type Patient = { id: string; full_name: string; birth_date: string | null; history_number: string | null };
type Pathway = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  nodes: Array<{ id: string; label: string; x?: number; y?: number; kind?: string }>;
  edges: Array<{ from: string; to: string; label?: string }>;
};
type Finding = {
  id: string;
  pathway_id: string | null;
  node_id: string | null;
  severity: "info" | "warn" | "critical" | string;
  label: string;
  detail: string | null;
  source_ref: any;
  created_at: string;
};
type Recommendation = {
  id: string;
  catalog_id: string | null;
  target_node_id: string | null;
  application_point: string | null;
  rationale: string | null;
  priority: number;
  is_accepted: boolean | null;
  catalog?: { name: string; subcategory: string | null } | null;
};

const SEVERITY_META: Record<string, { label: string; icon: any; cls: string }> = {
  critical: { label: "Критично", icon: ShieldAlert, cls: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-300" },
  warn: { label: "Внимание", icon: AlertTriangle, cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300" },
  info: { label: "Инфо", icon: Info, cls: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300" },
};

export default function AdminPatientMetabolicMap() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();

  const [busy, setBusy] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [mapId, setMapId] = useState<string | null>(null);
  const [mapNotes, setMapNotes] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setBusy(true);
      const [{ data: p }, { data: pw }, { data: m }] = await Promise.all([
        supabase.from("patients").select("id, full_name, birth_date, history_number").eq("id", id).maybeSingle(),
        (supabase as any).from("pathways").select("id, slug, name, description, nodes, edges").eq("is_active", true).order("name"),
        (supabase as any).from("metabolic_maps").select("id, notes").eq("patient_id", id).maybeSingle(),
      ]);
      setPatient(p as any);
      setPathways((pw as any) || []);
      setMapId(m?.id || null);
      setMapNotes(m?.notes || null);

      if (m?.id) {
        const [{ data: f }, { data: r }] = await Promise.all([
          (supabase as any).from("map_findings")
            .select("id, pathway_id, node_id, severity, label, detail, source_ref, created_at")
            .eq("map_id", m.id)
            .order("created_at", { ascending: false }),
          (supabase as any).from("map_recommendations")
            .select("id, catalog_id, target_node_id, application_point, rationale, priority, is_accepted, catalog:treatment_catalog(name, subcategory)")
            .eq("map_id", m.id)
            .order("priority", { ascending: false }),
        ]);
        setFindings((f as any) || []);
        setRecs((r as any) || []);
      } else {
        setFindings([]);
        setRecs([]);
      }
      setBusy(false);
    })();
  }, [id]);

  const findingsByPathway = useMemo(() => {
    const map = new Map<string, Finding[]>();
    for (const f of findings) {
      const key = f.pathway_id || "_unbound";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
    return map;
  }, [findings]);

  if (loading || busy) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!patient) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Пациент не найден</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>{`Метаболическая карта — ${patient.full_name}`}</title><meta name="robots" content="noindex" /></Helmet>

      <div className="container mx-auto px-4 py-8 space-y-6 max-w-6xl">
        <Link to={`/admin/patients/${patient.id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />К пациенту
        </Link>

        <header className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
              <Activity className="w-7 h-7 text-primary" />
              Метаболическая карта
            </h1>
            <p className="text-muted-foreground text-sm">
              {patient.full_name}{patient.history_number ? ` · № ИБ ${patient.history_number}` : ""}
            </p>
          </div>
          <Badge variant="secondary" className="gap-1"><Sparkles className="w-3 h-3" />Этап 1 · просмотр</Badge>
        </header>

        {!mapId && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>Карта для этого пациента ещё не создана.</p>
              <p className="text-xs mt-2">Редактор карты появится на следующем этапе.</p>
            </CardContent>
          </Card>
        )}

        {mapNotes && (
          <Card>
            <CardHeader><CardTitle className="text-base">Заметки</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm">{mapNotes}</p></CardContent>
          </Card>
        )}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Метаболические пути</h2>
          {pathways.length === 0 ? (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">Справочник путей ещё пуст.</CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {pathways.map(pw => {
                const pwFindings = findingsByPathway.get(pw.id) || [];
                const affectedNodes = new Set(pwFindings.map(f => f.node_id).filter(Boolean) as string[]);
                return (
                  <Card key={pw.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between gap-2">
                        <span>{pw.name}</span>
                        {pwFindings.length > 0 && (
                          <Badge variant="destructive" className="text-xs">{pwFindings.length}</Badge>
                        )}
                      </CardTitle>
                      {pw.description && <p className="text-xs text-muted-foreground">{pw.description}</p>}
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <PathwaySVG pathway={pw} highlight={affectedNodes} />
                      {pwFindings.length > 0 && (
                        <ul className="space-y-1 text-xs">
                          {pwFindings.map(f => {
                            const meta = SEVERITY_META[f.severity] || SEVERITY_META.info;
                            const Icon = meta.icon;
                            return (
                              <li key={f.id} className={`flex items-start gap-2 rounded border px-2 py-1 ${meta.cls}`}>
                                <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">{f.label}</div>
                                  {f.detail && <div className="opacity-80">{f.detail}</div>}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {findingsByPathway.get("_unbound")?.length ? (
          <Card>
            <CardHeader><CardTitle className="text-base">Отклонения вне путей</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {findingsByPathway.get("_unbound")!.map(f => {
                  const meta = SEVERITY_META[f.severity] || SEVERITY_META.info;
                  const Icon = meta.icon;
                  return (
                    <li key={f.id} className={`flex items-start gap-2 rounded border px-2 py-1 ${meta.cls}`}>
                      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                      <div><div className="font-medium">{f.label}</div>{f.detail && <div className="text-xs opacity-80">{f.detail}</div>}</div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2"><Pill className="w-5 h-5" />Рекомендации</h2>
          {recs.length === 0 ? (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">Рекомендаций пока нет.</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {recs.map(r => (
                    <li key={r.id} className="p-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{r.catalog?.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.catalog?.subcategory && <span>{r.catalog.subcategory}</span>}
                          {r.application_point && <span> · точка приложения: {r.application_point}</span>}
                          {r.target_node_id && <span> · узел: {r.target_node_id}</span>}
                        </div>
                        {r.rationale && <div className="text-xs mt-1">{r.rationale}</div>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline">P{r.priority}</Badge>
                        {r.is_accepted === true && <Badge>принято</Badge>}
                        {r.is_accepted === false && <Badge variant="secondary">отклонено</Badge>}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </section>

        <div className="pt-6 text-xs text-muted-foreground border-t">
          Модуль в разработке. Этап 1 — только просмотр. Редактор путей, автоагрегация анализов и отправка во внешний ИИ появятся на следующих этапах.
        </div>
      </div>
    </div>
  );
}

/**
 * Простая SVG-визуализация пути.
 * Если у узлов заданы x/y — расставляем по ним, иначе укладываем по горизонтали.
 * Подсвечиваем узлы из highlight (id узла) красной обводкой.
 */
function PathwaySVG({ pathway, highlight }: { pathway: Pathway; highlight: Set<string> }) {
  const nodes = pathway.nodes || [];
  if (nodes.length === 0) {
    return <div className="text-xs text-muted-foreground italic px-2 py-4">Схема пути пока не задана</div>;
  }
  const W = 600, H = 180, PAD = 40;
  const positioned = nodes.map((n, i) => {
    const x = typeof n.x === "number" ? n.x : PAD + ((W - PAD * 2) * i) / Math.max(1, nodes.length - 1);
    const y = typeof n.y === "number" ? n.y : H / 2;
    return { ...n, x, y };
  });
  const byId = new Map(positioned.map(n => [n.id, n]));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded bg-muted/30">
      {(pathway.edges || []).map((e, i) => {
        const a = byId.get(e.from), b = byId.get(e.to);
        if (!a || !b) return null;
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} markerEnd="url(#arrow)" />
            {e.label && (
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">{e.label}</text>
            )}
          </g>
        );
      })}
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))" />
        </marker>
      </defs>
      {positioned.map(n => {
        const hot = highlight.has(n.id);
        return (
          <g key={n.id}>
            <circle
              cx={n.x} cy={n.y} r={14}
              fill={hot ? "hsl(0 84% 60% / 0.15)" : "hsl(var(--background))"}
              stroke={hot ? "hsl(0 84% 60%)" : "hsl(var(--border))"}
              strokeWidth={hot ? 2.5 : 1.5}
            />
            <text x={n.x} y={n.y + 30} textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">{n.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
