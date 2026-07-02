import { Fragment, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, ScaleIcon, Sparkles, Beaker, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { SEVERITY_LABEL, type Severity, type PathwaySummary } from "@/lib/metabolic/aggregator";

type Finding = {
  id: string;
  pathway_id: string | null;
  node_id: string | null;
  severity: string;
  label: string;
  detail: string | null;
  source_ref: any;
};

type Pathway = { id: string; slug: string; name: string };

type AiPathway = {
  pathway_code: string;
  status?: Severity | string;
  confidence?: number;
  text_plain?: string;
  text_pro?: string;
  markers?: Array<{ code?: string; name?: string; value?: any; unit?: string; flag?: string }>;
};

const STATUS_ORDER: Record<string, number> = {
  no_data: 0, norm: 1, mild: 2, moderate: 3, severe: 4,
};

const STATUS_CLS: Record<string, string> = {
  no_data: "bg-muted text-muted-foreground",
  norm: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  mild: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  moderate: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  severe: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
};

function agreement(rulesStatus: string, aiStatus?: string): "match" | "close" | "diverge" | "n/a" {
  if (!aiStatus) return "n/a";
  const a = STATUS_ORDER[rulesStatus] ?? -1;
  const b = STATUS_ORDER[aiStatus] ?? -1;
  if (a < 0 || b < 0) return "n/a";
  const d = Math.abs(a - b);
  if (d === 0) return "match";
  if (d === 1) return "close";
  return "diverge";
}

const AGREEMENT_META: Record<string, { label: string; cls: string; Icon: any }> = {
  match: { label: "совпало", cls: "bg-emerald-100 text-emerald-800 border-emerald-300", Icon: CheckCircle2 },
  close: { label: "близко", cls: "bg-amber-100 text-amber-800 border-amber-300", Icon: AlertTriangle },
  diverge: { label: "расхождение", cls: "bg-red-100 text-red-800 border-red-300", Icon: XCircle },
  "n/a": { label: "нет ИИ", cls: "bg-muted text-muted-foreground border-border", Icon: ScaleIcon },
};

export interface AuditPanelProps {
  pathways: Pathway[];
  summary: PathwaySummary[];
  findings: Finding[];
  ai: { pathways?: AiPathway[]; model?: string; computed_at?: string } | null;
}

export function AuditPanel({ pathways, summary, findings, ai }: AuditPanelProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "diverge" | "affected">("all");

  const sumById = useMemo(() => {
    const m = new Map<string, PathwaySummary>();
    for (const s of summary) m.set(s.pathway_id, s);
    return m;
  }, [summary]);

  const aiBySlug = useMemo(() => {
    const m = new Map<string, AiPathway>();
    for (const p of ai?.pathways || []) m.set(p.pathway_code, p);
    return m;
  }, [ai]);

  const findingsByPw = useMemo(() => {
    const m = new Map<string, { rules: Finding[]; aiOnly: Finding[] }>();
    for (const f of findings) {
      const key = f.pathway_id || "_";
      if (!m.has(key)) m.set(key, { rules: [], aiOnly: [] });
      const bucket = m.get(key)!;
      if (f.source_ref?.rule_id) bucket.rules.push(f);
      else bucket.aiOnly.push(f);
    }
    return m;
  }, [findings]);

  const rows = pathways.map((pw) => {
    const s = sumById.get(pw.id);
    const rulesStatus = s?.status || "no_data";
    const aiP = aiBySlug.get(pw.slug);
    const aiStatus = (aiP?.status as string) || undefined;
    const agree = agreement(rulesStatus, aiStatus);
    const bucket = findingsByPw.get(pw.id) || { rules: [], aiOnly: [] };
    return { pw, s, rulesStatus, aiP, aiStatus, agree, bucket };
  });

  const filtered = rows.filter((r) => {
    if (filter === "diverge") return r.agree === "diverge" || r.agree === "close";
    if (filter === "affected") return ["mild", "moderate", "severe"].includes(r.rulesStatus) || ["mild", "moderate", "severe"].includes(r.aiStatus || "");
    return true;
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc[r.agree] = (acc[r.agree] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
          <ScaleIcon className="w-4 h-4 text-primary" />
          Аудит: правила ↔ ИИ
          <Badge variant="outline" className="ml-2">путей: {rows.length}</Badge>
          <Badge variant="outline" className={AGREEMENT_META.match.cls}>совпало: {totals.match || 0}</Badge>
          <Badge variant="outline" className={AGREEMENT_META.close.cls}>близко: {totals.close || 0}</Badge>
          <Badge variant="outline" className={AGREEMENT_META.diverge.cls}>расхождение: {totals.diverge || 0}</Badge>
          <Badge variant="outline">без ИИ: {totals["n/a"] || 0}</Badge>
        </CardTitle>
        <div className="flex items-center gap-2 pt-1">
          {(["all", "affected", "diverge"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}
            >
              {f === "all" ? "Все" : f === "affected" ? "Только с отклонениями" : "Только расхождения"}
            </button>
          ))}
          {ai?.model && (
            <span className="text-[11px] text-muted-foreground ml-auto">
              ИИ: {ai.model}{ai.computed_at ? ` · ${new Date(ai.computed_at).toLocaleString("ru-RU")}` : ""}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground text-left">
                <th className="py-2 pr-2 font-medium w-6"></th>
                <th className="py-2 pr-2 font-medium">Путь</th>
                <th className="py-2 pr-2 font-medium"><span className="inline-flex items-center gap-1"><Beaker className="w-3 h-3" />Правила</span></th>
                <th className="py-2 pr-2 font-medium"><span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3" />ИИ</span></th>
                <th className="py-2 pr-2 font-medium">Согласие</th>
                <th className="py-2 pr-2 font-medium text-right">Маркеров</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-muted-foreground italic">Нет строк по выбранному фильтру.</td></tr>
              )}
              {filtered.map((r) => {
                const open = openId === r.pw.id;
                const A = AGREEMENT_META[r.agree];
                return (
                  <>
                    <tr key={r.pw.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2 pr-1">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setOpenId(open ? null : r.pw.id)}>
                          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </Button>
                      </td>
                      <td className="py-2 pr-2 font-medium">{r.pw.name}<div className="text-[10px] text-muted-foreground font-normal">{r.pw.slug}</div></td>
                      <td className="py-2 pr-2">
                        <Badge variant="outline" className={STATUS_CLS[r.rulesStatus] || ""}>{SEVERITY_LABEL[r.rulesStatus as Severity] || r.rulesStatus}</Badge>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          сопоставлено: {r.s?.matched_markers ?? 0} · отклонений: {r.bucket.rules.length}
                        </div>
                      </td>
                      <td className="py-2 pr-2">
                        {r.aiStatus ? (
                          <>
                            <Badge variant="outline" className={STATUS_CLS[r.aiStatus] || ""}>{SEVERITY_LABEL[r.aiStatus as Severity] || r.aiStatus}</Badge>
                            {typeof r.aiP?.confidence === "number" && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                уверенность: {(r.aiP.confidence * 100).toFixed(0)}%
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-2">
                        <Badge variant="outline" className={`gap-1 ${A.cls}`}>
                          <A.Icon className="w-3 h-3" />{A.label}
                        </Badge>
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {(r.aiP?.markers?.length ?? 0)} / {(r.s?.matched_markers ?? 0)}
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-muted/20 border-b">
                        <td></td>
                        <td colSpan={5} className="py-3 pr-2">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <div className="text-[11px] font-semibold mb-1 flex items-center gap-1">
                                <Beaker className="w-3 h-3" />Правила · findings ({r.bucket.rules.length})
                              </div>
                              {r.bucket.rules.length === 0 ? (
                                <div className="text-[11px] text-muted-foreground italic">Ни одно правило не сработало.</div>
                              ) : (
                                <ul className="space-y-1">
                                  {r.bucket.rules.map((f) => (
                                    <li key={f.id} className="border rounded px-2 py-1">
                                      <div className="font-medium">{f.label}</div>
                                      {f.detail && <div className="text-muted-foreground text-[10px]">{f.detail}</div>}
                                      {f.source_ref?.rule_id && (
                                        <div className="text-[10px] text-muted-foreground">rule: {f.source_ref.rule_id}</div>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div>
                              <div className="text-[11px] font-semibold mb-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />ИИ · интерпретация
                              </div>
                              {!r.aiP ? (
                                <div className="text-[11px] text-muted-foreground italic">ИИ ещё не прогонялся по этому пути.</div>
                              ) : (
                                <div className="space-y-1">
                                  {r.aiP.text_pro && <p className="text-[11px]"><span className="font-medium">Про:</span> {r.aiP.text_pro}</p>}
                                  {r.aiP.text_plain && <p className="text-[11px]"><span className="font-medium">Просто:</span> {r.aiP.text_plain}</p>}
                                  {Array.isArray(r.aiP.markers) && r.aiP.markers.length > 0 && (
                                    <div className="text-[11px]">
                                      <span className="font-medium">Маркеры:</span>{" "}
                                      {r.aiP.markers.slice(0, 6).map((m, i) => (
                                        <span key={i} className="mr-2">
                                          {m.code || m.name}: {String(m.value)}{m.unit ? ` ${m.unit}` : ""}
                                          {m.flag && m.flag !== "normal" && <span className="text-amber-700"> [{m.flag}]</span>}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {r.bucket.aiOnly.length > 0 && (
                                    <div className="text-[11px] text-muted-foreground">
                                      Дополнительно ИИ-подсветок: {r.bucket.aiOnly.length}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {r.agree === "diverge" && (
                            <div className="mt-2 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-1">
                              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                              Правила и ИИ дают разные оценки — стоит проверить референсы, единицы измерения и правило.
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
