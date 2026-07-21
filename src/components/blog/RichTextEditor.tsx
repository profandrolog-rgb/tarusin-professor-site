import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Bold, Italic, Underline as UnderlineIcon, ImagePlus, Loader2, List, ListOrdered, Quote, Images, SpellCheck, BookOpen, Copy, Scissors, ClipboardPaste, BookPlus, BookMinus, EyeOff, Table as TableIcon, Rows as RowsIcon, Columns as ColumnsIcon, X as XIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GalleryPlaceholder } from "@/components/parents/tiptap/GalleryPlaceholderNode";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import SpellCheckPanel, { type SpellIssue } from "@/components/blog/SpellCheckPanel";
import { useSpellcheckDictionary } from "@/hooks/useSpellcheckDictionary";
import { toast } from "sonner";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  storageBucket?: string;
  storageFolder?: string;
  /** Slug статьи/обзора — используется при редактировании галереи через плашку. */
  ownerSlug?: string;
  /** Даёт родителю доступ к экземпляру редактора для вставки в позицию курсора. */
  onEditorReady?: (editor: Editor | null) => void;
  /** Показывать кнопку «Галерея» и обрабатывать вставку блока-заполнителя. */
  onInsertGalleryClick?: () => void;
  /**
   * Разрешать ли редактирование содержимого галереи прямо из плашки.
   * false — плашка read-only, изображения загружаются на публичной странице.
   */
  allowGalleryUpload?: boolean;
}

const RichTextEditor = ({ content, onChange, placeholder, storageBucket = "disease-media", storageFolder = "article-images", ownerSlug = "gallery", onEditorReady, onInsertGalleryClick, allowGalleryUpload = true }: RichTextEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isToolbarFixed, setIsToolbarFixed] = useState(false);
  const [toolbarWidth, setToolbarWidth] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const uploadAndInsertImage = useCallback(async (file: File, editorInstance: ReturnType<typeof useEditor>) => {
    if (!editorInstance) return;
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || file.type.split("/").pop() || "png").toLowerCase();
      const path = `${storageFolder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(storageBucket).upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
      editorInstance.chain().focus().setImage({ src: data.publicUrl, alt: file.name || "image" }).run();
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploading(false);
    }
  }, [storageBucket, storageFolder]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, codeBlock: false }),
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      GalleryPlaceholder.configure({ bucket: storageBucket, folder: storageFolder, ownerSlug, allowUpload: allowGalleryUpload }),
      Table.configure({ resizable: true, HTMLAttributes: { class: "article-table" } }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] p-3 text-sm text-foreground focus:outline-none prose prose-sm max-w-none",
        spellcheck: "false",
      },
      handleKeyDown: (view, event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          const { state, dispatch } = view;
          const { from } = state.selection;
          const indent = "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0";
          dispatch(state.tr.insertText(indent, from));
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          if (it.kind === "file" && it.type.startsWith("image/")) {
            const file = it.getAsFile();
            if (file) {
              event.preventDefault();
              void uploadAndInsertImage(file, editor);
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = (event as DragEvent).dataTransfer?.files;
        if (!files || !files.length) return false;
        const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (!imgs.length) return false;
        event.preventDefault();
        for (const f of imgs) void uploadAndInsertImage(f, editor);
        return true;
      },
    },
  });

  // Sticky toolbar logic using scroll listener
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerBottom = containerRect.bottom;
    const toolbarHeight = 42;
    
    // Fix toolbar when container top goes above viewport, but container bottom is still visible
    if (containerRect.top < 0 && containerBottom > toolbarHeight + 50) {
      if (!isToolbarFixed) {
        setToolbarWidth(containerRect.width);
        setIsToolbarFixed(true);
      }
    } else {
      if (isToolbarFixed) {
        setIsToolbarFixed(false);
      }
    }
  }, [isToolbarFixed]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [handleScroll]);

  useEffect(() => {
    if (!editor) return;
    // Sync external content changes (e.g. when arriving from Orchestrator)
    // without disrupting user typing — only update if the HTML differs.
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  useEffect(() => {
    if (!onEditorReady) return;
    onEditorReady(editor ?? null);
    return () => onEditorReady(null);
  }, [editor, onEditorReady]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${storageFolder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(storageBucket).upload(path, file);
      if (error) throw error;

      const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
      editor.chain().focus().setImage({ src: data.publicUrl, alt: file.name }).run();
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const navigate = useNavigate();
  const dict = useSpellcheckDictionary();
  const [sessionIgnored, setSessionIgnored] = useState<Set<string>>(new Set());

  // Spellcheck panel state
  const [spellOpen, setSpellOpen] = useState(false);
  const [spellLoading, setSpellLoading] = useState(false);
  const [rawSpellIssues, setRawSpellIssues] = useState<SpellIssue[]>([]);
  const [spellModel, setSpellModel] = useState<string | undefined>(undefined);
  const checkedHashRef = useRef<string | null>(null);
  const inflightHashRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Контекстное меню правого клика
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; word: string } | null>(null);

  const wordRe = useMemo(() => /[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё\-]{2,}/g, []);
  const issueContainsIgnored = useCallback((iss: SpellIssue) => {
    const words = String(iss.fragment).match(wordRe) || [];
    for (const w of words) {
      const lo = w.toLowerCase();
      if (dict.has(lo) || sessionIgnored.has(lo)) return true;
    }
    return false;
  }, [dict, sessionIgnored, wordRe]);

  const spellIssues = useMemo(
    () => rawSpellIssues.filter((i) => !issueContainsIgnored(i)),
    [rawSpellIssues, issueContainsIgnored],
  );
  const setSpellIssues: typeof setRawSpellIssues = setRawSpellIssues;

  const hashText = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return String(h);
  };
  const plainOf = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const runSpellcheckCore = useCallback(async (html: string, opts?: { silent?: boolean }) => {
    const plain = plainOf(html);
    if (plain.length < 3) return;
    const h = hashText(plain);
    if (inflightHashRef.current === h) return;
    if (checkedHashRef.current === h) return;
    inflightHashRef.current = h;
    setSpellOpen(true);
    setSpellLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("text-spellcheck", { body: { html } });
      if (error) throw error;
      const issues: SpellIssue[] = Array.isArray(data?.issues) ? data.issues : [];
      setSpellIssues(issues);
      setSpellModel(data?.model);

      checkedHashRef.current = h;
    } catch (e: any) {
      if (!opts?.silent) toast.error(e?.message || "Ошибка проверки орфографии");
    } finally {
      inflightHashRef.current = null;
      setSpellLoading(false);
    }
  }, []);

  const runSpellcheck = useCallback(async () => {
    if (!editor) return;
    const html = editor.getHTML();
    if (plainOf(html).length < 3) {
      toast.error("Нечего проверять — текст пуст");
      return;
    }
    // Принудительный запуск сбрасывает кэш хеша
    checkedHashRef.current = null;
    await runSpellcheckCore(html);
  }, [editor, runSpellcheckCore]);

  // Автозапуск при появлении текста в редакторе (первое открытие, а также
  // после подстановки текста оркестратором).
  useEffect(() => {
    if (!editor) return;
    const html = editor.getHTML();
    const plain = plainOf(html);
    if (plain.length < 3) return;
    const h = hashText(plain);
    if (checkedHashRef.current === h) return;
    void runSpellcheckCore(html, { silent: true });
  }, [editor, content, runSpellcheckCore]);

  // Дебаунс при редактировании: 20 сек тишины и текст реально изменился.
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = window.setTimeout(() => {
        const html = editor.getHTML();
        const plain = plainOf(html);
        if (plain.length < 3) return;
        const h = hashText(plain);
        if (checkedHashRef.current === h) return;
        void runSpellcheckCore(html, { silent: true });
      }, 20_000);
    };
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    };
  }, [editor, runSpellcheckCore]);

  const applyIssue = useCallback((iss: SpellIssue) => {
    if (!editor) return;
    const html = editor.getHTML();
    if (!html.includes(iss.fragment)) {
      toast.warning("Фрагмент не найден в тексте — возможно, уже изменён");
      return;
    }
    const nextHtml = html.replace(iss.fragment, iss.correction);
    editor.commands.setContent(nextHtml, { emitUpdate: true });
    onChange(nextHtml);
    setSpellIssues((prev) => prev.filter((x) => x !== iss));
  }, [editor, onChange]);

  const applyAll = useCallback(() => {
    if (!editor) return;
    let html = editor.getHTML();
    const remaining: SpellIssue[] = [];
    for (const iss of spellIssues) {
      if (html.includes(iss.fragment)) html = html.replace(iss.fragment, iss.correction);
      else remaining.push(iss);
    }
    editor.commands.setContent(html, { emitUpdate: true });
    onChange(html);
    // Убираем применённые: оставляем raw \ (spellIssues \ remaining)
    const applied = new Set(spellIssues.filter((s) => !remaining.includes(s)));
    setRawSpellIssues((prev) => prev.filter((s) => !applied.has(s)));
    if (remaining.length) toast.warning(`Применено, ${remaining.length} фрагментов не найдено`);
    else toast.success("Все правки применены");
  }, [editor, spellIssues, onChange]);

  const addIssueToDictionary = useCallback(async (iss: SpellIssue) => {
    const words = String(iss.fragment).match(wordRe) || [];
    const word = words[0];
    if (!word) return;
    const ok = await dict.add(word);
    if (ok) {
      toast.success(`«${word}» добавлено в словарь`);
      setRawSpellIssues((prev) => prev.filter((x) => x !== iss));
    }
  }, [dict, wordRe]);

  // ── Контекстное меню правого клика ──────────────────────────────────────
  const getWordAtPoint = useCallback((x: number, y: number): string | null => {
    const anyDoc = document as any;
    let node: Node | null = null; let offset = 0;
    if (typeof anyDoc.caretPositionFromPoint === "function") {
      const pos = anyDoc.caretPositionFromPoint(x, y);
      if (!pos) return null;
      node = pos.offsetNode; offset = pos.offset;
    } else if (typeof document.caretRangeFromPoint === "function") {
      const range = document.caretRangeFromPoint(x, y);
      if (!range) return null;
      node = range.startContainer; offset = range.startOffset;
    }
    if (!node || node.nodeType !== 3) return null;
    const text = (node as Text).data;
    const isWord = (ch: string) => /[A-Za-zА-Яа-яЁё\-]/.test(ch);
    let start = offset; while (start > 0 && isWord(text[start - 1])) start--;
    let end = offset; while (end < text.length && isWord(text[end])) end++;
    const w = text.slice(start, end).replace(/^-+|-+$/g, "");
    return w.length >= 2 ? w : null;
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const w = getWordAtPoint(e.clientX, e.clientY);
    if (!w) return; // отдаём браузеру
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, word: w });
  }, [getWordAtPoint]);

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [ctxMenu]);

  const ctxAddToDict = useCallback(async () => {
    if (!ctxMenu) return;
    const w = ctxMenu.word;
    const ok = await dict.add(w);
    if (ok) {
      toast.success(`«${w}» добавлено в словарь`);
      const lo = w.toLowerCase();
      setRawSpellIssues((prev) => prev.filter((i) => {
        const words = (i.fragment.match(wordRe) || []).map((x) => x.toLowerCase());
        return !words.includes(lo);
      }));
    }
    setCtxMenu(null);
  }, [ctxMenu, dict, wordRe]);

  const ctxRemoveFromDict = useCallback(async () => {
    if (!ctxMenu) return;
    const w = ctxMenu.word;
    const ok = await dict.remove(w);
    if (ok) toast.success(`«${w}» убрано из словаря`);
    setCtxMenu(null);
  }, [ctxMenu, dict]);

  const ctxIgnoreInSession = useCallback(() => {
    if (!ctxMenu) return;
    const lo = ctxMenu.word.toLowerCase();
    setSessionIgnored((prev) => new Set(prev).add(lo));
    toast.info(`«${ctxMenu.word}» игнорируется в этом тексте`);
    setCtxMenu(null);
  }, [ctxMenu]);

  const ctxExec = useCallback(async (cmd: "copy" | "cut" | "paste") => {
    setCtxMenu(null);
    editor?.chain().focus().run();
    if (cmd === "paste") {
      try {
        const t = await navigator.clipboard.readText();
        if (t) editor?.chain().focus().insertContent(t).run();
      } catch { toast.error("Браузер запретил вставку из буфера"); }
      return;
    }
    try { document.execCommand(cmd); } catch { /* ignore */ }
  }, [editor]);

  const openDictionary = useCallback(() => navigate("/admin/spellcheck-dictionary"), [navigate]);

  if (!editor) return null;


  const toolbarContent = (
    <>
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("bold") ? "default" : "ghost"}
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("italic") ? "default" : "ghost"}
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("underline") ? "default" : "ghost"}
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        size="icon"
        variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
        className="h-8 w-8 text-xs font-bold"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </Button>
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
        className="h-8 w-8 text-xs font-bold"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        size="icon"
        variant={editor.isActive("bulletList") ? "default" : "ghost"}
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Маркированный список"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("orderedList") ? "default" : "ghost"}
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Нумерованный список"
      >
        <ListOrdered className="w-4 h-4" />
      </Button>

      <Button
        type="button"
        size="icon"
        variant={editor.isActive("blockquote") ? "default" : "ghost"}
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Цитата"
      >
        <Quote className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        title="Вставить изображение"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {onInsertGalleryClick && (
        <>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onInsertGalleryClick}
            title="Вставить галерею в позицию курсора"
          >
            <Images className="w-4 h-4" />
          </Button>
        </>
      )}

      <div className="w-px h-6 bg-border mx-1" />
      <Button
        type="button"
        size="icon"
        variant={spellOpen ? "default" : "ghost"}
        className="h-8 w-8"
        onClick={runSpellcheck}
        disabled={spellLoading}
        title="Проверить орфографию"
      >
        {spellLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SpellCheck className="w-4 h-4" />}
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={openDictionary}
        title="Словарь"
      >
        <BookOpen className="w-4 h-4" />
      </Button>
    </>
  );


  return (
    <div
      ref={containerRef}
      className={`border rounded-md bg-background relative transition-colors ${
        dragOver ? "border-primary ring-2 ring-primary/40 bg-primary/5" : "border-input"
      }`}
      onDragOver={(e) => {
        if (e.dataTransfer?.types?.includes("Files")) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragOver(false);
      }}
      onDrop={(e) => {
        setDragOver(false);
        if (e.defaultPrevented) return;
        const files = e.dataTransfer?.files;
        if (!files || !files.length) return;
        const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (!imgs.length) return;
        e.preventDefault();
        for (const f of imgs) void uploadAndInsertImage(f, editor);
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Spacer when toolbar is fixed */}
      {isToolbarFixed && <div className="h-[42px]" />}

      {/* Toolbar */}
      <div
        ref={toolbarRef}
        className={`flex items-center gap-1 p-1 border-b border-input bg-muted/80 backdrop-blur-sm flex-wrap rounded-t-md z-50 ${
          isToolbarFixed ? "fixed top-0 shadow-md" : ""
        }`}
        style={isToolbarFixed ? { width: toolbarWidth } : undefined}
      >
        {toolbarContent}
      </div>

      <EditorContent editor={editor} />

      {spellOpen && (
        <SpellCheckPanel
          issues={spellIssues}
          loading={spellLoading}
          model={spellModel}
          onApply={applyIssue}
          onDismiss={(idx) => {
            const target = spellIssues[idx];
            if (!target) return;
            setRawSpellIssues((prev) => prev.filter((x) => x !== target));
          }}
          onApplyAll={applyAll}
          onClose={() => setSpellOpen(false)}
          onAddToDictionary={addIssueToDictionary}
          onOpenDictionary={openDictionary}
        />
      )}

      {ctxMenu && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setCtxMenu(null)} onContextMenu={(e) => { e.preventDefault(); setCtxMenu(null); }} />
          <div
            className="fixed z-[61] min-w-[220px] rounded-md border border-border bg-popover text-popover-foreground shadow-md py-1 text-sm"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
          >
            <div className="px-3 py-1.5 text-xs text-muted-foreground truncate">«{ctxMenu.word}»</div>
            {dict.has(ctxMenu.word) ? (
              <button className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-accent text-left" onClick={ctxRemoveFromDict}>
                <BookMinus className="w-4 h-4" /> Убрать из словаря
              </button>
            ) : (
              <button className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-accent text-left" onClick={ctxAddToDict}>
                <BookPlus className="w-4 h-4" /> Добавить в словарь
              </button>
            )}
            <button className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-accent text-left" onClick={ctxIgnoreInSession}>
              <EyeOff className="w-4 h-4" /> Игнорировать в этом тексте
            </button>
            <div className="h-px my-1 bg-border" />
            <button className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-accent text-left" onClick={() => ctxExec("copy")}>
              <Copy className="w-4 h-4" /> Копировать
            </button>
            <button className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-accent text-left" onClick={() => ctxExec("cut")}>
              <Scissors className="w-4 h-4" /> Вырезать
            </button>
            <button className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-accent text-left" onClick={() => ctxExec("paste")}>
              <ClipboardPaste className="w-4 h-4" /> Вставить
            </button>
          </div>
        </>
      )}

      {dragOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-[1px] rounded-md">
          <div className="text-sm font-medium text-primary bg-background/90 border border-primary/40 rounded-md px-3 py-1.5 shadow">
            Отпустите — изображение загрузится в статью
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
