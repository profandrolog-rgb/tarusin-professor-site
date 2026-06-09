import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Video, Headphones, FileText, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ArticleMarkdownEditor, { type ArticleMarkdownEditorHandle } from "@/components/parents/ArticleMarkdownEditor";
import { mergePersistedGalleryFiles } from "@/lib/markdown/galleryMarkers";

const categoryLabels: Record<string, string> = {
  general: "Общее",
  urology: "Урология",
  andrology: "Андрология",
  surgery: "Хирургия",
  endocrinology: "Эндокринология",
  psychology: "Психология",
  sexology: "Сексология",
  genetics: "Генетика",
};

const emptyForm = {
  title: "",
  slug: "",
  age_group: "children" as "children" | "adults",
  category: "general",
  keywords: "",
  description: "",
  article_content: "",
  is_published: false,
};

const AdminDiseaseArticles = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>("all");
  const articleEditorRef = useRef<ArticleMarkdownEditorHandle>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/disease-articles" } });
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchArticles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("disease_articles")
      .select("*")
      .order("sort_order", { ascending: true });
    setArticles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user && isAdmin) fetchArticles();
  }, [user, isAdmin]);

  const generateSlug = (title: string) =>
    title.toLowerCase()
      .replace(/[а-яё]/g, (c) => {
        const map: Record<string, string> = {а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
        return map[c] || c;
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setVideoFile(null);
    setAudioFile(null);
    setDialogOpen(true);
  };

  const openEdit = (article: any) => {
    setEditing(article);
    setForm({
      title: article.title,
      slug: article.slug,
      age_group: article.age_group,
      category: article.category,
      keywords: (article.keywords || []).join(", "),
      description: article.description || "",
      article_content: article.article_content || "",
      is_published: article.is_published,
    });
    setVideoFile(null);
    setAudioFile(null);
    setDialogOpen(true);
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("disease-media").upload(path, file);
    if (error) throw error;
    return path;
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Введите название", variant: "destructive" });
      return;
    }

    setSaving(true);
    setUploading(true);

    try {
      let video_path = editing?.video_path || null;
      let audio_path = editing?.audio_path || null;

      if (videoFile) {
        video_path = await uploadFile(videoFile, "videos");
      }
      if (audioFile) {
        audio_path = await uploadFile(audioFile, "audio");
      }

      const slug = form.slug.trim() || generateSlug(form.title);
      const keywords = form.keywords.split(",").map(k => k.trim()).filter(Boolean);

      let syncedArticleContent = articleEditorRef.current?.getMarkdown() ?? form.article_content;
      if (editing?.id) {
        const { data: freshArticle, error: freshError } = await supabase
          .from("disease_articles")
          .select("article_content")
          .eq("id", editing.id)
          .maybeSingle();
        if (freshError) throw freshError;
        syncedArticleContent = mergePersistedGalleryFiles(
          syncedArticleContent,
          (freshArticle as any)?.article_content || "",
        );
      }

      const payload = {
        title: form.title,
        slug,
        age_group: form.age_group,
        category: form.category,
        keywords,
        description: form.description || null,
        article_content: syncedArticleContent || null,
        video_path,
        audio_path,
        is_published: form.is_published,
      };

      if (editing) {
        const { error } = await supabase
          .from("disease_articles")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Статья обновлена" });
      } else {
        const { error } = await supabase
          .from("disease_articles")
          .insert(payload);
        if (error) throw error;
        toast({ title: "Статья создана" });
      }

      setDialogOpen(false);
      fetchArticles();
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("disease_articles").delete().eq("id", id);
    if (error) {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    } else {
      toast({ title: "Статья удалена" });
      fetchArticles();
    }
  };

  const togglePublish = async (article: any) => {
    const { error } = await supabase
      .from("disease_articles")
      .update({ is_published: !article.is_published })
      .eq("id", article.id);
    if (!error) fetchArticles();
  };

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = filterAgeGroup === "all"
    ? articles
    : articles.filter(a => a.age_group === filterAgeGroup);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Панель управления
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Материалы о заболеваниях</h1>
            <p className="text-muted-foreground">Управление контентом для раздела «Для родителей и пациентов»</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Добавить материал
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          <Badge variant={filterAgeGroup === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterAgeGroup("all")}>Все</Badge>
          <Badge variant={filterAgeGroup === "children" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterAgeGroup("children")}>Детские</Badge>
          <Badge variant={filterAgeGroup === "adults" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterAgeGroup("adults")}>Взрослые</Badge>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Нет материалов. Нажмите «Добавить материал».</div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((article) => (
              <Card key={article.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex gap-1.5">
                      {article.video_path && <Video className="w-4 h-4 text-blue-500" />}
                      {article.audio_path && <Headphones className="w-4 h-4 text-purple-500" />}
                      {article.article_content && <FileText className="w-4 h-4 text-green-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">{article.title}</span>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {article.age_group === "children" ? "Детские" : "Взрослые"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {categoryLabels[article.category] || article.category}
                        </Badge>
                        {!article.is_published && (
                          <Badge variant="outline" className="text-xs text-orange-500 border-orange-300 flex-shrink-0">Черновик</Badge>
                        )}
                      </div>
                      {article.description && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">{article.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => togglePublish(article)} title={article.is_published ? "Снять с публикации" : "Опубликовать"}>
                      {article.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(article)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить «{article.title}»?</AlertDialogTitle>
                          <AlertDialogDescription>Это действие нельзя отменить. Все связанные файлы также будут удалены.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(article.id)} className="bg-destructive text-destructive-foreground">Удалить</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0 flex flex-row items-center justify-between gap-4 space-y-0">
              <DialogTitle className="flex-1">{editing ? "Редактирование материала" : "Новый материал о заболевании"}</DialogTitle>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Отмена</Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {uploading && saving ? "Загрузка..." : editing ? "Сохранить" : "Создать"}
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-6 overflow-y-auto px-6 py-6">
              {/* Basic info */}
              <div className="grid gap-4">
                <div>
                  <Label>Название заболевания *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => {
                      setForm({ ...form, title: e.target.value, slug: form.slug || generateSlug(e.target.value) });
                    }}
                    placeholder="Например: Варикоцеле"
                  />
                </div>

                <div>
                  <Label>URL-адрес (slug) *</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="varikotsele"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Адрес страницы: /for-parents/<span className="font-mono">{form.slug || "..."}</span>. Автогенерируется из названия, можно отредактировать.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-7 px-2 text-xs"
                    onClick={() => setForm({ ...form, slug: generateSlug(form.title) })}
                  >
                    Сгенерировать заново из названия
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Возрастная группа</Label>
                    <Select value={form.age_group} onValueChange={(v) => setForm({ ...form, age_group: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="children">О детских болезнях</SelectItem>
                        <SelectItem value="adults">О взрослых болезнях</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Категория</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Краткое описание</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Краткое описание для карточки"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Ключевые слова (через запятую)</Label>
                  <Input
                    value={form.keywords}
                    onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                    placeholder="варикоцеле, яичко, боль, подросток"
                  />
                </div>
              </div>

              {/* Content tabs */}
              <Tabs defaultValue="video">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="video" className="gap-1.5">
                    <Video className="w-3.5 h-3.5" /> Видео
                  </TabsTrigger>
                  <TabsTrigger value="audio" className="gap-1.5">
                    <Headphones className="w-3.5 h-3.5" /> Подкаст
                  </TabsTrigger>
                  <TabsTrigger value="text" className="gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Статья
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="video" className="space-y-3 mt-4">
                  <div>
                    <Label>Видеоролик о заболевании</Label>
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="mt-1"
                    />
                    {editing?.video_path && !videoFile && (
                      <p className="text-xs text-green-600 mt-1">✓ Видео загружено: {editing.video_path.split('/').pop()}</p>
                    )}
                    {videoFile && (
                      <p className="text-xs text-blue-600 mt-1">Выбрано: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} МБ)</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="audio" className="space-y-3 mt-4">
                  <div>
                    <Label>Аудиоподкаст (MP3)</Label>
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      className="mt-1"
                    />
                    {editing?.audio_path && !audioFile && (
                      <p className="text-xs text-green-600 mt-1">✓ Аудио загружено: {editing.audio_path.split('/').pop()}</p>
                    )}
                    {audioFile && (
                      <p className="text-xs text-blue-600 mt-1">Выбрано: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(1)} МБ)</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-3 mt-4">
                  <div>
                    <Label>Текст статьи (markdown)</Label>
                    <ArticleMarkdownEditor
                      ref={articleEditorRef}
                      value={form.article_content}
                      onChange={(v) => setForm((prev) => ({ ...prev, article_content: v }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Загрузите .docx, отформатируйте AI, добавьте маркеры галерей. Фото можно вставить позже на странице статьи.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Publish toggle */}
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Статус:</Label>
                  <Badge
                    variant={form.is_published ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setForm({ ...form, is_published: !form.is_published })}
                  >
                    {form.is_published ? "Опубликовано" : "Черновик"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {uploading && saving ? "Загрузка файлов..." : editing ? "Сохранить" : "Создать"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDiseaseArticles;
