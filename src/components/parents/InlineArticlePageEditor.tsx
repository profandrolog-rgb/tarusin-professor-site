import { useEffect, useRef, useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import ArticleMarkdownEditor, {
  type ArticleMarkdownEditorHandle,
} from "@/components/parents/ArticleMarkdownEditor";

interface Props {
  article: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    article_content: string | null;
  };
  onSaved: (patch: { title: string; description: string | null; article_content: string }) => void;
  onClose: () => void;
}

/**
 * Полноценный редактор страницы статьи прямо на публичной странице:
 * заголовок, краткое описание, форматирование текста, галереи.
 * AI-функции скрыты — только ручное редактирование.
 */
const InlineArticlePageEditor = ({ article, onSaved, onClose }: Props) => {
  const editorRef = useRef<ArticleMarkdownEditorHandle>(null);
  const [title, setTitle] = useState(article.title || "");
  const [description, setDescription] = useState(article.description || "");
  const [content, setContent] = useState(article.article_content || "");
  const [saving, setSaving] = useState(false);
  const lastSaved = useRef({
    title: (article.title || "").trim(),
    description: (article.description || "").trim(),
    content: article.article_content || "",
  });
  const [autoState, setAutoState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const isDirty = () =>
    title.trim() !== lastSaved.current.title ||
    description.trim() !== lastSaved.current.description ||
    content !== lastSaved.current.content;

  const autoSave = async () => {
    const t = title.trim();
    const d = description.trim();
    if (!t || !isDirty()) return true;
    setAutoState("saving");
    const { data, error } = await supabase
      .from("disease_articles")
      .update({ title: t, description: d || null, article_content: content })
      .eq("id", article.id)
      .select("id");
    if (error || !data?.length) { setAutoState("error"); return false; }
    lastSaved.current = { title: t, description: d, content };
    onSaved({ title: t, description: d || null, article_content: content });
    setAutoState("saved");
    return true;
  };

  useEffect(() => {
    if (!isDirty()) return;
    const timer = window.setTimeout(() => { void autoSave(); }, 2000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, content]);

  const handleClose = async () => {
    await autoSave();
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Заголовок не может быть пустым");
      return;
    }
    setSaving(true);
    try {
      const nextContent = editorRef.current?.getMarkdown() ?? content;
      const { error } = await supabase
        .from("disease_articles")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          article_content: nextContent,
        })
        .eq("id", article.id);
      if (error) throw error;
      setContent(nextContent);
      lastSaved.current = { title: title.trim(), description: description.trim(), content: nextContent };
      setAutoState("saved");
      onSaved({
        title: title.trim(),
        description: description.trim() || null,
        article_content: nextContent,
      });
      toast.success("Изменения сохранены");
    } catch (e: any) {
      toast.error("Не удалось сохранить: " + (e?.message || "неизвестная ошибка"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 select-text" onCopy={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between gap-3 flex-wrap rounded-lg border bg-muted/40 px-4 py-3">
        <div className="text-sm font-medium text-foreground">
          Режим редактирования страницы
          <span className="ml-2 text-xs text-muted-foreground">/for-parents/{article.slug}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {autoState === "saving" ? "Сохраняю…" : autoState === "saved" ? "Сохранено автоматически" : autoState === "error" ? "Ошибка автосохранения" : ""}
          </span>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Сохраняю…" : "Сохранить изменения"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleClose} className="gap-1.5">
            <X className="w-4 h-4" /> Закрыть
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Заголовок страницы</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Краткое описание (под заголовком, в каталоге и SEO)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="resize-y"
          />
        </div>
      </div>

      <ArticleMarkdownEditor
        ref={editorRef}
        value={content}
        onChange={setContent}
        onSaveAsIs={handleSave}
        saving={saving}
        saveLabel="Сохранить изменения"
        hideAi
        galleryAdmin
        galleryArticleId={article.id}
        galleryArticleSlug={article.slug}
        draftKey={`inline-${article.id}`}
        draftMeta={{
          title,
          slug: article.slug,
          description,
          articleId: article.id,
        }}
      />

      <p className="text-xs text-muted-foreground">
        Загрузка фото, аннотирование (стрелки, овалы, подписи), подписи и перемещение галерей доступны
        во вкладке «Предпросмотр» — панель управления галереей появляется под каждой галереей.
      </p>


      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={handleClose} className="gap-1.5">
          <X className="w-4 h-4" /> Закрыть
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Сохраняю…" : "Сохранить изменения"}
        </Button>
      </div>
    </div>
  );
};

export default InlineArticlePageEditor;
