import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Upload, Play, Video, Trash2, Loader2, LogIn, Shield, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface VideoFile {
  name: string;
  url: string;
  created_at: string;
}

const Videos = () => {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      fetchVideos();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  // Prevent right-click and copy attempts
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      title: "Копирование запрещено",
      description: "Копирование категорически запрещено!",
      variant: "destructive",
    });
    return false;
  }, [toast]);

  // Prevent keyboard shortcuts for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+S, Ctrl+Shift+S
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        toast({
          title: "Копирование запрещено",
          description: "Копирование категорически запрещено!",
          variant: "destructive",
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("videos")
        .list("", { sortBy: { column: "created_at", order: "desc" } });

      if (error) throw error;

      const filteredFiles = (data || []).filter(
        (file) => file.name !== ".emptyFolderPlaceholder"
      );

      // Generate signed URLs for private bucket (valid for 1 hour)
      const videoFilesWithUrls = await Promise.all(
        filteredFiles.map(async (file) => {
          const { data: signedUrlData } = await supabase.storage
            .from("videos")
            .createSignedUrl(file.name, 3600); // 1 hour expiry

          return {
            name: file.name,
            url: signedUrlData?.signedUrl || "",
            created_at: file.created_at || "",
          };
        })
      );

      setVideos(videoFilesWithUrls.filter((v) => v.url));
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список видео",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({
        title: "Неверный формат",
        description: "Пожалуйста, загрузите видеофайл (MP4, WebM, и т.д.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "Файл слишком большой",
        description: "Максимальный размер видео — 100 МБ",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      
      const { error } = await supabase.storage
        .from("videos")
        .upload(fileName, file);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Видео загружено",
      });

      fetchVideos();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить видео",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from("videos")
        .remove([fileName]);

      if (error) throw error;

      toast({
        title: "Удалено",
        description: "Видео удалено",
      });

      if (selectedVideo === videos.find(v => v.name === fileName)?.url) {
        setSelectedVideo(null);
      }
      
      fetchVideos();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Ошибка удаления",
        description: error.message || "Не удалось удалить видео",
        variant: "destructive",
      });
    }
  };

  const handleLoginRedirect = () => {
    navigate("/auth", { state: { from: "/videos" } });
  };

  // Show login required message for unauthenticated users
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-primary text-primary-foreground py-12 md:py-20">
          <div className="container mx-auto px-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              На главную
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Видео</h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
              Обучающие видео и записи лекций
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-lg mx-auto text-center">
            <Card className="p-8">
              <CardContent className="pt-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Для просмотра видео необходима авторизация
                </h2>
                <p className="text-muted-foreground mb-6">
                  Пожалуйста, войдите в систему или зарегистрируйтесь, чтобы получить доступ к обучающим видео и записям лекций.
                </p>
                <Button onClick={handleLoginRedirect} size="lg" className="w-full">
                  <LogIn className="w-5 h-5 mr-2" />
                  Войти или зарегистрироваться
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background"
      onContextMenu={handleContextMenu}
    >
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Видео</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            Обучающие видео и записи лекций
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Upload Section - Only for admins */}
        <div className="mb-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Все видео
              </h2>
            </div>
            
            {authLoading ? (
              <Button disabled>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Загрузка...
              </Button>
            ) : isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Shield className="w-4 h-4 text-primary" />
                  Администратор
                </span>
                <div className="relative">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <Button disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Загрузить видео
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Selected Video Player */}
        {selectedVideo && (
          <div className="mb-12" onContextMenu={handleContextMenu}>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <video
                  src={selectedVideo}
                  controls
                  autoPlay
                  controlsList="nodownload"
                  onContextMenu={handleContextMenu}
                  className="w-full aspect-video bg-black"
                  style={{ pointerEvents: "auto" }}
                >
                  Ваш браузер не поддерживает видео.
                </video>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Videos Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20">
            <Video className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              Видео пока не загружены
            </p>
            {isAdmin && (
              <p className="text-sm text-muted-foreground mt-2">
                Нажмите «Загрузить видео» чтобы добавить первое видео
              </p>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card
                key={video.name}
                className="group overflow-hidden hover:shadow-lg transition-shadow"
                onContextMenu={handleContextMenu}
              >
                <div
                  className="aspect-video bg-muted relative cursor-pointer"
                  onClick={() => setSelectedVideo(video.url)}
                >
                  <video
                    src={video.url}
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
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground truncate flex-1">
                      {video.name.replace(/^\d+-/, "").replace(/_/g, " ")}
                    </p>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(video.name);
                        }}
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

export default Videos;
