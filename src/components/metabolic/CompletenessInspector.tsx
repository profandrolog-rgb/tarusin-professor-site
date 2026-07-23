/**
 * Инспектор полноты данных для метаболической карты.
 *
 * Показывает по каждому активному пути (уже отфильтрованному по полу пациента):
 *   • какие показатели ожидаются правилами (pathways.rules[].when.test_code)
 *   • какие покрыты реальными анализами пациента
 *   • какие отсутствуют — с пометкой «досдать»
 *
 * Если по пути нет ни одного покрытого показателя — путь помечается
 * «не оценивается / досдать: …», это не ошибка, а информация для врача.
 *
 * Никакой собственной логики фаз/пола — использует те же правила и тот же
 * summary (matched_markers, needs_phase_codes), что и агрегатор.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, ClipboardList, AlertCircle } from "lucide-react";
import type { PathwaySummary } from "@/lib/metabolic/aggregator";

type PathwayLite = {
  id: string;
  slug: string;
  name: string;
  rules?: any[] | null;
};

type LabLite = {
  test_code: string | null;
  test_name: string | null;
};

export type CompletenessRow = {
  id: string;
  slug: string;
  name: string;
  expected: number;
  covered: number;
  matched: number;
  missing: string[];
  needsPhase: string[];
  hasData: boolean;
  hasRules: boolean;
};

interface Props {
  patientId: string;
  pathways: PathwayLite[];
  summary: PathwaySummary[];
  /** Опционально: если визит выбран, ограничиваем лабы по дате визита */
  visitDate?: string | null;
  /** Предпочтительно передавать тот же срез кодов, который уже показан на карте. */
  externalPatientCodes?: Set<string>;
}

function normCode(s: string | null | undefined): string {
  return String(s ?? "").toUpperCase().trim();
}

export function CompletenessInspector({ patientId, pathways, summary, visitDate, externalPatientCodes }: Props) {
  const [codeLabels, setCodeLabels] = useState<Record<string, string>>({});
  const [labs, setLabs] = useState<LabLite[]>([]);

  // Собственная загрузка лабораторных — минимальный срез (код + название)
  useEffect(() => {
    let alive = true;
    (async () => {
      let q = supabase.from("lab_results").select("test_code, test_name").eq("patient_id", patientId);
      if (visitDate) q = q.lte("test_date", visitDate);
      const { data } = await q;
      if (!alive) return;
      setLabs(((data as any[]) || []) as LabLite[]);
    })();
    return () => {
      alive = false;
    };
  }, [patientId, visitDate]);

  // Тянем каталог, чтобы показывать привычные короткие названия и правильно
  // резолвить строки lab_results, где test_code пустой.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("lab_tests_catalog")
        .select("short_name, name, synonyms")
        .eq("is_active", true);
      if (!alive) return;
      const map: Record<string, string> = {};
      const aliases: Record<string, string> = {};
      for (const row of (data as any[]) || []) {
        const code = normCode(row.short_name || row.name);
        const label = row.name || row.short_name;
        if (!label) continue;
        map[code] = label;
        aliases[code] = code;
        aliases[normCode(row.short_name)] = code;
        aliases[normCode(row.name)] = code;
        for (const s of (row.synonyms as string[]) || []) {
          const k = normCode(s);
          if (k && !map[k]) map[k] = label;
          if (k) aliases[k] = code;
        }
      }
      setCodeLabels(map);
      codeAliasesRef.current = aliases;
    })();
    return () => {
      alive = false;
    };
  }, []);

  const codeAliasesRef = useRef<Record<string, string>>({});

  // Множество кодов, которые реально есть у пациента (по test_code либо по совпадению test_name с каталогом)
  const patientCodes = useMemo(() => {
    const set = new Set<string>();
    for (const l of labs) {
      const c = normCode(l.test_code);
      if (c) set.add(c);
      // если код пустой — пытаемся угадать через каталог по имени
      if (!c && l.test_name) {
        const n = normCode(l.test_name);
        // прямое совпадение
        if (codeAliasesRef.current[n]) set.add(codeAliasesRef.current[n]);
      }
    }
    return set;
  }, [labs, codeLabels]);

  const effectivePatientCodes = externalPatientCodes || patientCodes;

  const rows = useMemo(() => {
    return buildCompletenessRows(pathways, summary, effectivePatientCodes);
  }, [pathways, summary, effectivePatientCodes]);

  const labelFor = (code: string) => codeLabels[code] || code;

  const totals = useMemo(() => {
    const total = rows.length;
    const evaluated = rows.filter((r) => r.hasData && r.matched > 0).length;
    const skipped = total - evaluated;
    return { total, evaluated, skipped };
  }, [rows]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Инспектор полноты данных
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Показывает, какие показатели каждого пути покрыты анализами пациента, а какие стоит досдать.
          «Нет данных» означает отсутствие нужных анализов, «данные есть, референс не применён» — показатель найден, но его нельзя корректно сравнить.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Оценивается: {totals.evaluated}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="w-3 h-3 text-muted-foreground" />
            Не оценивается: {totals.skipped}
          </Badge>
          <Badge variant="outline">Всего путей: {totals.total}</Badge>
        </div>

        <div className="divide-y border rounded-md">
          {rows.map((r) => (
            <div key={r.id} className="p-3 flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm truncate">{r.name}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">{r.slug}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  {!r.hasRules ? (
                    <Badge variant="outline" className="border-muted text-muted-foreground">
                      правила не настроены
                    </Badge>
                  ) : !r.hasData ? (
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      нет данных
                    </Badge>
                  ) : r.matched > 0 ? (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-300">
                      оценено {r.matched}/{r.covered}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      данные есть, референс не применён
                    </Badge>
                  )}
                  {r.needsPhase.length > 0 && (
                    <Badge variant="outline" className="border-blue-300 text-blue-700 dark:text-blue-300">
                      🔵 фаза: {r.needsPhase.join(", ")}
                    </Badge>
                  )}
                </div>
              </div>
              {r.hasRules && r.missing.length > 0 && (
                <div className="text-[12px] text-muted-foreground">
                  <span className="font-medium">Досдать:</span>{" "}
                  {r.missing.map(labelFor).join(", ")}
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">Нет активных путей для отображения.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function buildCompletenessRows(
  pathways: PathwayLite[],
  summary: PathwaySummary[],
  patientCodes: Set<string>,
): CompletenessRow[] {
  return pathways.map((pw) => {
    const expected = new Set<string>();
    for (const r of (pw.rules || []) as any[]) {
      const code = normCode(r?.when?.test_code);
      if (code) expected.add(code);
    }
    const expectedArr = [...expected];
    const covered = expectedArr.filter((code) => patientCodes.has(code));
    const sum = summary.find((s) => s.pathway_id === pw.id);
    return {
      id: pw.id,
      slug: pw.slug,
      name: pw.name,
      expected: expectedArr.length,
      covered: covered.length,
      matched: sum?.matched_markers ?? 0,
      missing: expectedArr.filter((code) => !patientCodes.has(code)),
      needsPhase: sum?.needs_phase_codes || [],
      hasData: covered.length > 0,
      hasRules: expectedArr.length > 0,
    };
  });
}
