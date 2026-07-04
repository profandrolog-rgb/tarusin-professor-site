import { Fragment, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  ScaleIcon,
  Sparkles,
  Beaker,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  ShieldQuestion,
  Download,
} from "lucide-react";
import { SEVERITY_LABEL, type Severity, type PathwaySummary } from "@/lib/metabolic/aggregator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

type Divergence = "agree" | "escalation" | "deescalation" | "ai_only" | "rules_only";

type Review = {
  id: string;
  map_id: string;
  pathway_id: string;
  kept: "rules" | "ai";
  note: string | null;
  updated_at: string;
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

/**
 * Классификация расхождения. Правила — эталон, ИИ — рядом.
 *  - agree: одинаковый статус.
 *  - escalation: ИИ поднял тяжесть (учёл контекст).
 *  - deescalation: ИИ понизил тяжесть — модель «успокоила» правило (контроль).
 *  - ai_only: правила молчат (no_data/norm), ИИ дал mild+ статус — контекст или галлюцинация.
 *  - rules_only: правила сработали (mild+), ИИ отсутствует / no_data / norm.
 */
function classify(rulesStatus: string, aiStatus?: string): Divergence {
  const rulesActive = ["mild", "moderate", "severe"].includes(rulesStatus);
  const aiActive = aiStatus ? ["mild", "moderate", "severe"].includes(aiStatus) : false;
  if (!aiStatus || aiStatus === "no_data") return rulesActive ? "rules_only" : "agree";
  if (rulesStatus === aiStatus) return "agree";
  const r = STATUS_ORDER[rulesStatus] ?? -1;
  const a = STATUS_ORDER[aiStatus] ?? -1;
  if (!rulesActive && aiActive) return "ai_only";
  if (rulesActive && !aiActive) return "rules_only";
  if (a > r) return "escalation";
  if (a < r) return "deescalation";
  return "agree";
}

const DIV_META: Record<Divergence, { label: string; cls: string; rowCls?: string; Icon: any }> = {
  agree:        { label: "согласие",     cls: "bg-emerald-100 text-emerald-800 border-emerald-300", Icon: CheckCircle2 },
  escalation:   { label: "эскалация ИИ", cls: "bg-amber-100 text-amber-800 border-amber-300",      Icon: ArrowUpRight },
  deescalation: { label: "деэскалация",  cls: "bg-red-100 text-red-800 border-red-300",            Icon: ArrowDownRight, rowCls: "bg-red-50/60 dark:bg-red-950/20" },
  ai_only:      { label: "только ИИ",    cls: "bg-purple-100 text-purple-800 border-purple-300",   Icon: ShieldQuestion,  rowCls: "bg-purple-50/50 dark:bg-purple-950/20" },
  rules_only:   { label: "только правила", cls: "bg-blue-100 text-blue-800 border-blue-300",       Icon: Beaker },
};

/**
 * Проверка на галлюцинацию: сослался ли ИИ на конкретные лабораторные значения,
 * которые действительно есть в отклонениях по правилам этого пути.
 * Возвращает {supported, aiCodes, ruleCodes}. supported=true если хотя бы один
 * ИИ-код совпал с кодом реального сработавшего показателя.
 */
function checkMarkerSupport(aiP: AiPathway | undefined, ruleFindings: Finding[]) {
  const aiCodes = new Set(
    (aiP?.markers || [])
      .map((m) => String(m.code || m.name || "").toUpperCase().trim())
      .filter(Boolean),
  );
  const ruleCodes = new Set<string>();
  for (const f of ruleFindings) {
    const c = f.source_ref?.test_code || f.source_ref?.rule_code || "";
    const s = String(c).toUpperCase().trim();
    if (s) ruleCodes.add(s);
  }
  const supported = [...aiCodes].some((c) => ruleCodes.has(c));
  return { supported, aiCodes: [...aiCodes], ruleCodes: [...ruleCodes] };
}

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export interface AuditPanelProps {
  mapId?: string | null;
  pathways: Pathway[];
  summary: PathwaySummary[];
  findings: Finding[];
  ai: { pathways?: AiPathway[]; model?: string; computed_at?: string } | null;
}

export function AuditPanel({ mapId, pathways, summary, findings, ai }: AuditPanelProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState<"all" | "diverge" | "affected">("all");
  const [reviews, setReviews] = useState<Map<string, Review>>(new Map());
  const [savingPw, setSavingPw] = useState<string | null>(null);
  const { toast } = useToast();

  // Загружаем сохранённые решения врача — переживают пересчёт агрегации.
  useEffect(() => {
    if (!mapId) { setReviews(new Map()); return; }
    let alive = true;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("map_pathway_reviews")
        .select("id, map_id, pathway_id, kept, note, updated_at")
        .eq("map_id", mapId);
      if (!alive) return;
      if (error) { console.warn("[audit] reviews load failed:", error.message); return; }
      const m = new Map<string, Review>();
      for (const r of (data as Review[]) || []) m.set(r.pathway_id, r);
      setReviews(m);
    })();
    return () => { alive = false; };
  }, [mapId]);

  async function saveReview(pathwayId: string, kept: "rules" | "ai", context: { rules_status: string; ai_status?: string; divergence: string }) {
    if (!mapId) {
      toast({ title: "Нет карты", description: "Сначала выполните пересчёт.", variant: "destructive" });
      return;
    }
    setSavingPw(pathwayId);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const reviewer_id = userData?.user?.id || null;
      const payload = {
        map_id: mapId,
        pathway_id: pathwayId,
        kept,
        rules_status: context.rules_status,
        ai_status: context.ai_status || null,
        divergence: context.divergence,
        reviewer_id,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await (supabase as any)
        .from("map_pathway_reviews")
        .upsert(payload, { onConflict: "map_id,pathway_id" })
        .select("id, map_id, pathway_id, kept, note, updated_at")
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setReviews((prev) => {
          const next = new Map(prev);
          next.set(pathwayId, data as Review);
          return next;
        });
      }
      toast({ title: "Решение сохранено", description: kept === "ai" ? "Оставили вывод ИИ." : "Оставили результат правил." });
    } catch (e: any) {
      toast({ title: "Не удалось сохранить", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setSavingPw(null);
    }
  }

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
      if (f.source_ref?.ai) bucket.aiOnly.push(f);
      else bucket.rules.push(f);
    }
    return m;
  }, [findings]);

  const rows = pathways.map((pw) => {
    const s = sumById.get(pw.id);
    const rulesStatus = s?.status || "no_data";
    const aiP = aiBySlug.get(pw.slug);
    const aiStatus = (aiP?.status as string) || undefined;
    const div = classify(rulesStatus, aiStatus);
    const bucket = findingsByPw.get(pw.id) || { rules: [], aiOnly: [] };
    const support = checkMarkerSupport(aiP, bucket.rules);
    const review = reviews.get(pw.id);
    return { pw, s, rulesStatus, aiP, aiStatus, div, bucket, support, review };
  });

  const filtered = rows.filter((r) => {
    if (filter === "diverge") return r.div !== "agree";
    if (filter === "affected")
      return ["mild", "moderate", "severe"].includes(r.rulesStatus) ||
        (r.aiStatus && ["mild", "moderate", "severe"].includes(r.aiStatus));
    return true;
  });

  const totals = rows.reduce(
    (acc, r) => { acc[r.div] = (acc[r.div] || 0) + 1; return acc; },
    {} as Record<Divergence, number>,
  );

  function exportCsv() {
    const header = [
      "pathway_slug","pathway_name","rules_status","ai_status","divergence",
      "ai_confidence","matched_markers","rules_findings","ai_markers",
      "marker_supported","kept",
    ];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push([
        r.pw.slug, r.pw.name, r.rulesStatus, r.aiStatus || "",
        r.div, typeof r.aiP?.confidence === "number" ? r.aiP.confidence : "",
        r.s?.matched_markers ?? 0, r.bucket.rules.length,
        r.aiP?.markers?.length ?? 0,
        r.support.aiCodes.length ? (r.support.supported ? "yes" : "no") : "n/a",
        r.review?.kept || "",
      ].map(csvEscape).join(","));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit_rules_vs_ai_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="inline-flex items-center gap-1 hover:opacity-80"
            aria-label={collapsed ? "Развернуть" : "Свернуть"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <ScaleIcon className="w-4 h-4 text-primary" />
            Аудит: правила ↔ ИИ
          </button>
          <Badge variant="outline" className="ml-2">путей: {rows.length}</Badge>
          <Badge variant="outline" className={DIV_META.agree.cls}>согласие: {totals.agree || 0}</Badge>
          <Badge variant="outline" className={DIV_META.escalation.cls}>эскалация: {totals.escalation || 0}</Badge>
          <Badge variant="outline" className={DIV_META.deescalation.cls}>деэскалация: {totals.deescalation || 0}</Badge>
          <Badge variant="outline" className={DIV_META.ai_only.cls}>только ИИ: {totals.ai_only || 0}</Badge>
          <Badge variant="outline" className={DIV_META.rules_only.cls}>только правила: {totals.rules_only || 0}</Badge>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs ml-auto" onClick={exportCsv}>
            <Download className="w-3 h-3" />CSV
          </Button>
        </CardTitle>
        {!collapsed && (
          <div className="flex items-center gap-2 pt-1 flex-wrap">
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
        )}
      </CardHeader>
      {!collapsed && (
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="py-2 pr-2 font-medium w-6"></th>
                  <th className="py-2 pr-2 font-medium">Путь</th>
                  <th className="py-2 pr-2 font-medium"><span className="inline-flex items-center gap-1"><Beaker className="w-3 h-3" />Правила</span></th>
                  <th className="py-2 pr-2 font-medium"><span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3" />ИИ</span></th>
                  <th className="py-2 pr-2 font-medium">Расхождение</th>
                  <th className="py-2 pr-2 font-medium">Уверенность</th>
                  <th className="py-2 pr-2 font-medium">Маркеры ИИ</th>
                  <th className="py-2 pr-2 font-medium">Решение</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-4 text-center text-muted-foreground italic">Нет строк по выбранному фильтру.</td></tr>
                )}
                {filtered.map((r) => {
                  const open = openId === r.pw.id;
                  const M = DIV_META[r.div];
                  const rowHi = M.rowCls || "";
                  return (
                    <Fragment key={r.pw.id}>
                      <tr className={`border-b last:border-0 hover:bg-muted/40 ${rowHi}`}>
                        <td className="py-2 pr-1 align-top">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setOpenId(open ? null : r.pw.id)}>
                            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </Button>
                        </td>
                        <td className="py-2 pr-2 font-medium align-top">
                          {r.pw.name}
                          <div className="text-[10px] text-muted-foreground font-normal">{r.pw.slug}</div>
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <Badge variant="outline" className={STATUS_CLS[r.rulesStatus] || ""}>{SEVERITY_LABEL[r.rulesStatus as Severity] || r.rulesStatus}</Badge>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            сопоставлено: {r.s?.matched_markers ?? 0} · отклонений: {r.bucket.rules.length}
                          </div>
                        </td>
                        <td className="py-2 pr-2 align-top">
                          {r.aiStatus ? (
                            <Badge variant="outline" className={STATUS_CLS[r.aiStatus] || ""}>{SEVERITY_LABEL[r.aiStatus as Severity] || r.aiStatus}</Badge>
                          ) : (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <Badge variant="outline" className={`gap-1 ${M.cls}`}>
                            <M.Icon className="w-3 h-3" />{M.label}
                          </Badge>
                        </td>
                        <td className="py-2 pr-2 align-top tabular-nums">
                          {typeof r.aiP?.confidence === "number" ? `${(r.aiP.confidence * 100).toFixed(0)}%` : "—"}
                        </td>
                        <td className="py-2 pr-2 align-top">
                          {r.aiP?.markers?.length ? (
                            <div className="flex flex-col gap-0.5">
                              <span>{r.aiP.markers.length}</span>
                              <span className={`text-[10px] ${r.support.supported ? "text-emerald-700" : "text-red-700"}`}>
                                {r.support.supported ? "подтв. маркером" : "нет опоры"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-2 align-top">
                          {r.review ? (
                            <Badge variant="outline" className={r.review.kept === "ai" ? DIV_META.escalation.cls : DIV_META.rules_only.cls}>
                              оставлено: {r.review.kept === "ai" ? "ИИ" : "правила"}
                            </Badge>
                          ) : r.div === "agree" ? (
                            <span className="text-muted-foreground text-[10px] italic">не требуется</span>
                          ) : (
                            <div className="flex gap-1">
                              <Button
                                size="sm" variant="outline"
                                className="h-6 px-2 text-[10px]"
                                disabled={savingPw === r.pw.id}
                                onClick={() => saveReview(r.pw.id, "rules", { rules_status: r.rulesStatus, ai_status: r.aiStatus, divergence: r.div })}
                              >Правила</Button>
                              <Button
                                size="sm" variant="outline"
                                className="h-6 px-2 text-[10px]"
                                disabled={savingPw === r.pw.id || !r.aiStatus}
                                onClick={() => saveReview(r.pw.id, "ai", { rules_status: r.rulesStatus, ai_status: r.aiStatus, divergence: r.div })}
                              >ИИ</Button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {open && (
                        <tr className={`bg-muted/20 border-b ${rowHi}`}>
                          <td></td>
                          <td colSpan={7} className="py-3 pr-2">
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
                                        {f.source_ref?.rule_code && (
                                          <div className="text-[10px] text-muted-foreground">rule: {f.source_ref.rule_code}</div>
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
                                        {r.aiP.markers.slice(0, 8).map((m, i) => (
                                          <span key={i} className="mr-2">
                                            {m.code || m.name}: {String(m.value)}{m.unit ? ` ${m.unit}` : ""}
                                            {m.flag && m.flag !== "normal" && <span className="text-amber-700"> [{m.flag}]</span>}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <div className={`text-[11px] mt-1 ${r.support.supported ? "text-emerald-700" : r.support.aiCodes.length ? "text-red-700" : "text-muted-foreground"}`}>
                                      {r.support.aiCodes.length === 0
                                        ? "ИИ не сослался на конкретные показатели."
                                        : r.support.supported
                                          ? `Вывод подтверждён показателями пациента: ${r.support.aiCodes.filter((c) => r.support.ruleCodes.includes(c)).join(", ")}`
                                          : `⚠ Вывод без опоры на реальные отклонения. ИИ упомянул: ${r.support.aiCodes.join(", ")} — но правила по этим кодам не сработали. Проверить на галлюцинацию.`}
                                    </div>
                                    {r.bucket.aiOnly.length > 0 && (
                                      <div className="text-[11px] text-muted-foreground">
                                        Дополнительно ИИ-подсветок: {r.bucket.aiOnly.length}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            {r.div === "deescalation" && (
                              <div className="mt-2 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-1">
                                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                                ИИ понизил тяжесть по сравнению с правилами — модель «успокоила» реальное отклонение. Проверьте лабы, единицы измерения и контекст цикла.
                              </div>
                            )}
                            {r.div === "ai_only" && (
                              <div className="mt-2 text-[11px] text-purple-700 dark:text-purple-300 flex items-start gap-1">
                                <ShieldQuestion className="w-3 h-3 mt-0.5 shrink-0" />
                                Правила по этому пути молчат, но ИИ выставил статус — контекстная находка либо галлюцинация. Сверьте с маркерами выше.
                              </div>
                            )}
                            {r.review && (
                              <div className="mt-2 text-[11px] text-muted-foreground">
                                Решение врача: {r.review.kept === "ai" ? "оставлен вывод ИИ" : "оставлен результат правил"} · {new Date(r.review.updated_at).toLocaleString("ru-RU")}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
