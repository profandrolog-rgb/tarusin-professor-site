// Export PubMed result lists as .docx or .ris (Reference Manager format).
import fileSaver from "file-saver";
const { saveAs } = fileSaver;
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
} from "docx";

export type PubmedSource = {
  pmid: string;
  title?: string;
  authors?: string;
  journal?: string;
  year?: string;
  doi?: string;
  pmcid?: string;
  article_types?: string[];
  abstract?: string;
  url?: string;
  pmc_url?: string | null;
};

const ts = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};

// ---------- RIS ----------
const TYPE_MAP: Record<string, string> = {
  "Journal Article": "JOUR",
  "Review": "JOUR",
  "Systematic Review": "JOUR",
  "Meta-Analysis": "JOUR",
  "Randomized Controlled Trial": "JOUR",
  "Clinical Trial": "JOUR",
  "Practice Guideline": "JOUR",
  "Case Reports": "CASE",
  "Book": "BOOK",
};

export function sourcesToRis(sources: PubmedSource[]): string {
  const blocks: string[] = [];
  for (const s of sources) {
    const ty = TYPE_MAP[(s.article_types || [])[0] || ""] || "JOUR";
    const lines: string[] = [`TY  - ${ty}`];
    if (s.title) lines.push(`TI  - ${s.title}`);
    if (s.authors) {
      for (const a of s.authors.split(/,\s*/).filter(Boolean)) {
        if (a === "et al.") continue;
        lines.push(`AU  - ${a}`);
      }
    }
    if (s.journal) lines.push(`JO  - ${s.journal}`);
    if (s.year) lines.push(`PY  - ${s.year}`);
    if (s.doi) lines.push(`DO  - ${s.doi}`);
    if (s.pmid) lines.push(`AN  - ${s.pmid}`);
    if (s.url) lines.push(`UR  - ${s.url}`);
    if (s.pmc_url) lines.push(`L1  - ${s.pmc_url}`);
    if (s.abstract) lines.push(`AB  - ${s.abstract.replace(/\s+/g, " ").slice(0, 4000)}`);
    lines.push("ER  - ");
    blocks.push(lines.join("\n"));
  }
  return blocks.join("\n\n");
}

export function downloadRis(sources: PubmedSource[], baseName = "pubmed") {
  const ris = sourcesToRis(sources);
  const blob = new Blob([ris], { type: "application/x-research-info-systems;charset=utf-8" });
  saveAs(blob, `${baseName}-${ts()}.ris`);
}

// ---------- DOCX (literature list, Vancouver-ish) ----------
export async function downloadSourcesDocx(
  sources: PubmedSource[],
  title = "Список литературы (PubMed)",
  baseName = "pubmed",
) {
  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] }),
    new Paragraph({ children: [new TextRun({ text: new Date().toLocaleString("ru-RU"), italics: true })] }),
    new Paragraph({ children: [new TextRun(" ")] }),
  ];
  sources.forEach((s, i) => {
    const refLine = [
      `${i + 1}. `,
      s.authors ? `${s.authors}. ` : "",
      s.title ? `${s.title} ` : "",
      s.journal ? `// ${s.journal}. ` : "",
      s.year ? `${s.year}. ` : "",
      s.doi ? `DOI: ${s.doi}. ` : "",
      `PMID: ${s.pmid}.`,
      s.pmcid ? ` ${s.pmcid}.` : "",
    ].join("");
    children.push(new Paragraph({ children: [new TextRun(refLine)] }));
    if (s.url) {
      children.push(new Paragraph({ children: [new TextRun({ text: s.url, color: "1A56DB" })] }));
    }
    if (s.abstract) {
      children.push(new Paragraph({ children: [new TextRun({ text: s.abstract, italics: true, size: 20 })] }));
    }
    children.push(new Paragraph({ children: [new TextRun(" ")] }));
  });
  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${baseName}-${ts()}.docx`);
}
