import { useRef, useState } from "react";
import mammoth from "mammoth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Sparkles, ImagePlus, Loader2, Eye, Pencil } from "lucide-react";
import MarkdownArticle from "./MarkdownArticle";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const ArticleMarkdownEditor = ({ value, onChange }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [importing, setImporting] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");

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
      const { data, error } = await supabase.functions.invoke("format-disease-article", {
        body: { text: value },
      });
      if (error) throw error;
      const formatted = (data as any)?.formatted;
      if (!formatted) throw new Error("Пустой ответ от AI");
      onChange(formatted);
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
    const marker = `\n\n[[GALLERY: caption="${galleryCaption.trim().replace(/"/g, "'")}"]]\n\n`;
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart ?? value.length;
      const end = ta.selectionEnd ?? value.length;
      const next = value.slice(0, start) + marker + value.slice(end);
      onChange(next);
    } else {
      onChange(value + marker);
    }
    setGalleryCaption("");
    setGalleryOpen(false);
    toast.success("Маркер галереи вставлен");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center border rounded-md p-2 bg-muted/30">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="gap-1.5"
        >
          {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
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
          {formatting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
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
          <span className="text-xs text-muted-foreground">Markdown · {value.length} симв.</span>
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

      {mode === "edit" ? (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Сырой текст или markdown статьи..."
          className="min-h-[420px] font-mono text-sm leading-relaxed"
        />
      ) : (
        <div className="min-h-[420px] border rounded-md p-6 bg-background overflow-auto">
          {value.trim() ? (
            <MarkdownArticle
              content={value}
              articleId="preview"
              articleSlug="preview"
              isAdmin={false}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              Нет содержимого для предпросмотра
            </p>
          )}
        </div>
      )}


      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вставить маркер галереи</DialogTitle>
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
              Маркер вставится в позицию курсора. Фото можно добавить позже прямо на странице статьи.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGalleryOpen(false)}>Отмена</Button>
            <Button onClick={insertGallery}>Вставить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArticleMarkdownEditor;
