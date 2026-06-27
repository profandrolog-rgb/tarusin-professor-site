import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FolderTree, FileText, Plus, Save, Trash2, Search, Calendar, Network, Hash,
  Link as LinkIcon, ChevronLeft, ArrowLeft, Loader2, Sparkles, FolderPlus,
  Upload, Download,
} from "lucide-react";
import { ChatMarkdown } from "@/components/cabinet/ChatMarkdown";
import { parseWikiLinks, parseTags, renderWikiLinksToAnchors } from "@/lib/vault/parseWikiLinks";
import ForceGraph2D from "react-force-graph-2d";

interface Note {
  id: string;
  title: string;
  slug: string;
  folder_path: string;
  content_md: string;
  tags: string[];
  is_daily: boolean;
  daily_date: string | null;
  patient_id: string | null;
  updated_at: string;
}

interface LinkRow {
  id: string;
  from_note_id: string;
  to_note_id: string | null;
  to_title: string;
  context_snippet: string | null;
}

interface SemHit {
  note_id: string;
  title: string;
  folder_path: string;
  similarity: number;
  snippet: string;
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "note";
}

export default function CabinetVault() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(params.get("note"));
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftFolder, setDraftFolder] = useState("/");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [semantic, setSemantic] = useState(false);
  const [semResults, setSemResults] = useState<SemHit[]>([]);
  const [semLoading, setSemLoading] = useState(false);
  const [tab, setTab] = useState<"editor" | "graph">("editor");
  const saveTimer = useRef<number | null>(null);

  // ---------- Load all notes + links ----------
  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: n }, { data: l }] = await Promise.all([
      supabase.from("vault_notes").select("*").order("updated_at", { ascending: false }),
      supabase.from("vault_links").select("*"),
    ]);
    setNotes((n as any) ?? []);
    setLinks((l as any) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { if (user) loadAll(); }, [user, loadAll]);

  // ---------- Active note hydration ----------
  const active = useMemo(() => notes.find((x) => x.id === activeId) || null, [notes, activeId]);
  useEffect(() => {
    if (active) {
      setDraftTitle(active.title);
      setDraftBody(active.content_md);
      setDraftFolder(active.folder_path);
      setDirty(false);
    } else {
      setDraftTitle(""); setDraftBody(""); setDraftFolder("/"); setDirty(false);
    }
  }, [active?.id]);

  useEffect(() => {
    if (activeId) setParams({ note: activeId }, { replace: true });
    else setParams({}, { replace: true });
  }, [activeId]);

  // ---------- Title-to-id resolver ----------
  const titleIndex = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of notes) m.set(n.title.toLowerCase(), n.id);
    return m;
  }, [notes]);

  const resolver = useCallback((t: string) => titleIndex.get(t.toLowerCase()) ?? null, [titleIndex]);

  // ---------- Backlinks ----------
  const backlinks = useMemo(() => {
    if (!activeId) return [];
    const idsOrTitleMatches = links.filter(
      (l) => l.to_note_id === activeId ||
        (l.to_note_id === null && active && l.to_title.toLowerCase() === active.title.toLowerCase())
    );
    return idsOrTitleMatches.map((l) => ({
      link: l,
      note: notes.find((n) => n.id === l.from_note_id) || null,
    })).filter((x) => x.note);
  }, [links, activeId, active, notes]);

  const outgoing = useMemo(() => {
    if (!activeId) return [];
    return links.filter((l) => l.from_note_id === activeId);
  }, [links, activeId]);

  // ---------- Folder tree ----------
  const folderTree = useMemo(() => {
    const groups = new Map<string, Note[]>();
    for (const n of notes) {
      const f = n.folder_path || "/";
      if (!groups.has(f)) groups.set(f, []);
      groups.get(f)!.push(n);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [notes]);

  // ---------- Save ----------
  const save = useCallback(async (opts?: { silent?: boolean }) => {
    if (!user || !draftTitle.trim()) return;
    setSaving(true);
    try {
      const slug = slugify(draftTitle.trim());
      const tags = parseTags(draftBody);
      const folder = draftFolder.trim() || "/";

      let id = activeId;
      if (id) {
        const { error } = await supabase.from("vault_notes").update({
          title: draftTitle.trim(), slug, folder_path: folder, content_md: draftBody, tags,
        }).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("vault_notes").insert({
          owner_id: user.id, title: draftTitle.trim(), slug, folder_path: folder,
          content_md: draftBody, tags,
        }).select().single();
        if (error) throw error;
        id = data.id;
        setActiveId(id);
      }

      // Replace links
      await supabase.from("vault_links").delete().eq("from_note_id", id!);
      const parsed = parseWikiLinks(draftBody);
      if (parsed.length) {
        const rows = parsed.map((p) => ({
          owner_id: user.id,
          from_note_id: id!,
          to_note_id: resolver(p.target),
          to_title: p.target,
          context_snippet: p.context,
        }));
        await supabase.from("vault_links").insert(rows);
      }

      // Trigger embedding (fire-and-forget)
      supabase.functions.invoke("vault-embed", { body: { noteId: id } }).catch(() => {});

      setDirty(false);
      await loadAll();
      if (!opts?.silent) toast.success("Сохранено");
    } catch (e: any) {
      toast.error(`Ошибка сохранения: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }, [user, draftTitle, draftBody, draftFolder, activeId, resolver, loadAll]);

  // Autosave every 5s of inactivity when dirty
  useEffect(() => {
    if (!dirty) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { save({ silent: true }); }, 5000);
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
  }, [dirty, draftTitle, draftBody, draftFolder, save]);

  // Ctrl/Cmd+S
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save]);

  // ---------- New note ----------
  const createNote = useCallback(async (preset?: { title?: string; folder?: string; isDaily?: boolean }) => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const title = preset?.title || (preset?.isDaily ? `📅 ${today}` : "Без названия");
    const { data, error } = await supabase.from("vault_notes").insert({
      owner_id: user.id, title, slug: slugify(title),
      folder_path: preset?.folder || (preset?.isDaily ? "/Daily" : "/"),
      content_md: "", tags: [],
      is_daily: preset?.isDaily ?? false,
      daily_date: preset?.isDaily ? today : null,
    }).select().single();
    if (error) return toast.error(error.message);
    await loadAll();
    setActiveId(data.id);
  }, [user, loadAll]);

  const deleteNote = useCallback(async () => {
    if (!active) return;
    if (!confirm(`Удалить «${active.title}»?`)) return;
    await supabase.from("vault_notes").delete().eq("id", active.id);
    setActiveId(null);
    await loadAll();
    toast.success("Удалено");
  }, [active, loadAll]);

  // ---------- Search ----------
  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || semantic) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) ||
        n.content_md.toLowerCase().includes(q) ||
        n.tags.some((t) => t.includes(q))
    );
  }, [notes, search, semantic]);

  const runSemanticSearch = useCallback(async () => {
    if (!search.trim()) return;
    setSemLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("vault-search", { body: { query: search.trim(), limit: 15 } });
      if (error) throw error;
      setSemResults(data?.results ?? []);
    } catch (e: any) {
      toast.error(`Ошибка поиска: ${e.message}`);
    } finally {
      setSemLoading(false);
    }
  }, [search]);

  // ---------- Graph data ----------
  const graphData = useMemo(() => {
    const nodes = notes.map((n) => ({
      id: n.id, name: n.title, folder: n.folder_path,
      val: 1 + (links.filter((l) => l.to_note_id === n.id || l.from_note_id === n.id).length * 0.6),
    }));
    const edges = links.filter((l) => l.to_note_id).map((l) => ({ source: l.from_note_id, target: l.to_note_id! }));
    return { nodes, links: edges };
  }, [notes, links]);

  // ---------- Wiki-link clicks in preview ----------
  const handlePreviewClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const a = target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#note:")) {
      e.preventDefault();
      setActiveId(href.slice(6));
    }
  }, []);

  const renderedBody = useMemo(
    () => renderWikiLinksToAnchors(draftBody, resolver),
    [draftBody, resolver]
  );

  // ---------- Guards ----------
  if (authLoading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  if (!user || !isAdmin) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <p className="text-muted-foreground mb-3">Vault доступен только админу.</p>
        <Button onClick={() => navigate("/cabinet")}>← В кабинет</Button>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Link to="/cabinet" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Кабинет
        </Link>
        <h1 className="text-lg font-semibold flex items-center gap-2 ml-2">
          <FolderTree className="w-5 h-5 text-primary" /> Vault
          <span className="text-xs text-muted-foreground font-normal">{notes.length} заметок · {links.length} связей</span>
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={async () => {
            const t = toast.loading("Push → GitHub…");
            try {
              const { data, error } = await supabase.functions.invoke("vault-sync", { body: { action: "push" } });
              if (error) throw error;
              toast.success(`Push: создано ${data.created}, обновлено ${data.updated}, без изм. ${data.skipped}`, { id: t });
            } catch (e: any) { toast.error("Push: " + (e.message || e), { id: t }); }
          }}>
            <Upload className="w-4 h-4 mr-1" /> Push
          </Button>
          <Button size="sm" variant="outline" onClick={async () => {
            const t = toast.loading("Pull ← GitHub…");
            try {
              const { data, error } = await supabase.functions.invoke("vault-sync", { body: { action: "pull" } });
              if (error) throw error;
              toast.success(`Pull: новых ${data.imported}, обновлено ${data.updated}, без изм. ${data.skipped}`, { id: t });
              await loadAll();
            } catch (e: any) { toast.error("Pull: " + (e.message || e), { id: t }); }
          }}>
            <Download className="w-4 h-4 mr-1" /> Pull
          </Button>
          <Button size="sm" variant="outline" onClick={() => createNote({ isDaily: true })}>
            <Calendar className="w-4 h-4 mr-1" /> Дневник
          </Button>
          <Button size="sm" onClick={() => createNote()}>
            <Plus className="w-4 h-4 mr-1" /> Новая
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList>
          <TabsTrigger value="editor"><FileText className="w-4 h-4 mr-1" />Редактор</TabsTrigger>
          <TabsTrigger value="graph"><Network className="w-4 h-4 mr-1" />Граф</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-3">
          <div className="grid grid-cols-12 gap-3 min-h-[calc(100vh-200px)]">
            {/* === Left: tree + search === */}
            <aside className="col-span-12 md:col-span-3 border rounded-lg bg-card flex flex-col">
              <div className="p-2 border-b space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={semantic ? "Что искать по смыслу..." : "Поиск..."}
                    className="pl-8 h-9"
                    onKeyDown={(e) => { if (e.key === "Enter" && semantic) runSemanticSearch(); }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm" variant={semantic ? "default" : "outline"} className="h-7 text-xs flex-1"
                    onClick={() => { setSemantic(!semantic); setSemResults([]); }}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />Смысл
                  </Button>
                  {semantic && (
                    <Button size="sm" className="h-7 text-xs" onClick={runSemanticSearch} disabled={!search.trim() || semLoading}>
                      {semLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Искать"}
                    </Button>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 max-h-[calc(100vh-340px)]">
                {loading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
                ) : semantic && semResults.length ? (
                  <div className="p-1">
                    {semResults.map((r) => (
                      <button
                        key={r.note_id}
                        onClick={() => setActiveId(r.note_id)}
                        className="w-full text-left px-2 py-2 rounded hover:bg-muted text-sm border-b border-border/40"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-medium truncate">{r.title}</span>
                          <span className="text-[10px] text-primary shrink-0">{Math.round(r.similarity * 100)}%</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">{r.folder_path}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{r.snippet}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-1">
                    {folderTree.map(([folder, items]) => (
                      <div key={folder} className="mb-2">
                        <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                          <FolderTree className="w-3 h-3" /> {folder}
                        </div>
                        {items
                          .filter((n) => !search || filteredNotes.includes(n))
                          .map((n) => (
                            <button
                              key={n.id}
                              onClick={() => setActiveId(n.id)}
                              className={`w-full text-left px-2 py-1.5 rounded hover:bg-muted text-sm flex items-center gap-2 ${
                                activeId === n.id ? "bg-primary/10 text-primary font-medium" : ""
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0 opacity-60" />
                              <span className="truncate flex-1">{n.title}</span>
                              {n.tags.length > 0 && <Hash className="w-3 h-3 opacity-50" />}
                            </button>
                          ))}
                      </div>
                    ))}
                    {!notes.length && (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        Пусто. Нажмите «Новая», чтобы создать первую заметку.
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </aside>

            {/* === Center: editor === */}
            <main className="col-span-12 md:col-span-6 border rounded-lg bg-card flex flex-col">
              {!active && !dirty ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  Выберите заметку или создайте новую
                </div>
              ) : (
                <>
                  <div className="p-2 border-b space-y-2">
                    <Input
                      value={draftTitle}
                      onChange={(e) => { setDraftTitle(e.target.value); setDirty(true); }}
                      placeholder="Заголовок"
                      className="text-lg font-semibold border-0 focus-visible:ring-0 px-2"
                    />
                    <div className="flex items-center gap-2 px-1">
                      <FolderPlus className="w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        value={draftFolder}
                        onChange={(e) => { setDraftFolder(e.target.value); setDirty(true); }}
                        placeholder="/Папка"
                        className="h-7 text-xs flex-1 max-w-[200px]"
                      />
                      <div className="ml-auto flex items-center gap-1">
                        {dirty && <span className="text-[10px] text-amber-600">● несохранено</span>}
                        <Button size="sm" variant="ghost" onClick={() => save()} disabled={saving || !draftTitle.trim()}>
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        </Button>
                        {active && (
                          <Button size="sm" variant="ghost" onClick={deleteNote} className="text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 divide-y lg:divide-y-0 lg:divide-x">
                    <Textarea
                      value={draftBody}
                      onChange={(e) => { setDraftBody(e.target.value); setDirty(true); }}
                      placeholder="Markdown… используйте [[Название]] для ссылок и #теги"
                      className="border-0 resize-none focus-visible:ring-0 font-mono text-sm min-h-[400px] rounded-none"
                    />
                    <div className="overflow-auto p-4 min-h-[400px]" onClick={handlePreviewClick}>
                      <ChatMarkdown>{renderedBody || "_Превью появится здесь_"}</ChatMarkdown>
                    </div>
                  </div>
                </>
              )}
            </main>

            {/* === Right: backlinks & meta === */}
            <aside className="col-span-12 md:col-span-3 border rounded-lg bg-card p-3 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {active ? (
                <>
                  {active.tags.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
                        <Hash className="w-3 h-3" />Теги
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {active.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">#{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />Исходящие ({outgoing.length})
                    </div>
                    {outgoing.length === 0 ? (
                      <div className="text-[11px] text-muted-foreground italic">Нет ссылок [[…]]</div>
                    ) : (
                      <div className="space-y-1">
                        {outgoing.map((l) => (
                          <button
                            key={l.id}
                            onClick={() => l.to_note_id ? setActiveId(l.to_note_id) : null}
                            className={`w-full text-left text-xs px-2 py-1 rounded hover:bg-muted ${
                              !l.to_note_id ? "text-orange-500" : "text-primary"
                            }`}
                            title={!l.to_note_id ? "Заметка ещё не создана" : ""}
                          >
                            {l.to_note_id ? "→" : "✗"} {l.to_title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3 rotate-180" />Backlinks ({backlinks.length})
                    </div>
                    {backlinks.length === 0 ? (
                      <div className="text-[11px] text-muted-foreground italic">Никто не ссылается</div>
                    ) : (
                      <div className="space-y-2">
                        {backlinks.map(({ link, note }) => (
                          <button
                            key={link.id}
                            onClick={() => note && setActiveId(note.id)}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-muted border border-border/40"
                          >
                            <div className="text-xs font-medium text-primary">← {note!.title}</div>
                            {link.context_snippet && (
                              <div className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                                …{link.context_snippet}…
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t text-[10px] text-muted-foreground">
                    Обновлено: {new Date(active.updated_at).toLocaleString("ru")}
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground italic">Выберите заметку, чтобы увидеть связи</div>
              )}
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="graph" className="mt-3">
          <div className="border rounded-lg bg-card overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
            {graphData.nodes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Граф появится, когда добавите заметки и [[ссылки]] между ними
              </div>
            ) : (
              <ForceGraph2D
                graphData={graphData}
                nodeLabel="name"
                nodeAutoColorBy="folder"
                linkColor={() => "rgba(120,120,120,0.35)"}
                linkDirectionalArrowLength={4}
                linkDirectionalArrowRelPos={1}
                onNodeClick={(node: any) => { setActiveId(node.id); setTab("editor"); }}
                nodeCanvasObject={(node: any, ctx, scale) => {
                  const label = node.name as string;
                  const fontSize = 12 / scale;
                  ctx.fillStyle = node.color || "#3b82f6";
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, Math.sqrt(node.val) * 3, 0, 2 * Math.PI);
                  ctx.fill();
                  if (scale > 1.2) {
                    ctx.font = `${fontSize}px sans-serif`;
                    ctx.textAlign = "center";
                    ctx.fillStyle = "#666";
                    ctx.fillText(label.slice(0, 30), node.x, node.y + Math.sqrt(node.val) * 3 + fontSize);
                  }
                }}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
