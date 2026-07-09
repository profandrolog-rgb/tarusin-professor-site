// Inline editor for the final article with a side-by-side / inline diff
// view that highlights every change made during consolidation, plus
// find & highlight search across all three view modes.

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { diffWords } from "diff";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Eye, Columns, AlignLeft, Search, ChevronUp, ChevronDown, X } from "lucide-react";

type Mode = "edit" | "inline" | "split";

interface Props {
  original: string;
  value: string;
  onChange: (v: string) => void;
}

type Match = { start: number; end: number };

function findMatches(text: string, query: string): Match[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const matches: Match[] = [];
  let i = 0;
  while (true) {
    const idx = t.indexOf(q, i);
    if (idx === -1) break;
    matches.push({ start: idx, end: idx + q.length });
    i = idx + q.length;
  }
  return matches;
}

function splitWithHighlights(
  text: string,
  textStart: number,
  matches: Match[],
  currentLocalIndex: number,
  namespace: string,
  reactKeyPrefix: string,
): ReactNode {
  if (!matches.length) return text;
  const textEnd = textStart + text.length;
  const relevant = matches
    .map((m, i) => ({ ...m, i }))
    .filter((m) => m.end > textStart && m.start < textEnd);
  if (!relevant.length) return text;

  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const m of relevant) {
    const relStart = Math.max(0, m.start - textStart);
    const relEnd = Math.min(text.length, m.end - textStart);
    if (relStart > cursor) nodes.push(text.slice(cursor, relStart));
    const isCurrent = m.i === currentLocalIndex;
    nodes.push(
      <mark
        key={`${reactKeyPrefix}-${m.i}`}
        data-match-key={`${namespace}-${m.i}`}
        className={
          isCurrent
            ? "bg-orange-400 text-black rounded-sm ring-2 ring-orange-600"
            : "bg-yellow-300/70 text-black rounded-sm"
        }
      >
        {text.slice(relStart, relEnd)}
      </mark>,
    );
    cursor = relEnd;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}

function renderInline(parts: ReturnType<typeof diffWords>, matches: Match[], currentIndex: number) {
  let offset = 0;
  return parts.map((p, i) => {
    const start = offset;
    offset += p.value.length;
    const content = splitWithHighlights(p.value, start, matches, currentIndex, "inline", `inline-${i}`);
    if (p.added) {
      return (
        <span key={i} className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded px-0.5 underline decoration-emerald-500/50">
          {content}
        </span>
      );
    }
    if (p.removed) {
      return (
        <span key={i} className="bg-red-500/15 text-red-700 dark:text-red-300 rounded px-0.5 line-through decoration-red-500/60">
          {content}
        </span>
      );
    }
    return <span key={i}>{content}</span>;
  });
}

function renderSide(
  parts: ReturnType<typeof diffWords>,
  side: "before" | "after",
  matches: Match[],
  currentIndex: number,
) {
  let offset = 0;
  return parts.map((p, i) => {
    const appearsOnSide = !((p.added && side === "before") || (p.removed && side === "after"));
    const start = offset;
    if (appearsOnSide) offset += p.value.length;
    if (p.added && side === "before") return null;
    if (p.removed && side === "after") return null;
    const content = splitWithHighlights(p.value, start, matches, currentIndex, side, `${side}-${i}`);
    if (p.added && side === "after") {
      return (
        <span key={i} className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded px-0.5">
          {content}
        </span>
      );
    }
    if (p.removed && side === "before") {
      return (
        <span key={i} className="bg-red-500/15 text-red-700 dark:text-red-300 rounded px-0.5 line-through">
          {content}
        </span>
      );
    }
    return <span key={i}>{content}</span>;
  });
}

export default function ArticleDiffEditor({ original, value, onChange }: Props) {
  const [mode, setMode] = useState<Mode>("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  const [diffValue, setDiffValue] = useState(value);
  useEffect(() => {
    if (mode !== "edit") setDiffValue(value);
  }, [mode, value]);

  const parts = useMemo(
    () => (original && diffValue ? diffWords(original, diffValue) : []),
    [original, diffValue],
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

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);

  const inlineSourceText = useMemo(() => parts.map((p) => p.value).join(""), [parts]);

  const editMatches = useMemo(() => (mode === "edit" ? findMatches(value, query) : []), [mode, value, query]);
  const inlineMatches = useMemo(() => (mode === "inline" ? findMatches(inlineSourceText, query) : []), [mode, inlineSourceText, query]);
  const beforeMatches = useMemo(() => (mode === "split" ? findMatches(original, query) : []), [mode, original, query]);
  const afterMatches = useMemo(() => (mode === "split" ? findMatches(diffValue, query) : []), [mode, diffValue, query]);

  const activeMatches =
    mode === "edit" ? editMatches : mode === "inline" ? inlineMatches : [...beforeMatches, ...afterMatches];

  useEffect(() => {
    setCurrentMatch(0);
  }, [query, mode]);

  useEffect(() => {
    if (!query.trim() || !activeMatches.length) return;
    if (mode === "edit") {
      const m = editMatches[currentMatch];
      if (m && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(m.start, m.end);
      }
      return;
    }
    let namespace = "inline";
    let local = currentMatch;
    if (mode === "split") {
      if (currentMatch < beforeMatches.length) {
        namespace = "before";
        local = currentMatch;
      } else {
        namespace = "after";
        local = currentMatch - beforeMatches.length;
      }
    }
    const el = viewRef.current?.querySelector(`[data-match-key="${namespace}-${local}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMatch, mode, activeMatches.length]);

  function goNext() {
    if (!activeMatches.length) return;
    setCurrentMatch((i) => (i + 1) % activeMatches.length);
  }
  function goPrev() {
    if (!activeMatches.length) return;
    setCurrentMatch((i) => (i - 1 + activeMatches.length) % activeMatches.length);
  }

  const beforeCurrentIndex = mode === "split" && currentMatch < beforeMatches.length ? currentMatch : -1;
  const afterCurrentIndex = mode === "split" && currentMatch >= beforeMatches.length ? currentMatch - beforeMatches.length : -1;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-md border border-border overflow-hidden">
          <Button type="button" size="sm" variant={mode === "edit" ? "default" : "ghost"} onClick={() => setMode("edit")} className="rounded-none">
            <Pencil className="w-4 h-4 mr-1.5" /> Редактор
          </Button>
          <Button type="button" size="sm" variant={mode === "inline" ? "default" : "ghost"} onClick={() => setMode("inline")} className="rounded-none" disabled={!hasDiff}>
            <AlignLeft className="w-4 h-4 mr-1.5" /> Подсветка изменений
          </Button>
          <Button type="button" size="sm" variant={mode === "split" ? "default" : "ghost"} onClick={() => setMode("split")} className="rounded-none" disabled={!hasDiff}>
            <Columns className="w-4 h-4 mr-1.5" /> До / после
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant={searchOpen ? "default" : "outline"} onClick={() => setSearchOpen((v) => !v)}>
            <Search className="w-4 h-4 mr-1.5" /> Найти
          </Button>
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
      </div>

      {searchOpen && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); goNext(); }
              if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); goPrev(); }
              if (e.key === "Escape") { setSearchOpen(false); setQuery(""); }
            }}
            placeholder="Слово или фраза…"
            className="h-8"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap px-1">
            {query.trim() ? (activeMatches.length ? `${currentMatch + 1} / ${activeMatches.length}` : "0 совпадений") : ""}
          </span>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={goPrev} disabled={!activeMatches.length} title="Предыдущее (Shift+Enter)">
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={goNext} disabled={!activeMatches.length} title="Следующее (Enter)">
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setSearchOpen(false); setQuery(""); }} title="Закрыть (Esc)">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {mode === "edit" && (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[420px] font-serif text-[15px] leading-relaxed"
        />
      )}

      {mode === "inline" && (
        <div ref={viewRef} className="min-h-[420px] rounded-md border border-border bg-background p-4 font-serif text-[15px] leading-relaxed whitespace-pre-wrap">
          {renderInline(parts, inlineMatches, currentMatch)}
        </div>
      )}

      {mode === "split" && (
        <div ref={viewRef} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md border border-border bg-muted/30 p-4 font-serif text-[14px] leading-relaxed whitespace-pre-wrap min-h-[420px]">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">До консолидации</div>
            {renderSide(parts, "before", beforeMatches, beforeCurrentIndex)}
          </div>
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4 font-serif text-[14px] leading-relaxed whitespace-pre-wrap min-h-[420px]">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">После консолидации</div>
            {renderSide(parts, "after", afterMatches, afterCurrentIndex)}
          </div>
        </div>
      )}
    </div>
  );
}
