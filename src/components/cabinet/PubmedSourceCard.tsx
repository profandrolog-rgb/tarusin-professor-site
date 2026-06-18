// Rich source card for PubMed results.
import { ExternalLink, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PubmedSource } from "@/lib/pubmedExport";

const TYPE_BADGE_COLORS: Record<string, string> = {
  "Review": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  "Systematic Review": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  "Meta-Analysis": "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  "Randomized Controlled Trial": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  "Clinical Trial": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  "Practice Guideline": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  "Case Reports": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export function PubmedSourceCard({
  index, source, onAnalyze, analyzing,
}: {
  index: number;
  source: PubmedSource;
  onAnalyze?: (s: PubmedSource) => void;
  analyzing?: boolean;
}) {
  const importantTypes = (source.article_types || [])
    .filter((t) => t in TYPE_BADGE_COLORS)
    .slice(0, 3);
  return (
    <div className="border border-border rounded-md p-3 bg-card text-sm space-y-1.5">
      <div className="flex items-start gap-2">
        <span className="text-xs font-mono text-muted-foreground shrink-0 mt-0.5">[{index}]</span>
        <div className="flex-1 min-w-0">
          <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-primary leading-snug block">
            {source.title || `PMID:${source.pmid}`}
          </a>
          {(source.authors || source.journal || source.year) && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {source.authors}{source.authors && (source.journal || source.year) ? " · " : ""}
              {source.journal}{source.journal && source.year ? " · " : ""}
              {source.year}
            </div>
          )}
        </div>
      </div>
      {importantTypes.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-7">
          {importantTypes.map((t) => (
            <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded ${TYPE_BADGE_COLORS[t]}`}>{t}</span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 pl-7 pt-1">
        <a href={source.url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <ExternalLink className="w-3 h-3" />PubMed (PMID:{source.pmid})
        </a>
        {source.pmc_url && (
          <a href={source.pmc_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:underline">
            <FileText className="w-3 h-3" />PMC полный текст
          </a>
        )}
        {source.pmcid && onAnalyze && (
          <Button
            type="button" size="sm" variant="outline" className="h-6 px-2 text-xs"
            onClick={() => onAnalyze(source)} disabled={analyzing}
          >
            <Sparkles className="w-3 h-3 mr-1" />{analyzing ? "Разбираю…" : "Разобрать подробнее"}
          </Button>
        )}
      </div>
    </div>
  );
}
