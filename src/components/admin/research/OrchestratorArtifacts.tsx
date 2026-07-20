import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { highlightMarkers } from "@/lib/research/markers";
import { FileSearch, ScrollText, ShieldCheck, CheckCircle2, AlertTriangle, Circle } from "lucide-react";

interface FactCheck {
  verified?: Array<{ marker?: string; claim?: string }>;
  not_found_in_source?: Array<{ marker?: string; claim?: string; reason?: string }>;
  unmarked_claims?: string[];
  missing_markers?: Array<{ marker?: string; name?: string }>;
  search_result?: string;
}

interface Props {
  searchResult?: string;
  content?: string;
  factCheck: FactCheck;
}

export default function OrchestratorArtifacts({ searchResult, content, factCheck }: Props) {
  const hasSearch = !!(searchResult && searchResult.trim());
  const hasContent = !!(content && content.trim());
  const fcCounts = {
    verified: factCheck.verified?.length ?? 0,
    problems: factCheck.not_found_in_source?.length ?? 0,
    unmarked: factCheck.unmarked_claims?.length ?? 0,
  };
  const hasFc = fcCounts.verified + fcCounts.problems + fcCounts.unmarked > 0;

  if (!hasSearch && !hasContent && !hasFc) return null;

  const highlighted = content ? highlightMarkers(content) : "";

  return (
    <Card className="no-print">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Результаты этапов</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={hasFc ? "factcheck" : hasContent ? "draft" : "search"}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="search" disabled={!hasSearch} className="gap-2">
              <FileSearch className="w-4 h-4" /> Найденная литература
            </TabsTrigger>
            <TabsTrigger value="draft" disabled={!hasContent} className="gap-2">
              <ScrollText className="w-4 h-4" /> Черновик обзора
            </TabsTrigger>
            <TabsTrigger value="factcheck" disabled={!hasFc} className="gap-2">
              <ShieldCheck className="w-4 h-4" /> Проверка источников
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-3">
            {hasSearch ? (
              <div className="border rounded-md p-3 bg-muted/30 max-h-[420px] overflow-auto">
                <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{searchResult}</pre>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Пока нет данных поиска.</p>
            )}
          </TabsContent>

          <TabsContent value="draft" className="mt-3">
            {hasContent ? (
              <div
                className="border rounded-md p-4 bg-background max-h-[520px] overflow-auto prose prose-sm dark:prose-invert max-w-none article-markdown"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Черновик ещё не сгенерирован.</p>
            )}
          </TabsContent>

          <TabsContent value="factcheck" className="mt-3 space-y-4">
            <section>
              <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4" /> Подтверждено
                <Badge variant="outline" className="ml-1">{fcCounts.verified}</Badge>
              </h4>
              {fcCounts.verified === 0 ? (
                <p className="text-xs text-muted-foreground">Пусто.</p>
              ) : (
                <ul className="space-y-1.5">
                  {factCheck.verified!.map((v, i) => (
                    <li key={i} className="text-sm border border-emerald-500/20 bg-emerald-500/5 rounded px-2 py-1.5">
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 mr-2">{v.marker}</span>
                      {v.claim}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> Не найдено в источнике
                <Badge variant="outline" className="ml-1">{fcCounts.problems}</Badge>
              </h4>
              {fcCounts.problems === 0 ? (
                <p className="text-xs text-muted-foreground">Пусто.</p>
              ) : (
                <ul className="space-y-1.5">
                  {factCheck.not_found_in_source!.map((v, i) => (
                    <li key={i} className="text-sm border border-red-500/30 bg-red-500/5 rounded px-2 py-1.5">
                      <span className="font-mono text-red-700 dark:text-red-400 mr-2">{v.marker}</span>
                      {v.claim}
                      {v.reason && <em className="block text-xs text-muted-foreground mt-0.5">Причина: {v.reason}</em>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-2">
                <Circle className="w-4 h-4" /> Без маркера
                <Badge variant="outline" className="ml-1">{fcCounts.unmarked}</Badge>
              </h4>
              {fcCounts.unmarked === 0 ? (
                <p className="text-xs text-muted-foreground">Пусто.</p>
              ) : (
                <ul className="space-y-1.5">
                  {factCheck.unmarked_claims!.map((v, i) => (
                    <li key={i} className="text-sm border border-amber-500/25 bg-amber-500/5 rounded px-2 py-1.5">
                      {v}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
