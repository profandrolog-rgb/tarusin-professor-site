import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Upload, Play, Video, Trash2, Loader2, Shield, ThumbsUp, ThumbsDown, LogIn, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface VideoCase {
  id: string;
  title: string;
  description: string | null;
  video_path: string;
  created_at: string;
  likes: number;
  dislikes: number;
  user_reaction: string | null;
}

const VideoCases = () => {
  const [cases, setCases] = useState<VideoCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoCase | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
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
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
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

        const { data: urlData } = supabase.storage.from("video-cases").getPublicUrl(c.video_path);

        return {
          id: c.id,
          title: c.title,
          description: c.description,
          video_path: urlData.publicUrl,
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

  const handleUpload = async () => {
    if (!newTitle.trim() || !newFile) {
      toast({ title: "Заполните поля", description: "Название и видео обязательны", variant: "destructive" });
      return;
    }

    if (!newFile.type.startsWith("video/")) {
      toast({ title: "Неверный формат", description: "Загрузите видеофайл", variant: "destructive" });
      return;
    }

    if (newFile.size > 100 * 1024 * 1024) {
      toast({ title: "Файл слишком большой", description: "Максимум 100 МБ", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${newFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from("video-cases").upload(fileName, newFile);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("video_cases").insert({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        video_path: fileName,
      });
      if (insertError) throw insertError;

      toast({ title: "Успешно", description: "Видео-кейс добавлен" });
      setNewTitle("");
      setNewDescription("");
      setNewFile(null);
      setDialogOpen(false);
      fetchCases();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Ошибка", description: error.message || "Не удалось загрузить", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, videoPath: string) => {
    try {
      // Extract filename from public URL
      const parts = videoPath.split("/");
      const fileName = parts[parts.length - 1];

      await supabase.storage.from("video-cases").remove([fileName]);
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
        // Remove reaction
        await supabase
          .from("video_case_reactions")
          .delete()
          .eq("video_case_id", caseId)
          .eq("user_id", user.id);
      } else if (existing.user_reaction) {
        // Change reaction
        await supabase
          .from("video_case_reactions")
          .update({ reaction_type: type })
          .eq("video_case_id", caseId)
          .eq("user_id", user.id);
      } else {
        // New reaction
        await supabase.from("video_case_reactions").insert({
          video_case_id: caseId,
          user_id: user.id,
          reaction_type: type,
        });
      }
      fetchCases();
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background select-none" onContextMenu={handleContextMenu} onCopy={(e) => e.preventDefault()}>
      {/* Header */}
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
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить кейс
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Новый видео-кейс</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="Название" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                    <Textarea placeholder="Описание (необязательно)" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} />
                    <Input type="file" accept="video/*" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
                    <Button onClick={handleUpload} disabled={uploading} className="w-full">
                      {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Загрузка...</> : <><Upload className="w-4 h-4 mr-2" />Загрузить</>}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Selected Video */}
        {selectedVideo && (
          <div className="mb-12" onContextMenu={handleContextMenu}>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <video
                  src={selectedVideo.video_path}
                  controls
                  autoPlay
                  controlsList="nodownload"
                  onContextMenu={handleContextMenu}
                  className="w-full max-h-[80vh] bg-black mx-auto"
                />
              </CardContent>
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{selectedVideo.title}</h3>
                {selectedVideo.description && <p className="text-muted-foreground mb-4">{selectedVideo.description}</p>}
                <ReactionButtons
                  caseItem={selectedVideo}
                  onReaction={handleReaction}
                />
              </div>
            </Card>
          </div>
        )}

        {/* Grid */}
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((c) => (
              <Card key={c.id} className="group overflow-hidden hover:shadow-lg transition-shadow" onContextMenu={handleContextMenu}>
                <div
                  className="aspect-[9/16] max-h-80 bg-muted relative cursor-pointer overflow-hidden"
                  onClick={() => setSelectedVideo(c)}
                >
                  <video
                    src={c.video_path}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    onContextMenu={handleContextMenu}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                      <Play className="w-8 h-8 text-accent-foreground" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{c.title}</h3>
                  {c.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center justify-between">
                    <ReactionButtons caseItem={c} onReaction={handleReaction} compact />
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.video_path); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

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
