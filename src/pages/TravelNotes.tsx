import { useState, useEffect } from "react";
import { ArrowLeft, Upload, Image, Trash2, Loader2, Shield, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface TravelPhoto {
  id: string;
  title: string;
  caption: string | null;
  image_path: string;
  sort_order: number;
  created_at: string;
}

const TravelNotes = () => {
  const [photos, setPhotos] = useState<TravelPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newPhoto, setNewPhoto] = useState({ title: "", caption: "", file: null as File | null });
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from("travel_photos")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить фотографии",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("travel-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleUpload = async () => {
    if (!newPhoto.file || !newPhoto.title) {
      toast({
        title: "Заполните поля",
        description: "Укажите название и выберите фото",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${newPhoto.file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      
      const { error: uploadError } = await supabase.storage
        .from("travel-photos")
        .upload(fileName, newPhoto.file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("travel_photos")
        .insert({
          title: newPhoto.title,
          caption: newPhoto.caption || null,
          image_path: fileName,
        });

      if (insertError) throw insertError;

      toast({
        title: "Успешно",
        description: "Фотография добавлена",
      });

      setNewPhoto({ title: "", caption: "", file: null });
      setUploadDialogOpen(false);
      fetchPhotos();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить фото",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo: TravelPhoto) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("travel-photos")
        .remove([photo.image_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("travel_photos")
        .delete()
        .eq("id", photo.id);

      if (dbError) throw dbError;

      toast({
        title: "Удалено",
        description: "Фотография удалена",
      });

      if (selectedIndex !== null) {
        setSelectedIndex(null);
      }
      fetchPhotos();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Ошибка удаления",
        description: error.message || "Не удалось удалить фото",
        variant: "destructive",
      });
    }
  };

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") setSelectedIndex(null);
  };

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
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Путёвые заметки</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            Фотографии из путешествий и личные заметки
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Admin Upload Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Image className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Галерея
              </h2>
            </div>
            
            {!authLoading && isAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Shield className="w-4 h-4 text-primary" />
                  Администратор
                </span>
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="w-4 h-4 mr-2" />
                      Добавить фото
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить фотографию</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="title">Название *</Label>
                        <Input
                          id="title"
                          value={newPhoto.title}
                          onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                          placeholder="Например: Закат в горах"
                        />
                      </div>
                      <div>
                        <Label htmlFor="caption">Подпись</Label>
                        <Textarea
                          id="caption"
                          value={newPhoto.caption}
                          onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                          placeholder="Описание фотографии..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="photo">Фотография *</Label>
                        <Input
                          id="photo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setNewPhoto({ ...newPhoto, file: e.target.files?.[0] || null })}
                        />
                      </div>
                      <Button 
                        onClick={handleUpload} 
                        disabled={uploading} 
                        className="w-full"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Загрузка...
                          </>
                        ) : (
                          "Добавить"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>

        {/* Photos Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20">
            <Image className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              Фотографии пока не добавлены
            </p>
            {isAdmin && (
              <p className="text-sm text-muted-foreground mt-2">
                Нажмите «Добавить фото» чтобы добавить первую фотографию
              </p>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <Card
                key={photo.id}
                className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedIndex(index)}
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={getPublicUrl(photo.image_path)}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(photo);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-foreground truncate">{photo.title}</h3>
                  {photo.caption && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {photo.caption}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {selectedIndex !== null && photos[selectedIndex] && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={() => setSelectedIndex(null)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="w-6 h-6" />
            </Button>

            {selectedIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            {selectedIndex < photos.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}

            <div
              className="max-w-5xl max-h-[90vh] flex flex-col items-center px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={getPublicUrl(photos[selectedIndex].image_path)}
                alt={photos[selectedIndex].title}
                className="max-h-[70vh] max-w-full object-contain"
              />
              <div className="text-center mt-4 text-white">
                <h3 className="text-xl font-semibold">{photos[selectedIndex].title}</h3>
                {photos[selectedIndex].caption && (
                  <p className="text-white/80 mt-2 max-w-2xl">
                    {photos[selectedIndex].caption}
                  </p>
                )}
                <p className="text-white/50 text-sm mt-2">
                  {selectedIndex + 1} / {photos.length}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TravelNotes;
