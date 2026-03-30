import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/blog/RichTextEditor";
import RESEARCH_CATEGORIES, { AGE_GROUPS } from "./ResearchCategories";
import { Upload, X, FileText, Loader2, Save } from "lucide-react";
import { toast as sonnerToast } from "sonner";

interface ResearchPostFormProps {
  article?: {
    id: string;
    title: string;
    content: string;
    excerpt: string | null;
    category: string;
    age_group?: string;
    image_path: string | null;
    is_published: boolean;
  } | null;
  onSave: () => void;
  onCancel: () => void;
}

const ResearchPostForm = ({ article, onSave, onCancel }: ResearchPostFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const autoSaveKey = article ? `research_edit_${article.id}` : "research_new";

  // Check for saved draft on mount
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [title, setTitle] = useState(article?.title || "");
  const [content, setContent] = useState(article?.content || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [category, setCategory] = useState(article?.category || "general");
  const [ageGroup, setAgeGroup] = useState(article?.age_group || "all");
  const [isPublished, setIsPublished] = useState(article?.is_published ?? false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);

  const formData = useMemo(() => ({
    title, content, excerpt, category, ageGroup, isPublished,
  }), [title, content, excerpt, category, ageGroup, isPublished]);

  const { save, loadDraft, clearDraft, hasDraft } = useAutoSave({
    key: autoSaveKey,
    data: formData,
  });

  // Restore draft on mount
  useEffect(() => {
    if (draftLoaded) return;
    setDraftLoaded(true);
    const draft = loadDraft();
    if (draft) {
      sonnerToast("Найден черновик", {
        description: "Восстановить несохранённые изменения?",
        action: {
          label: "Восстановить",
          onClick: () => {
            if (draft.title) setTitle(draft.title);
            if (draft.content) setContent(draft.content);
            if (draft.excerpt !== undefined) setExcerpt(draft.excerpt);
            if (draft.category) setCategory(draft.category);
            if (draft.ageGroup) setAgeGroup(draft.ageGroup);
            if (draft.isPublished !== undefined) setIsPublished(draft.isPublished);
            sonnerToast.success("Черновик восстановлен");
          },
        },
        cancel: {
          label: "Отклонить",
          onClick: () => clearDraft(),
        },
        duration: 10000,
      });
    }
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "Укажите название", variant: "destructive" });
      return;
    }
    setLoading(true);
    setUploadProgress(true);

    try {
      let imagePath = article?.image_path || null;

      // Upload cover image
      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `covers/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("research-attachments")
          .upload(path, coverFile);
        if (uploadError) throw uploadError;
        imagePath = path;
      }

      let articleId = article?.id;

      if (article) {
        const { error } = await supabase
          .from("research_articles")
          .update({
            title: title.trim(),
            content,
            excerpt: excerpt.trim() || null,
            category,
            age_group: ageGroup,
            image_path: imagePath,
            is_published: isPublished,
          } as any)
          .eq("id", article.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("research_articles")
          .insert({
            title: title.trim(),
            content,
            excerpt: excerpt.trim() || null,
            category,
            age_group: ageGroup,
            image_path: imagePath,
            is_published: isPublished,
          } as any)
          .select("id")
          .single();
        if (error) throw error;
        articleId = data.id;
      }

      // Upload attachments
      for (const file of attachmentFiles) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const fileType = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)
          ? "image"
          : ext === "pdf"
          ? "pdf"
          : "document";
        const path = `attachments/${articleId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("research-attachments")
          .upload(path, file);
        if (uploadError) throw uploadError;

        await supabase.from("research_article_attachments").insert({
          article_id: articleId!,
          file_path: path,
          file_name: file.name,
          file_type: fileType,
        });
      }

      toast({ title: article ? "Статья обновлена" : "Статья создана" });
      clearDraft();
      onSave();
    } catch (err: any) {
      toast({ title: "Ошибка сохранения", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setUploadProgress(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <Label>Название *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название исследования" />
      </div>

      <div className="space-y-2">
        <Label>Категория</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESEARCH_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Возрастная группа</Label>
        <Select value={ageGroup} onValueChange={setAgeGroup}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGE_GROUPS.map((ag) => (
              <SelectItem key={ag.value} value={ag.value}>{ag.emoji} {ag.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Краткая аннотация</Label>
        <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Краткое описание для превью..." className="min-h-[60px]" />
      </div>

      <div className="space-y-2">
        <Label>Обложка</Label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload className="w-4 h-4" />
            <span className="text-sm">{coverFile ? coverFile.name : "Выбрать изображение"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
          </label>
          {coverFile && (
            <Button variant="ghost" size="sm" onClick={() => setCoverFile(null)}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Текст статьи</Label>
        <RichTextEditor content={content} onChange={setContent} />
      </div>

      <div className="space-y-2">
        <Label>Вложения (изображения, PDF, документы)</Label>
        <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors w-fit">
          <Upload className="w-4 h-4" />
          <span className="text-sm">Добавить файлы</span>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                setAttachmentFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
              }
            }}
          />
        </label>
        {attachmentFiles.length > 0 && (
          <div className="space-y-1 mt-2">
            {attachmentFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-md">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 truncate">{f.name}</span>
                <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => removeAttachment(i)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
        <Label>Опубликовать</Label>
      </div>

      <div className="flex gap-3 items-center">
        <Button onClick={handleSubmit} disabled={loading}>
          {uploadProgress && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {article ? "Сохранить" : "Создать"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={loading}>Отмена</Button>
        <Button variant="ghost" size="sm" onClick={save} disabled={loading} className="ml-auto gap-1 text-muted-foreground">
          <Save className="w-4 h-4" /> Сохранить черновик
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Автосохранение каждые 3 минуты</p>
    </div>
  );
};

export default ResearchPostForm;
