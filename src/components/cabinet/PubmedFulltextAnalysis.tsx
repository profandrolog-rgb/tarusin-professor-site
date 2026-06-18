// Renders a strict-JSON fulltext analysis with per-claim source popovers.
import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Quote, Copy, Sparkles, Loader2 } from "lucide-react";
import { ChatMarkdown } from "@/components/cabinet/ChatMarkdown";
import { copyToClipboard } from "@/lib/cabinetExport";
import { toast } from "sonner";

export type FulltextItem = {
  claim: string;
  quote: string;
  location?: string;
  type: "direct" | "inferred";
};

export type FulltextMeta = {
  pmid: string;
  pmcid?: string;
  title?: string;
  doi?: string;
  pmc_url?: string;
};

/**
 * Extract a JSON array from a model response. Tolerates ```json fences and
 * leading/trailing prose. Returns null if no valid array of items found.
 */
export function parseFulltextItems(raw: string): FulltextItem[] | null {
  if (!raw) return null;
  let s = raw.trim();
  // strip code fences
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  // find first [ ... last ]
  const first = s.indexOf("[");
  const last = s.lastIndexOf("]");
  if (first === -1 || last === -1 || last < first) return null;
  const slice = s.slice(first, last + 1);
  let parsed: any;
  try {
    parsed = JSON.parse(slice);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const items: FulltextItem[] = [];
  for (const it of parsed) {
    if (!it || typeof it !== "object") continue;
    const claim = typeof it.claim === "string" ? it.claim.trim() : "";
    if (!claim) continue;
    const quote = typeof it.quote === "string" ? it.quote : "";
    const location = typeof it.location === "string" ? it.location : "";
    const type = it.type === "direct" ? "direct" : "inferred";
    items.push({ claim, quote, location, type });
  }
  return items.length ? items : null;
}

function SourceBadge({ item, meta }: { item: FulltextItem; meta: FulltextMeta }) {
  const isInferred = item.type === "inferred" || !item.quote.trim();
  const handleCopy = async () => {
    const parts: string[] = [];
    if (item.quote) parts.push(`«${item.quote}»`);
    const ref: string[] = [];
    if (meta.pmid) ref.push(`PMID:${meta.pmid}`);
    if (meta.pmcid) ref.push(meta.pmcid);
    if (meta.doi) ref.push(`DOI:${meta.doi}`);
    if (item.location) ref.push(item.location);
    if (ref.length) parts.push(`— ${ref.join("; ")}`);
    const ok = await copyToClipboard(parts.join(" "));
    toast[ok ? "success" : "error"](ok ? "Цитата скопирована" : "Не удалось скопировать");
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={
            "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ml-1 align-middle font-normal " +
            (isInferred
              ? "bg-muted text-muted-foreground hover:bg-muted/80"
              : "bg-primary/10 text-primary hover:bg-primary/20")
          }
          title={isInferred ? "Вывод модели — прямой цитаты нет" : "Показать дословную цитату из статьи"}
        >
          <Quote className="w-2.5 h-2.5" />
          {isInferred ? "вывод" : "источник"}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 max-w-[90vw] text-sm">
        {isInferred ? (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Вывод модели — прямой подтверждающей цитаты в тексте нет.
            </div>
            {item.location && (
              <div className="text-[11px] text-muted-foreground">Раздел: {item.location}</div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {item.location && (
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {item.location}
              </div>
            )}
            <blockquote className="border-l-2 border-primary/40 pl-2 italic text-foreground whitespace-pre-wrap break-words">
              {item.quote}
            </blockquote>
            <div className="text-[11px] text-muted-foreground">
              PMID:{meta.pmid}
              {meta.pmcid ? ` · ${meta.pmcid}` : ""}
              {meta.doi ? ` · DOI:${meta.doi}` : ""}
            </div>
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs w-full" onClick={handleCopy}>
              <Copy className="w-3 h-3 mr-1" /> Копировать цитату
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function PubmedFulltextAnalysis({
  raw,
  meta,
  onFollowup,
  followupLoading,
}: {
  raw: string;
  meta: FulltextMeta;
  onFollowup?: (question: string) => void;
  followupLoading?: boolean;
}) {
  const items = useMemo(() => parseFulltextItems(raw), [raw]);
  const [q, setQ] = useState("");

  // Fallback: plain markdown if JSON couldn't be parsed
  if (!items) {
    return (
      <div className="space-y-3">
        <ChatMarkdown>{raw}</ChatMarkdown>

        {onFollowup && (
          <FollowupRow q={q} setQ={setQ} loading={!!followupLoading} onSend={() => { if (q.trim()) { onFollowup(q.trim()); setQ(""); } }} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        Разбор полного текста{meta.title ? ` — ${meta.title}` : ""}
      </div>
      <ul className="space-y-1.5 text-sm list-disc pl-5 marker:text-muted-foreground">
        {items.map((it, i) => (
          <li key={i} className={it.type === "inferred" ? "text-foreground/90" : "text-foreground"}>
            <span className="whitespace-pre-wrap">{it.claim}</span>
            <SourceBadge item={it} meta={meta} />
          </li>
        ))}
      </ul>
      {onFollowup && (
        <FollowupRow q={q} setQ={setQ} loading={!!followupLoading} onSend={() => { if (q.trim()) { onFollowup(q.trim()); setQ(""); } }} />
      )}
    </div>
  );
}

function FollowupRow({ q, setQ, loading, onSend }: { q: string; setQ: (v: string) => void; loading: boolean; onSend: () => void }) {
  return (
    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
        placeholder="Спросить ещё об этой статье…"
        className="h-8 text-xs"
        disabled={loading}
      />
      <Button type="button" size="sm" className="h-8 text-xs" onClick={onSend} disabled={loading || !q.trim()}>
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Спросить"}
      </Button>
    </div>
  );
}
