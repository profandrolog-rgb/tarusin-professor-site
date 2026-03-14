import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ArrowLeft, Play, Video, Trash2, Loader2, Shield, ThumbsUp, ThumbsDown, Plus, Link2, Pencil, X, ImagePlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import PageMeta from "@/components/PageMeta";
import AgeConfirmationModal from "@/components/AgeConfirmationModal";
import type { Database } from "@/integrations/supabase/types";

type CaseCategory = Database["public"]["Enums"]["case_category"];

const CATEGORY_LABELS: Record<CaseCategory, string> = {
  hydrocele: "Гидроцеле",
  cryptorchidism: "Крипторхизм",
  hypospadias: "Гипоспадия",
  varicocele: "Варикоцеле",
  phimosis: "Фимоз",
  hernia: "Грыжа",
  spermatocele: "Сперматоцеле",
  spermatic_cord_cyst: "Киста семенного канатика",
  short_frenulum: "Короткая уздечка",
  hydatids: "Гидатиды",
  penile_curvature: "Искривление полового члена",
  nevi: "Невусы",
  papillomas: "Папилломы",
  scars: "Рубцы",
  meatostenosis: "Меатостеноз",
  testicular_torsion: "Перекрут яичка",
  preputial_synechiae: "Синехии крайней плоти",
  paraphimosis: "Парафимоз",
  buried_penis: "Скрытый половой член",
  lymphocele: "Лимфоцеле",
  scrotal_atheroma: "Атерома мошонки",
  micro_tese: "Micro-TESE",
  orchiectomy: "Орхиэктомия",
  // legacy — hidden from UI
  enuresis: "Энурез",
  pelvic_pain: "Тазовая боль",
  scrotal_pain: "Боль в мошонке",
  infertility: "Бесплодие",
  erectile_dysfunction: "Эректильная дисфункция",
  sexology: "Сексология",
  psychology: "Психология",
  complications: "Осложнения",
  other: "Разное",
  rarities: "Редкое",
};

// Only these categories are shown in the UI selector & grouping
const VISIBLE_CATEGORIES: CaseCategory[] = [
  "hydrocele", "cryptorchidism", "hypospadias", "varicocele", "phimosis", "hernia",
  "spermatocele", "spermatic_cord_cyst", "short_frenulum", "hydatids", "penile_curvature",
  "nevi", "papillomas", "scars", "meatostenosis", "testicular_torsion",
  "preputial_synechiae", "paraphimosis", "buried_penis", "lymphocele", "scrotal_atheroma",
  "micro_tese", "orchiectomy", "rarities", "other",
];

interface VideoCase {
  id: string;
  title: string;
  description: string | null;
  video_path: string;
  thumbnail_path: string | null;
  category: CaseCategory;
  created_at: string;
  likes: number;
  dislikes: number;
  user_reaction: string | null;
}

const VideoCases = () => {
  const [cases, setCases] = useState<VideoCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoCase | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<VideoCase | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formVideoType, setFormVideoType] = useState<"url" | "embed">("url");
  const [formCategory, setFormCategory] = useState<CaseCategory>("other");
  const [formThumbnail, setFormThumbnail] = useState<File | null>(null);
  const [formThumbnailPreview, setFormThumbnailPreview] = useState<string | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases();
  }, [user]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    toast({ title: "Копирование запрещено", description: "Копирование категорически запрещено!", variant: "destructive" });
  }, [toast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        toast({ title: "Копирование запрещено", description: "Копирование категорически запрещено!", variant: "destructive" });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  const fetchCases = async () => {
    try {
      const { data: casesData, error } = await supabase
        .from("video_cases")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: reactions } = await supabase
        .from("video_case_reactions")
        .select("*");

      const enriched = (casesData || []).map((c) => {
        const caseReactions = (reactions || []).filter((r) => r.video_case_id === c.id);
        const likes = caseReactions.filter((r) => r.reaction_type === "like").length;
        const dislikes = caseReactions.filter((r) => r.reaction_type === "dislike").length;
        const userReaction = user ? caseReactions.find((r) => r.user_id === user.id)?.reaction_type || null : null;

        return {
          id: c.id,
          title: c.title,
          description: c.description,
          video_path: c.video_path,
          thumbnail_path: c.thumbnail_path || null,
          category: c.category as CaseCategory,
          created_at: c.created_at,
          likes,
          dislikes,
          user_reaction: userReaction,
        };
      });

      setCases(enriched);
    } catch (error) {
      console.error("Error fetching video cases:", error);
      toast({ title: "Ошибка", description: "Не удалось загрузить видео-кейсы", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormVideoUrl("");
    setFormVideoType("url");
    setFormCategory("other");
    setFormThumbnail(null);
    setFormThumbnailPreview(null);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormThumbnail(file);
      setFormThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const uploadThumbnail = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("video-cases").upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("video-cases").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleAdd = async () => {
    if (!formTitle.trim() || !formVideoUrl.trim()) {
      toast({ title: "Заполните поля", description: "Название и ссылка на видео обязательны", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let thumbnailUrl: string | null = null;
      if (formThumbnail) {
        thumbnailUrl = await uploadThumbnail(formThumbnail);
      }
      const { error } = await supabase.from("video_cases").insert({
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        video_path: formVideoUrl.trim(),
        category: formCategory,
        thumbnail_path: thumbnailUrl,
      });
      if (error) throw error;

      toast({ title: "Успешно", description: "Видео-кейс добавлен" });
      resetForm();
      setAddDialogOpen(false);
      fetchCases();
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message || "Не удалось добавить", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (c: VideoCase) => {
    setEditingCase(c);
    setFormTitle(c.title);
    setFormDescription(c.description || "");
    setFormVideoUrl(c.video_path);
    setFormVideoType(c.video_path.trim().startsWith("<iframe") || c.video_path.trim().startsWith("<embed") ? "embed" : "url");
    setFormCategory(c.category);
    setFormThumbnail(null);
    setFormThumbnailPreview(c.thumbnail_path || null);
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editingCase || !formTitle.trim() || !formVideoUrl.trim()) {
      toast({ title: "Заполните поля", description: "Название и ссылка обязательны", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let thumbnailUrl: string | null | undefined = undefined;
      if (formThumbnail) {
        thumbnailUrl = await uploadThumbnail(formThumbnail);
      }
      const updateData: any = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        video_path: formVideoUrl.trim(),
        category: formCategory,
      };
      if (thumbnailUrl !== undefined) {
        updateData.thumbnail_path = thumbnailUrl;
      }
      const { error } = await supabase.from("video_cases").update(updateData).eq("id", editingCase.id);
      if (error) throw error;

      toast({ title: "Сохранено", description: "Видео-кейс обновлён" });
      resetForm();
      setEditDialogOpen(false);
      setEditingCase(null);
      if (selectedVideo?.id === editingCase.id) setSelectedVideo(null);
      fetchCases();
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("video_cases").delete().eq("id", id);
      if (error) throw error;

      if (selectedVideo?.id === id) setSelectedVideo(null);
      toast({ title: "Удалено", description: "Видео-кейс удалён" });
      fetchCases();
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  };

  const handleReaction = async (caseId: string, type: "like" | "dislike") => {
    if (!user) {
      navigate("/auth", { state: { from: "/video-cases" } });
      return;
    }

    try {
      const existing = cases.find((c) => c.id === caseId);
      if (!existing) return;

      if (existing.user_reaction === type) {
        await supabase.from("video_case_reactions").delete().eq("video_case_id", caseId).eq("user_id", user.id);
      } else if (existing.user_reaction) {
        await supabase.from("video_case_reactions").update({ reaction_type: type }).eq("video_case_id", caseId).eq("user_id", user.id);
      } else {
        await supabase.from("video_case_reactions").insert({ video_case_id: caseId, user_id: user.id, reaction_type: type });
      }
      fetchCases();
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  };

  const isEmbedCode = (path: string) => {
    return path.trim().startsWith("<iframe") || path.trim().startsWith("<embed");
  };

  const getVideoType = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.endsWith(".mov")) return "video/quicktime";
    if (lower.endsWith(".webm")) return "video/webm";
    return "video/mp4";
  };

  const extractEmbedSrc = (embed: string) => {
    const match = embed.match(/src=["']([^"']+)["']/);
    return match ? match[1] : "";
  };

  // Group cases by category
  const groupedCases = useMemo(() => {
    const groups: { category: CaseCategory; label: string; items: VideoCase[] }[] = [];
    for (const cat of VISIBLE_CATEGORIES) {
      const items = cases.filter((c) => c.category === cat);
      if (items.length > 0) {
        groups.push({ category: cat, label: CATEGORY_LABELS[cat], items });
      }
    }
    return groups;
  }, [cases]);

  const CategorySelect = ({ value, onChange }: { value: CaseCategory; onChange: (v: CaseCategory) => void }) => (
    <Select value={value} onValueChange={(v) => onChange(v as CaseCategory)}>
      <SelectTrigger>
        <SelectValue placeholder="Категория" />
      </SelectTrigger>
      <SelectContent>
        {VISIBLE_CATEGORIES.map((cat) => (
          <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <AgeConfirmationModal>
    <div className="min-h-screen bg-background select-none" onContextMenu={handleContextMenu} onCopy={(e) => e.preventDefault()}>
      <PageMeta title="Видео-кейсы — Проф. Тарусин Д.И." description="Короткие видео из операционной, заметки и разборы клинических случаев профессора Тарусина Д.И." path="/video-cases" />
      <header className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Видео-кейсы</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            Короткие видео из операционной, заметки и разборы клинических случаев
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Admin controls */}
        <div className="mb-12 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Все кейсы</h2>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Shield className="w-4 h-4 text-primary" />
                Администратор
              </span>
              <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" />Добавить кейс</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>Новый видео-кейс</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="Название" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
                    <Textarea placeholder="Описание (необязательно)" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} />
                    <CategorySelect value={formCategory} onChange={setFormCategory} />
                    <div className="flex gap-2">
                      <Button type="button" variant={formVideoType === "url" ? "default" : "outline"} size="sm" onClick={() => setFormVideoType("url")}>Ссылка (URL)</Button>
                      <Button type="button" variant={formVideoType === "embed" ? "default" : "outline"} size="sm" onClick={() => setFormVideoType("embed")}>Embed-код</Button>
                    </div>
                    {formVideoType === "url" ? (
                      <Input placeholder="Ссылка на видео (URL)" value={formVideoUrl} onChange={(e) => setFormVideoUrl(e.target.value)} />
                    ) : (
                      <Textarea placeholder='Вставьте embed-код (например <iframe src="..."></iframe>)' value={formVideoUrl} onChange={(e) => setFormVideoUrl(e.target.value)} rows={4} />
                    )}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Обложка (превью)</label>
                      <input type="file" accept="image/*" ref={thumbnailInputRef} className="hidden" onChange={handleThumbnailChange} />
                      {formThumbnailPreview ? (
                        <div className="relative w-32 h-24 rounded overflow-hidden border">
                          <img src={formThumbnailPreview} alt="Превью" className="w-full h-full object-cover" />
                          <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 bg-black/50 text-white h-6 w-6" onClick={() => { setFormThumbnail(null); setFormThumbnailPreview(null); }}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button type="button" variant="outline" size="sm" onClick={() => thumbnailInputRef.current?.click()}>
                          <ImagePlus className="w-4 h-4 mr-2" />Загрузить обложку
                        </Button>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAdd} disabled={saving} className="w-full">
                      {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Сохранение...</> : <><Link2 className="w-4 h-4 mr-2" />Добавить</>}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { resetForm(); setEditingCase(null); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Редактировать видео-кейс</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Название" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
              <Textarea placeholder="Описание (необязательно)" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} />
              <CategorySelect value={formCategory} onChange={setFormCategory} />
              <div className="flex gap-2">
                <Button type="button" variant={formVideoType === "url" ? "default" : "outline"} size="sm" onClick={() => setFormVideoType("url")}>Ссылка (URL)</Button>
                <Button type="button" variant={formVideoType === "embed" ? "default" : "outline"} size="sm" onClick={() => setFormVideoType("embed")}>Embed-код</Button>
              </div>
              {formVideoType === "url" ? (
                <Input placeholder="Ссылка на видео (URL)" value={formVideoUrl} onChange={(e) => setFormVideoUrl(e.target.value)} />
              ) : (
                <Textarea placeholder='Вставьте embed-код (например <iframe src="..."></iframe>)' value={formVideoUrl} onChange={(e) => setFormVideoUrl(e.target.value)} rows={4} />
              )}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Обложка (превью)</label>
                <input type="file" accept="image/*" className="hidden" id="edit-thumbnail" onChange={handleThumbnailChange} />
                {formThumbnailPreview ? (
                  <div className="relative w-32 h-24 rounded overflow-hidden border">
                    <img src={formThumbnailPreview} alt="Превью" className="w-full h-full object-cover" />
                    <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 bg-black/50 text-white h-6 w-6" onClick={() => { setFormThumbnail(null); setFormThumbnailPreview(null); }}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("edit-thumbnail")?.click()}>
                    <ImagePlus className="w-4 h-4 mr-2" />Загрузить обложку
                  </Button>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleEdit} disabled={saving} className="w-full">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Сохранение...</> : "Сохранить изменения"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Selected Video Player */}
        {selectedVideo && (
          <div className="mb-12" onContextMenu={handleContextMenu}>
            <Card className="overflow-hidden">
              <CardContent className="p-0 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => setSelectedVideo(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
                {isEmbedCode(selectedVideo.video_path) ? (
                  <iframe
                    key={selectedVideo.id}
                    src={extractEmbedSrc(selectedVideo.video_path)}
                    className="w-full aspect-[9/16] max-h-[80vh] bg-black mx-auto"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                    frameBorder="0"
                  />
                ) : (
                  <video
                    key={selectedVideo.id}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    controlsList="nodownload nofullscreen noremoteplayback"
                    disablePictureInPicture
                    disableRemotePlayback
                    onContextMenu={handleContextMenu}
                    onDragStart={(e) => e.preventDefault()}
                    className="w-full max-h-[80vh] bg-black mx-auto"
                  >
                    <source src={selectedVideo.video_path} type={getVideoType(selectedVideo.video_path)} />
                    <source src={selectedVideo.video_path} type="video/mp4" />
                    Ваш браузер не поддерживает воспроизведение этого видео.
                  </video>
                )}
              </CardContent>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {CATEGORY_LABELS[selectedVideo.category]}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{selectedVideo.title}</h3>
                {selectedVideo.description && <p className="text-muted-foreground mb-4">{selectedVideo.description}</p>}
                <ReactionButtons caseItem={selectedVideo} onReaction={handleReaction} />
              </div>
            </Card>
          </div>
        )}

        {/* Grouped sections */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20">
            <Video className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Видео-кейсы пока не добавлены</p>
          </div>
        ) : (
          <div className="space-y-16">
            {groupedCases.map(({ category, label, items }) => (
              <section key={category}>
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                  {label}
                  <span className="text-sm font-normal text-muted-foreground ml-2">({items.length})</span>
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((c) => (
                    <VideoCaseCard
                      key={c.id}
                      c={c}
                      isAdmin={isAdmin}
                      onSelect={setSelectedVideo}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                      onReaction={handleReaction}
                      onContextMenu={handleContextMenu}
                      isEmbedCode={isEmbedCode}
                      getVideoType={getVideoType}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
    </AgeConfirmationModal>
  );
};

// Extracted card component
function VideoCaseCard({
  c, isAdmin, onSelect, onEdit, onDelete, onReaction, onContextMenu, isEmbedCode, getVideoType,
}: {
  c: VideoCase;
  isAdmin: boolean;
  onSelect: (v: VideoCase) => void;
  onEdit: (v: VideoCase) => void;
  onDelete: (id: string) => void;
  onReaction: (id: string, type: "like" | "dislike") => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isEmbedCode: (p: string) => boolean;
  getVideoType: (u: string) => string;
}) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow" onContextMenu={onContextMenu}>
      <div
        className="aspect-[3/4] bg-black relative cursor-pointer overflow-hidden"
        onClick={() => onSelect(c)}
      >
        {c.thumbnail_path ? (
          <img
            src={c.thumbnail_path}
            alt={c.title}
            className="absolute inset-0 w-full h-full object-cover"
            onContextMenu={onContextMenu}
            onDragStart={(e) => e.preventDefault()}
          />
        ) : isEmbedCode(c.video_path) ? (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-12 h-12 text-muted-foreground" />
          </div>
        ) : (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            preload="metadata"
            playsInline
            muted
            controlsList="nodownload"
            disablePictureInPicture
            disableRemotePlayback
            onContextMenu={onContextMenu}
            onDragStart={(e) => e.preventDefault()}
          >
            <source src={c.video_path + "#t=0.1"} type={getVideoType(c.video_path)} />
            <source src={c.video_path + "#t=0.1"} type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
          <div className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center shadow-lg">
            <Play className="w-8 h-8 text-accent-foreground ml-1" />
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{c.title}</h3>
        {c.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{c.description}</p>}
        <div className="flex items-center justify-between">
          <ReactionButtons caseItem={c} onReaction={onReaction} compact />
          {isAdmin && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary"
                onClick={(e) => { e.stopPropagation(); onEdit(c); }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить видео-кейс?</AlertDialogTitle>
                    <AlertDialogDescription>
                      «{c.title}» будет удалён без возможности восстановления.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Удалить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ReactionButtons({ caseItem, onReaction, compact }: { caseItem: VideoCase; onReaction: (id: string, type: "like" | "dislike") => void; compact?: boolean }) {
  const size = compact ? "sm" : "default";
  const iconSize = compact ? "w-4 h-4" : "w-5 h-5";

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={caseItem.user_reaction === "like" ? "default" : "outline"}
        size={size}
        onClick={(e) => { e.stopPropagation(); onReaction(caseItem.id, "like"); }}
        className="gap-1"
      >
        <ThumbsUp className={iconSize} />
        <span>{caseItem.likes}</span>
      </Button>
      <Button
        variant={caseItem.user_reaction === "dislike" ? "destructive" : "outline"}
        size={size}
        onClick={(e) => { e.stopPropagation(); onReaction(caseItem.id, "dislike"); }}
        className="gap-1"
      >
        <ThumbsDown className={iconSize} />
        <span>{caseItem.dislikes}</span>
      </Button>
    </div>
  );
}

export default VideoCases;
