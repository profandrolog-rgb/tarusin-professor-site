import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { daysSince, formatRuDate, plannedDateText, statusLabel } from "@/lib/surgery/referral";
import { effectivenessStats, matchReferrals, type JournalLite } from "@/lib/surgery/effectiveness";

type Filter = "all" | "over30" | "fresh";

export function ReferralEffectiveness({ referrals }: { referrals: any[] }) {
  const [journal, setJournal] = useState<JournalLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [showOperated, setShowOperated] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("operations_journal")
        .select("id, patient_name, patient_birth_date, operation_date, operation_name");
      if (error) setError(error.message);
      setJournal((data as JournalLite[]) || []);
      setLoading(false);
    })();
  }, []);

  const matched = useMemo(() => matchReferrals(referrals, journal), [referrals, journal]);
  const stats = useMemo(() => effectivenessStats(matched), [matched]);

  const notServed = useMemo(
    () =>
      matched
        .filter((r) => !r.operated)
        .map((r) => ({ ...r, days: daysSince(r.created_at) ?? 0 }))
        .filter((r) => (filter === "over30" ? r.days > 30 : filter === "fresh" ? r.days < 14 : true))
        .sort((a, b) => b.days - a.days),
    [matched, filter],
  );
  const operated = matched.filter((r) => r.operated);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-destructive">Не удалось загрузить журнал операций: {error}</div>}

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Выдано путёвок", value: stats.issued },
          { label: "Прооперировано", value: stats.operated },
          { label: "Не обслужено", value: stats.notServed },
          { label: "Эффективность", value: `${stats.percent}%` },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{s.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0">
          <CardTitle className="text-base">Не обслуженные путёвки ({notServed.length})</CardTitle>
          <div className="flex gap-1">
            {([
              ["all", "Все"],
              ["over30", "Более 30 дней"],
              ["fresh", "Свежие (< 14 дней)"],
            ] as [Filter, string][]).map(([v, l]) => (
              <Button key={v} size="sm" variant={filter === v ? "default" : "outline"} onClick={() => setFilter(v)}>
                {l}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {notServed.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">Необслуженных путёвок нет.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пациент</TableHead>
                  <TableHead>Операция / диагноз</TableHead>
                  <TableHead>Выдана</TableHead>
                  <TableHead>Прошло дней</TableHead>
                  <TableHead>Плановый срок</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notServed.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.full_name}
                      {r.birth_date && (
                        <div className="text-xs text-muted-foreground">{formatRuDate(r.birth_date)}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.operation_name || "—"}
                      {r.diagnosis && <div className="text-xs text-muted-foreground">{r.diagnosis}</div>}
                    </TableCell>
                    <TableCell>{formatRuDate(r.created_at)}</TableCell>
                    <TableCell className={r.days > 30 ? "text-destructive font-semibold" : ""}>{r.days}</TableCell>
                    <TableCell>{plannedDateText(r.planned_date_from, r.planned_date_to)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{statusLabel(r.status)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Прооперированные ({operated.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowOperated((v) => !v)}>
            {showOperated ? "Скрыть" : "Показать"}
          </Button>
        </CardHeader>
        {showOperated && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пациент</TableHead>
                  <TableHead>Путёвка выдана</TableHead>
                  <TableHead>Дата операции</TableHead>
                  <TableHead>Операция (журнал)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operated.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.full_name}</TableCell>
                    <TableCell>{formatRuDate(r.created_at)}</TableCell>
                    <TableCell>{r.operation ? formatRuDate(r.operation.operation_date) : "по статусу"}</TableCell>
                    <TableCell>{r.operation?.operation_name || r.operation_name || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
