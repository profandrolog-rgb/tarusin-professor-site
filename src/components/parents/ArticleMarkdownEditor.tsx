import { forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback } from "react";
import mammoth from "mammoth";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Sparkles,
  ImagePlus,
  Loader2,
  Eye,
  Pencil,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Undo,
  Redo,
} from "lucide-react";
import MarkdownArticle from "./MarkdownArticle";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GalleryPlaceholder } from "./tiptap/GalleryPlaceholderNode";
import { markdownToHtml, htmlToMarkdown } from "@/lib/markdown/galleryMarkers";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export interface ArticleMarkdownEditorHandle {
  getMarkdown: () => string;
}

const ArticleMarkdownEditor = forwardRef<ArticleMarkdownEditorHandle, Props>(({ value, onChange }, ref) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [previewCtx, setPreviewCtx] = useState<"parents" | "doctors">("parents");
  const [testingConn, setTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const handleTestConnection = async () => {
    setTestingConn(true);
    setConnStatus(null);
    try {
      const { data, error } = await supabase.functions.invoke("test-claude-connection", { body: {} });
      if (error) {
        setConnStatus({ ok: false, text: `❌ Нет связи: ${error.message || "unknown"}` });
      } else if (data?.ok) {
        setConnStatus({ ok: true, text: `✅ Связь с Claude API подтверждена (${data.latencyMs} мс)` });
      } else {
        setConnStatus({ ok: false, text: `❌ Нет связи: ${data?.error || "unknown"}` });
      }
    } catch (e: any) {
      setConnStatus({ ok: false, text: `❌ Нет связи: ${e?.message || "unknown"}` });
    } finally {
      setTestingConn(false);
    }
  };

  // Track last markdown we emitted/received so we don't reset the editor on our own updates.
  const lastSyncedMd = useRef<string>(value);
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      GalleryPlaceholder,
    ],
    content: markdownToHtml(value),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[420px] px-4 py-3 overflow-visible [&_ul]:list-disc [&_ul]:pl-7 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-7 [&_ol]:my-2 [&_li]:list-item [&_li]:pl-1 [&_li]:my-1 [&_li]:marker:text-foreground",
      },
    },
    onUpdate: ({ editor }) => {
      const md = htmlToMarkdown(editor.getHTML());
      lastSyncedMd.current = md;
      isInternalUpdate.current = true;
      onChange(md);
    },
  });

  useImperativeHandle(ref, () => ({
    getMarkdown: () => (editor ? htmlToMarkdown(editor.getHTML()) : value),
  }), [editor, value]);

  // External value changes (e.g., format, .docx import, initial load) → reload editor content.
  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (value === lastSyncedMd.current) return;
    lastSyncedMd.current = value;
    const html = markdownToHtml(value);
    editor.commands.setContent(html, { emitUpdate: false });
  }, [value, editor]);

  const handleDocx = async (file: File | null) => {
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      const text = (result.value || "").trim();
      if (!text) {
        toast.error("Не удалось извлечь текст из документа");
        return;
      }
      onChange(text);
      toast.success("Текст загружен, проверьте содержимое");
    } catch (e: any) {
      toast.error("Ошибка чтения .docx: " + (e?.message || e));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleFormat = async () => {
    if (!value.trim()) {
      toast.error("Сначала добавьте текст");
      return;
    }
    setFormatting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Требуется авторизация");

      const resp = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/format-disease-article`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ text: value }),
        }
      );

      if (!resp.ok) {
        let msg = `Ошибка ${resp.status}`;
        try {
          const errJson = await resp.json();
          msg = errJson?.error || msg;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      const json = await resp.json().catch(() => null);
      if (!json) throw new Error("Пустой ответ от AI");
      if (json.error) throw new Error(json.error);
      const result = typeof json.formatted === "string" ? json.formatted.trim() : "";
      if (!result) throw new Error("Пустой ответ от AI");
      onChange(result);
      toast.success("Текст отформатирован");
    } catch (e: any) {
      console.error(e);
      toast.error("Ошибка форматирования: " + (e?.message || "неизвестно"));
    } finally {
      setFormatting(false);
    }
  };

  const insertGallery = () => {
    if (!galleryCaption.trim()) {
      toast.error("Введите подпись");
      return;
    }
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertGalleryPlaceholder(galleryCaption.trim().replace(/"/g, "'"))
      .run();
    setGalleryCaption("");
    setGalleryOpen(false);
    toast.success("Блок галереи вставлен");
  };

  const promptLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL ссылки", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="space-y-2">
      <div className="sticky top-0 z-30 bg-background border rounded-md shadow-sm">
        <div className="flex flex-wrap gap-2 items-center p-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="gap-1.5"
          >
            {importing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Загрузить .docx
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => handleDocx(e.target.files?.[0] || null)}
          />

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleFormat}
            disabled={formatting || !value.trim()}
            className="gap-1.5"
          >
            {formatting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {formatting ? "Форматирую..." : "Форматировать"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setGalleryOpen(true)}
            className="gap-1.5"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            Галерея
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{value.length} симв.</span>
            <div className="flex rounded-md border overflow-hidden">
              <Button
                type="button"
                variant={mode === "edit" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("edit")}
                className="gap-1 rounded-none h-8"
              >
                <Pencil className="w-3.5 h-3.5" />
                Редактор
              </Button>
              <Button
                type="button"
                variant={mode === "preview" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("preview")}
                className="gap-1 rounded-none h-8"
              >
                <Eye className="w-3.5 h-3.5" />
                Предпросмотр
              </Button>
            </div>
          </div>
        </div>
        {mode === "edit" && (
          <div className="border-t">
            <FormattingToolbar editor={editor} onLink={promptLink} />
          </div>
        )}
      </div>

      {mode === "edit" ? (
        <div className="border rounded-md bg-background">
          <EditorContent editor={editor} />
        </div>

      ) : (
        <div className="border rounded-md bg-muted/30 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b bg-background">
            <span className="text-xs text-muted-foreground">Контекст:</span>
            <div className="flex rounded-md border overflow-hidden">
              <Button
                type="button"
                variant={previewCtx === "parents" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewCtx("parents")}
                className="rounded-none h-7 text-xs"
              >
                /for-parents/
              </Button>
              <Button
                type="button"
                variant={previewCtx === "doctors" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewCtx("doctors")}
                className="rounded-none h-7 text-xs"
              >
                /for-doctors/
              </Button>
            </div>
          </div>

          {!value.trim() ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Нет содержимого для предпросмотра
            </p>
          ) : previewCtx === "parents" ? (
            <div className="bg-background">
              <div className="bg-primary text-primary-foreground py-6 px-6">
                <div className="text-xs text-primary-foreground/70 mb-2">
                  Главная › Для родителей › Статья
                </div>
                <div className="text-2xl font-bold">Заголовок статьи</div>
              </div>
              <div className="max-w-4xl mx-auto px-6 py-8">
                <MarkdownArticle
                  content={value}
                  articleId="preview"
                  articleSlug="preview"
                  isAdmin={false}
                />
              </div>
            </div>
          ) : (
            <div className="bg-background">
              <div className="bg-slate-800 text-white py-5 px-6 border-b">
                <div className="text-xs text-slate-300 mb-1.5">
                  Главная › Для врачей › Материал
                </div>
                <div className="text-xl font-semibold">Заголовок материала</div>
              </div>
              <div className="max-w-3xl mx-auto px-6 py-8 text-[0.95rem]">
                <MarkdownArticle
                  content={value}
                  articleId="preview"
                  articleSlug="preview"
                  isAdmin={false}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вставить блок галереи</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Подпись к галерее</Label>
            <Input
              value={galleryCaption}
              onChange={(e) => setGalleryCaption(e.target.value)}
              placeholder="Например: Анатомия: схема строения органа"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  insertGallery();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Блок вставится в позицию курсора. Фото можно добавить позже прямо на странице статьи.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGalleryOpen(false)}>
              Отмена
            </Button>
            <Button onClick={insertGallery}>Вставить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

ArticleMarkdownEditor.displayName = "ArticleMarkdownEditor";

interface ToolbarProps {
  editor: Editor | null;
  onLink: () => void;
}

const TBtn = ({
  active,
  onClick,
  title,
  children,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <Button
    type="button"
    variant={active ? "default" : "ghost"}
    size="sm"
    className="h-8 w-8 p-0"
    onClick={onClick}
    title={title}
    disabled={disabled}
  >
    {children}
  </Button>
);

const FormattingToolbar = ({ editor, onLink }: ToolbarProps) => {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap gap-0.5 items-center px-2 py-1.5 bg-muted/40">
      <TBtn
        title="H1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="w-4 h-4" />
      </TBtn>
      <TBtn
        title="H2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="w-4 h-4" />
      </TBtn>
      <TBtn
        title="H3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="w-4 h-4" />
      </TBtn>
      <div className="w-px h-5 bg-border mx-1" />
      <TBtn
        title="Жирный"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="w-4 h-4" />
      </TBtn>
      <TBtn
        title="Курсив"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-4 h-4" />
      </TBtn>
      <div className="w-px h-5 bg-border mx-1" />
      <TBtn
        title="Маркированный список"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="w-4 h-4" />
      </TBtn>
      <TBtn
        title="Нумерованный список"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="w-4 h-4" />
      </TBtn>
      <TBtn
        title="Цитата"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="w-4 h-4" />
      </TBtn>
      <TBtn title="Ссылка" active={editor.isActive("link")} onClick={onLink}>
        <LinkIcon className="w-4 h-4" />
      </TBtn>
      <div className="w-px h-5 bg-border mx-1" />
      <TBtn
        title="Отменить"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="w-4 h-4" />
      </TBtn>
      <TBtn
        title="Повторить"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="w-4 h-4" />
      </TBtn>
    </div>
  );
};

export default ArticleMarkdownEditor;
