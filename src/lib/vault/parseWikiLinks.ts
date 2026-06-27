// Parse [[wiki-links]] and tags from markdown.
// Supports [[Title]], [[Title|Alias]], [[Folder/Title]], [[Пациент: ФИО]].

export interface ParsedLink {
  raw: string;        // "[[Title]]" or "[[Title|Alias]]"
  target: string;     // resolved title (without alias, without folder prefix)
  fullTarget: string; // raw target as written
  alias?: string;
  context: string;    // surrounding ±60 chars
}

export interface ParsedTag {
  raw: string; // "#tag"
  tag: string; // "tag"
}

const LINK_RE = /\[\[([^\]\n|]+)(?:\|([^\]\n]+))?\]\]/g;
const TAG_RE = /(?:^|\s)#([\p{L}\p{N}_\-/]{2,40})/gu;

export function parseWikiLinks(md: string): ParsedLink[] {
  const out: ParsedLink[] = [];
  if (!md) return out;
  let m: RegExpExecArray | null;
  const re = new RegExp(LINK_RE.source, "g");
  while ((m = re.exec(md)) !== null) {
    const fullTarget = m[1].trim();
    const target = fullTarget.split("/").pop()!.trim();
    const start = Math.max(0, m.index - 60);
    const end = Math.min(md.length, m.index + m[0].length + 60);
    out.push({
      raw: m[0],
      target,
      fullTarget,
      alias: m[2]?.trim() || undefined,
      context: md.slice(start, end).replace(/\s+/g, " ").trim(),
    });
  }
  return out;
}

export function parseTags(md: string): string[] {
  if (!md) return [];
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(TAG_RE.source, TAG_RE.flags);
  while ((m = re.exec(md)) !== null) set.add(m[1].toLowerCase());
  return Array.from(set).sort();
}

/** Render markdown with [[wiki-links]] converted to <a href="#note:..."> placeholders. */
export function renderWikiLinksToAnchors(md: string, resolver: (title: string) => string | null): string {
  return md.replace(LINK_RE, (_full, target: string, alias?: string) => {
    const t = target.trim();
    const label = (alias || t.split("/").pop() || t).trim();
    const id = resolver(t.split("/").pop()!.trim());
    if (id) return `[${label}](#note:${id})`;
    return `<span class="text-orange-500 underline decoration-dotted" title="Заметка не найдена — кликните, чтобы создать">${label}</span>`;
  });
}
