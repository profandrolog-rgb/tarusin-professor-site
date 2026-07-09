// Inline editor for the final article with a side-by-side / inline diff
// view that highlights every change made during consolidation.

import { useEffect, useMemo, useState } from "react";
import { diffWords } from "diff";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pencil, Eye, Columns, AlignLeft } from "lucide-react";

type Mode = "edit" | "inline" | "split";

interface Props {
  original: string;
  value: string;
  onChange: (v: string) => void;
}

function renderInline(parts: ReturnType<typeof diffWords>) {
  return parts.map((p, i) => {
    if (p.added) {
      return (
        <span
          key={i}
          className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded px-0.5 underline decoration-emerald-500/50"
        >
          {p.value}
        </span>
      );
    }
    if (p.removed) {
      return (
        <span
          key={i}
          className="bg-red-500/15 text-red-700 dark:text-red-300 rounded px-0.5 line-through decoration-red-500/60"
        >
          {p.value}
        </span>
      );
    }
    return <span key={i}>{p.value}</span>;
  });
}

function renderSide(parts: ReturnType<typeof diffWords>, side: "before" | "after") {
  return parts.map((p, i) => {
    if (p.added && side === "after") {
      return (
        <span key={i} className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded px-0.5">
          {p.value}
        </span>
      );
    }
    if (p.removed && side === "before") {
      return (
        <span key={i} className="bg-red-500/15 text-red-700 dark:text-red-300 rounded px-0.5 line-through">
          {p.value}
        </span>
      );
    }
    if (p.added && side === "before") return null;
    if (p.removed && side === "after") return null;
    return <span key={i}>{p.value}</span>;
  });
}

export default function ArticleDiffEditor({ original, value, onChange }: Props) {
  const [mode, setMode] = useState<Mode>("edit");

  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), 500);
    return () => clearTimeout(t);
  }, [value]);

  const parts = useMemo(
    () => (original && debouncedValue ? diffWords(original, debouncedValue) : []),
    [original, debouncedValue],
  );

  const stats = useMemo(() => {
    let added = 0, removed = 0;
    for (const p of parts) {
      const words = p.value.trim() ? p.value.trim().split(/\s+/).length : 0;
      if (p.added) added += words;
      if (p.removed) removed += words;
    }
    return { added, removed };
  }, [parts]);

  const hasDiff = Boolean(original) && original !== value;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-md border border-border overflow-hidden">
          <Button
            type="button"
            size="sm"
            variant={mode === "edit" ? "default" : "ghost"}
            onClick={() => setMode("edit")}
            className="rounded-none"
          >
            <Pencil className="w-4 h-4 mr-1.5" /> Редактор
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "inline" ? "default" : "ghost"}
            onClick={() => setMode("inline")}
            className="rounded-none"
            disabled={!hasDiff}
          >
            <AlignLeft className="w-4 h-4 mr-1.5" /> Подсветка изменений
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "split" ? "default" : "ghost"}
            onClick={() => setMode("split")}
            className="rounded-none"
            disabled={!hasDiff}
          >
            <Columns className="w-4 h-4 mr-1.5" /> До / после
          </Button>
        </div>
        {hasDiff ? (
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
              +{stats.added} слов
            </Badge>
            <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30">
              −{stats.removed} слов
            </Badge>
          </div>
        ) : (
          <Badge variant="outline" className="text-xs">
            <Eye className="w-3 h-3 mr-1" /> Изменений нет
          </Badge>
        )}
      </div>

      {mode === "edit" && (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[420px] font-serif text-[15px] leading-relaxed"
        />
      )}

      {mode === "inline" && (
        <div className="min-h-[420px] rounded-md border border-border bg-background p-4 font-serif text-[15px] leading-relaxed whitespace-pre-wrap">
          {renderInline(parts)}
        </div>
      )}

      {mode === "split" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md border border-border bg-muted/30 p-4 font-serif text-[14px] leading-relaxed whitespace-pre-wrap min-h-[420px]">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              До консолидации
            </div>
            {renderSide(parts, "before")}
          </div>
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4 font-serif text-[14px] leading-relaxed whitespace-pre-wrap min-h-[420px]">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">
              После консолидации
            </div>
            {renderSide(parts, "after")}
          </div>
        </div>
      )}
    </div>
  );
}
