import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, UploadCloud, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useFileDrop } from "@/hooks/useFileDrop";
import { slugifyVideo } from "@/lib/video/constants";

interface ParsedRow {
  title: string;
  video_url: string;
  rubric?: string;
  poster_url?: string;
  error?: string;
}

/** Простейший CSV-парсер: запятая или точка с запятой, кавычки поддержаны. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur = "";
  let row: string[] = [];
  let inQuotes = false;
  const delim = text.split("\n")[0].includes(";") ? ";" : ",";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === delim) { row.push(cur.trim()); cur = ""; }
    else if (ch === "\n") { row.push(cur.trim()); rows.push(row); row = []; cur = ""; }
    else if (ch !== "\r") cur += ch;
  }
  if (cur || row.length) { row.push(cur.trim()); rows.push(row); }
  return rows.filter((r) => r.some((c) => c));
}

const AdminVideoImport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isEditor } = useAuth();
  const canEdit = isAdmin || isEditor;

  const [links, setLinks] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);

  const handleCsv = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    if (!rows.length) {
      toast({ title: "Файл пустой", variant: "destructive" });
      return;
    }
    const header = rows[0].map((h) => h.toLowerCase());
    const idx = (name: string) => header.indexOf(name);
    const hasHeader = idx("video_url") !== -1 || idx("url") !== -1;
    const body = hasHeader ? rows.slice(1) : rows;
    const urlAt = hasHeader ? (idx("video_url") !== -1 ? idx("video_url") : idx("url")) : 1;
    const titleAt = hasHeader ? (idx("title") !== -1 ? idx("title") : 0) : 0;
    const rubricAt = hasHeader ? idx("rubric") : -1;
    const posterAt = hasHeader ? idx("poster_url") : -1;

    setParsed(
      body.map((r) => ({
        title: (r[titleAt] || "").trim(),
        video_url: (r[urlAt] || "").trim(),
        rubric: rubricAt >= 0 ? (r[rubricAt] || "").trim() : undefined,
        poster_url: posterAt >= 0 ? (r[posterAt] || "").trim() : undefined,
        error: !r[urlAt] ? "Нет ссылки" : !r[titleAt] ? "Нет названия" : undefined,
      })),
    );
    toast({ title: `Разобрано строк: ${body.length}` });
  };

  const { dragOver, handlers } = useFileDrop({ onFiles: handleCsv, accept: ["text/csv", "text/plain"] });

  const parseLinks = () => {
    const rows = links
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map<ParsedRow>((line) => {
        const [url, ...rest] = line.split("|").map((s) => s.trim());
        const title = rest.join(" | ") || decodeURIComponent((url.split("/").pop() || "").replace(/\.[a-z0-9]+$/i, ""));
        return {
          title,
          video_url: url,
          error: !/^https?:\/\//i.test(url) ? "Некорректная ссылка" : !title ? "Нет названия" : undefined,
        };
      });
    setParsed(rows);
  };

  const runImport = async () => {
    const valid = parsed.filter((r) => !r.error);
    if (!valid.length) {
      toast({ title: "Нет корректных строк для импорта", variant: "destructive" });
      return;
    }
    setImporting(true);
    try {
      const payload = valid.map((r) => ({
        slug: slugifyVideo(r.title) || slugifyVideo(r.video_url),
        title: r.title,
        video_url: r.video_url,
        rubric: r.rubric || null,
        poster_url: r.poster_url || null,
        is_published: false,
      }));
      const { error } = await supabase.from("videos").upsert(payload, { onConflict: "slug" });
      if (error) throw new Error(error.message);
      toast({ title: `Импортировано черновиков: ${payload.length}` });
      navigate("/admin/videos");
    } catch (e) {
      toast({
        title: "Импорт не удался",
        description: e instanceof Error ? e.message : "Ошибка",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  if (!canEdit) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link to="/admin/videos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> К списку видео
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Импорт видео</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Все записи создаются черновиками — расшифровку и описания запускаете в карточке видео.
        </p>

        <div className="mt-6 space-y-3">
          <Label htmlFor="links">Ссылки (по одной в строке, необязательно «ссылка | название»)</Label>
          <Textarea
            id="links"
            rows={6}
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            placeholder={"https://…/fimoz.mp4 | Фимоз у мальчика\nhttps://…/varikotsele.mp4"}
          />
          <Button variant="outline" onClick={parseLinks}>Разобрать ссылки</Button>
        </div>

        <div
          {...handlers}
          className={`mt-8 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium text-foreground">Перетащите CSV сюда</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Колонки: title, video_url, rubric, poster_url (порядок и регистр не важны)
          </p>
        </div>

        {parsed.length > 0 && (
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-foreground">
                К импорту: {parsed.filter((r) => !r.error).length} из {parsed.length}
              </p>
              <Button onClick={runImport} disabled={importing}>
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Импортировать черновики
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {parsed.map((r, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm">
                  <span className="min-w-0 flex-1 truncate text-foreground">{r.title || "—"}</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{r.video_url}</span>
                  {r.error ? <Badge variant="destructive">{r.error}</Badge> : <Badge variant="secondary">Готово</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVideoImport;
