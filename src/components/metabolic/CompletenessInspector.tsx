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

import { useEffect, useMemo, useState } from "react";
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

interface Props {
  patientId: string;
  pathways: PathwayLite[];
  summary: PathwaySummary[];
  /** Опционально: если визит выбран, ограничиваем лабы по дате визита */
  visitDate?: string | null;
}

function normCode(s: string | null | undefined): string {
  return String(s ?? "").toUpperCase().trim();
}

export function CompletenessInspector({ patientId, pathways, summary, visitDate }: Props) {
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

  // Тянем каталог, чтобы показывать привычные короткие названия (ТТГ, АМГ и т.п.)
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("lab_tests_catalog")
        .select("short_name, name, synonyms")
        .eq("is_active", true);
      if (!alive) return;
      const map: Record<string, string> = {};
      for (const row of (data as any[]) || []) {
        const label = row.short_name || row.name;
        if (!label) continue;
        map[normCode(row.short_name)] = label;
        map[normCode(row.name)] = label;
        for (const s of (row.synonyms as string[]) || []) {
          const k = normCode(s);
          if (k && !map[k]) map[k] = label;
        }
      }
      setCodeLabels(map);
    })();
    return () => {
      alive = false;
    };
  }, []);

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
        if (codeLabels[n]) set.add(n);
      }
    }
    return set;
  }, [labs, codeLabels]);

  const rows = useMemo(() => {
    return pathways.map((pw) => {
      const expected = new Set<string>();
      for (const r of (pw.rules || []) as any[]) {
        const tc = normCode(r?.when?.test_code);
        if (tc) expected.add(tc);
      }
      const expectedArr = [...expected];
      const covered = expectedArr.filter((c) => patientCodes.has(c));
      const missing = expectedArr.filter((c) => !patientCodes.has(c));
      const sum = summary.find((s) => s.pathway_id === pw.id);
      const matched = sum?.matched_markers ?? 0;
      const needsPhase = sum?.needs_phase_codes || [];
      return {
        id: pw.id,
        slug: pw.slug,
        name: pw.name,
        expected: expectedArr.length,
        covered: covered.length,
        matched,
        missing,
        needsPhase,
        isEmpty: matched === 0,
      };
    });
  }, [pathways, summary, patientCodes]);

  const labelFor = (code: string) => codeLabels[code] || code;

  const totals = useMemo(() => {
    const total = rows.length;
    const evaluated = rows.filter((r) => !r.isEmpty).length;
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
          Пути без единого измерения не считаются ошибкой — они помечаются «не оценивается».
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
                  {r.isEmpty ? (
                    <Badge variant="outline" className="border-muted text-muted-foreground">
                      не оценивается
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-300">
                      покрыто {r.covered}/{r.expected}
                    </Badge>
                  )}
                  {r.needsPhase.length > 0 && (
                    <Badge variant="outline" className="border-blue-300 text-blue-700 dark:text-blue-300">
                      🔵 фаза: {r.needsPhase.join(", ")}
                    </Badge>
                  )}
                </div>
              </div>
              {r.missing.length > 0 && (
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
