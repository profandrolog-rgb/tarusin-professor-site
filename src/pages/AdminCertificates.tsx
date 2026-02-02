import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Upload, X, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Certificate = {
  id: string;
  title: string;
  image_path: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
};

const AdminCertificates = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Certificate[];
    },
  });

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("certificates")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    return fileName;
  };

  const deleteImage = async (imagePath: string) => {
    await supabase.storage.from("certificates").remove([imagePath]);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!imageFile) throw new Error("Выберите изображение");

      setIsUploading(true);
      const imagePath = await uploadImage(imageFile);

      const maxSortOrder = certificates.length > 0
        ? Math.max(...certificates.map((c) => c.sort_order || 0))
        : 0;

      const { error } = await supabase.from("certificates").insert({
        title,
        image_path: imagePath,
        is_published: isPublished,
        sort_order: maxSortOrder + 1,
      });

      if (error) {
        await deleteImage(imagePath);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast.success("Сертификат добавлен");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingCertificate) return;

      setIsUploading(true);
      let imagePath = editingCertificate.image_path;

      if (imageFile) {
        await deleteImage(editingCertificate.image_path);
        imagePath = await uploadImage(imageFile);
      }

      const { error } = await supabase
        .from("certificates")
        .update({
          title,
          image_path: imagePath,
          is_published: isPublished,
        })
        .eq("id", editingCertificate.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast.success("Сертификат обновлён");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (certificate: Certificate) => {
      await deleteImage(certificate.image_path);
      const { error } = await supabase
        .from("certificates")
        .delete()
        .eq("id", certificate.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast.success("Сертификат удалён");
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({
      certificate,
      direction,
    }: {
      certificate: Certificate;
      direction: "up" | "down";
    }) => {
      const currentIndex = certificates.findIndex((c) => c.id === certificate.id);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= certificates.length) return;

      const targetCertificate = certificates[targetIndex];

      await supabase
        .from("certificates")
        .update({ sort_order: targetCertificate.sort_order })
        .eq("id", certificate.id);

      await supabase
        .from("certificates")
        .update({ sort_order: certificate.sort_order })
        .eq("id", targetCertificate.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
    },
  });

  const resetForm = () => {
    setTitle("");
    setImageFile(null);
    setImagePreview(null);
    setIsPublished(true);
    setEditingCertificate(null);
  };

  const openEditDialog = (certificate: Certificate) => {
    setEditingCertificate(certificate);
    setTitle(certificate.title);
    setIsPublished(certificate.is_published);
    setImagePreview(getImageUrl(certificate.image_path));
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getImageUrl = (imagePath: string) => {
    const { data } = supabase.storage.from("certificates").getPublicUrl(imagePath);
    return data.publicUrl;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCertificate) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Сертификаты и дипломы</h1>
            <p className="text-muted-foreground">Управление галереей сертификатов</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="mb-6">
              <Plus className="h-4 w-4 mr-2" />
              Добавить сертификат
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCertificate ? "Редактировать сертификат" : "Добавить сертификат"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Название</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Диплом врача"
                  required
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">{title.length}/100</p>
              </div>

              <div>
                <Label>Изображение</Label>
                {imagePreview ? (
                  <div className="relative mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-40 object-contain rounded-lg border bg-muted"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors mt-2">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Нажмите для загрузки</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="published">Опубликован</Label>
                <Switch
                  id="published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isUploading}>
                {isUploading ? "Загрузка..." : editingCertificate ? "Сохранить" : "Добавить"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {certificates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Нет добавленных сертификатов</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((certificate, index) => (
              <Card
                key={certificate.id}
                className={`overflow-hidden ${!certificate.is_published ? "opacity-60" : ""}`}
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                  <img
                    src={getImageUrl(certificate.image_path)}
                    alt={certificate.title}
                    className="w-full h-full object-contain"
                  />
                  {!certificate.is_published && (
                    <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
                      Скрыт
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground mb-3 truncate">{certificate.title}</h3>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveMutation.mutate({ certificate, direction: "up" })}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveMutation.mutate({ certificate, direction: "down" })}
                        disabled={index === certificates.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(certificate)}
                      >
                        Изменить
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (confirm("Удалить сертификат?")) {
                            deleteMutation.mutate(certificate);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCertificates;
