import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, MessageSquare, Send, Check, X, Loader2, Upload } from "lucide-react";
import RichTextEditor from "@/components/blog/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  image_path: string | null;
  is_published: boolean;
  created_at: string;
}

interface BlogPostImage {
  id: string;
  post_id: string;
  image_path: string;
  sort_order: number | null;
  created_at: string;
}

interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  author_email: string;
  content: string;
  is_approved: boolean;
  created_at: string;
}

const IMAGE_HEIGHT_PX = 220; // approximate height per image in the column
const LINE_HEIGHT_PX = 24; // approximate line height for text

function estimateImageSlots(text: string): number {
  // Rough estimate: ~80 chars per line, each image takes ~IMAGE_HEIGHT_PX
  const lines = Math.max(1, Math.ceil(text.length / 80));
  const textHeight = lines * LINE_HEIGHT_PX;
  const slots = Math.max(1, Math.floor(textHeight / IMAGE_HEIGHT_PX));
  return slots;
}

const Blog = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", content: "" });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const { data: allPostImages = [] } = useQuery({
    queryKey: ["blog-post-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_post_images")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as BlogPostImage[];
    },
  });

  const { data: allComments = [] } = useQuery({
    queryKey: ["blog-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_comments")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as BlogComment[];
    },
  });

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(fileName, file);
    if (error) throw error;
    return fileName;
  };

  const savePost = async () => {
    setSavingPost(true);
    try {
      // Keep legacy image_path for backward compat
      let imagePath = editingPost?.image_path || null;

      let postId: string;
      if (editingPost) {
        const { error } = await supabase
          .from("blog_posts")
          .update({ title: postForm.title, content: postForm.content, image_path: imagePath })
          .eq("id", editingPost.id);
        if (error) throw error;
        postId = editingPost.id;
      } else {
        const { data, error } = await supabase
          .from("blog_posts")
          .insert({ title: postForm.title, content: postForm.content, image_path: imagePath })
          .select("id")
          .single();
        if (error) throw error;
        postId = data.id;
      }

      // Upload new images
      if (imageFiles.length > 0) {
        const existingCount = allPostImages.filter((i) => i.post_id === postId).length;
        for (let i = 0; i < imageFiles.length; i++) {
          const path = await uploadImage(imageFiles[i]);
          await supabase.from("blog_post_images").insert({
            post_id: postId,
            image_path: path,
            sort_order: existingCount + i,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-post-images"] });
      setEditingPost(null);
      setIsCreating(false);
      setPostForm({ title: "", content: "" });
      setImageFiles([]);
      toast({ title: editingPost ? "Запись обновлена" : "Запись создана" });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setSavingPost(false);
    }
  };

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("blog_posts").update({ is_published: published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-posts"] }),
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-post-images"] });
    },
  });

  const deleteImage = useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase.from("blog_post_images").delete().eq("id", imageId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-post-images"] }),
  });

  const addComment = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error("Не авторизован");
      const { error } = await supabase.from("blog_comments").insert({
        post_id: postId,
        user_id: user.id,
        author_email: user.email || "Аноним",
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments"] });
      setCommentTexts((prev) => ({ ...prev, [vars.postId]: "" }));
      toast({ title: "Комментарий отправлен", description: "Он появится после модерации" });
    },
  });

  const approveComment = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase.from("blog_comments").update({ is_approved: approved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-comments"] }),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-comments"] }),
  });

  const openCreate = () => {
    setPostForm({ title: "", content: "" });
    setImageFiles([]);
    setEditingPost(null);
    setIsCreating(true);
  };

  const openEdit = (post: BlogPost) => {
    setPostForm({ title: post.title, content: post.content });
    setImageFiles([]);
    setEditingPost(post);
    setIsCreating(true);
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    const maxSlots = estimateImageSlots(postForm.content);
    const currentCount = editingPost
      ? allPostImages.filter((i) => i.post_id === editingPost.id).length + imageFiles.length
      : imageFiles.length;
    const remaining = Math.max(0, maxSlots - currentCount);
    setImageFiles((prev) => [...prev, ...files.slice(0, remaining)]);
  }, [postForm.content, editingPost, allPostImages, imageFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"));
    const maxSlots = estimateImageSlots(postForm.content);
    const currentCount = editingPost
      ? allPostImages.filter((i) => i.post_id === editingPost.id).length + imageFiles.length
      : imageFiles.length;
    const remaining = Math.max(0, maxSlots - currentCount);
    setImageFiles((prev) => [...prev, ...files.slice(0, remaining)]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeNewFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const visiblePosts = isAdmin ? posts : posts.filter((p) => p.is_published);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const maxSlots = estimateImageSlots(postForm.content);
  const existingImages = editingPost ? allPostImages.filter((i) => i.post_id === editingPost.id) : [];
  const totalImages = existingImages.length + imageFiles.length;
  const canAddMore = totalImages < maxSlots;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Размышлизмы</h1>
            <p className="text-muted-foreground">Личный блог профессора Тарусина Д.И.</p>
          </div>
          {isAdmin && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" /> Новая запись
            </Button>
          )}
        </div>

        {/* Post editor dialog */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost ? "Редактировать запись" : "Новая запись"}</DialogTitle>
              <DialogDescription>Заполните поля и сохраните</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Название темы"
                value={postForm.title}
                onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))}
              />
              <RichTextEditor
                content={postForm.content}
                onChange={(html) => setPostForm((p) => ({ ...p, content: html }))}
                placeholder="Текст..."
              />

              {/* Image slots info */}
              <div className="text-sm text-muted-foreground">
                Фото: {totalImages} / {maxSlots} (рассчитано по длине текста)
              </div>

              {/* Existing images (for edit mode) */}
              {existingImages.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Загруженные фото</label>
                  <div className="grid grid-cols-3 gap-2">
                    {existingImages.map((img) => {
                      const url = getImageUrl(img.image_path);
                      return (
                        <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border">
                          <img src={url!} alt="" className="w-full h-24 object-cover" />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteImage.mutate(img.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New files preview */}
              {imageFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Новые фото</label>
                  <div className="grid grid-cols-3 gap-2">
                    {imageFiles.map((file, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-24 object-cover" />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeNewFile(i)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drag-and-drop zone */}
              {canAddMore && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Перетащите фото сюда или нажмите для выбора
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Можно добавить ещё {maxSlots - totalImages}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Отмена</Button>
              <Button onClick={savePost} disabled={savingPost || !postForm.title.trim() || !postForm.content.trim()}>
                {savingPost ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingPost ? "Сохранить изменения" : "Создать"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Login prompt */}
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Требуется регистрация</DialogTitle>
              <DialogDescription>Для отправки комментариев необходимо зарегистрироваться на сайте.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLoginDialog(false)}>Отмена</Button>
              <Link to="/auth">
                <Button>Зарегистрироваться</Button>
              </Link>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Posts */}
        {visiblePosts.length === 0 && (
          <p className="text-center text-muted-foreground py-16">Записей пока нет</p>
        )}

        <div className="space-y-12">
          {visiblePosts.map((post) => {
            const postImages = allPostImages.filter((i) => i.post_id === post.id);
            // Legacy single image support
            const legacyUrl = post.image_path ? getImageUrl(post.image_path) : null;
            const hasImages = postImages.length > 0 || legacyUrl;
            const postComments = allComments.filter((c) => c.post_id === post.id);
            const visibleComments = isAdmin ? postComments : postComments.filter((c) => c.is_approved || c.user_id === user?.id);

            return (
              <Card key={post.id} className="p-6 lg:p-8">
                {/* Admin controls */}
                {isAdmin && (
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={post.is_published ? "default" : "secondary"}>
                      {post.is_published ? "Опубликовано" : "Черновик"}
                    </Badge>
                    <Button size="icon" variant="ghost" onClick={() => togglePublish.mutate({ id: post.id, published: !post.is_published })}>
                      {post.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(post)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deletePost.mutate(post.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Post content */}
                <div className={`flex flex-col ${hasImages ? "lg:flex-row" : ""} gap-6`}>
                  {hasImages && (
                    <div className="lg:w-1/3 flex-shrink-0 space-y-3">
                      {postImages.map((img) => {
                        const url = getImageUrl(img.image_path);
                        return (
                          <div key={img.id} className="relative group">
                            <img
                              src={url!}
                              alt={post.title}
                              className="w-full rounded-lg object-cover"
                            />
                            {isAdmin && (
                              <Button
                                size="icon"
                                variant="destructive"
                                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteImage.mutate(img.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                      {legacyUrl && postImages.length === 0 && (
                        <img
                          src={legacyUrl}
                          alt={post.title}
                          className="w-full rounded-lg object-cover"
                        />
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground mb-2">{post.title}</h2>
                    <p className="text-xs text-muted-foreground mb-4">
                      {format(new Date(post.created_at), "d MMMM yyyy", { locale: ru })}
                    </p>
                    <div
                      className="prose prose-sm max-w-none text-foreground/90"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  </div>
                </div>

                {/* Comments section */}
                <div className="mt-8 border-t border-border pt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-4">
                    <MessageSquare className="w-4 h-4" />
                    Комментарии ({visibleComments.filter((c) => c.is_approved).length})
                  </h3>

                  {visibleComments.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {visibleComments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`p-3 rounded-lg text-sm ${comment.is_approved ? "bg-secondary" : "bg-secondary/50 border border-dashed border-border"}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-foreground">{comment.author_email}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.created_at), "d MMM yyyy, HH:mm", { locale: ru })}
                              </span>
                              {isAdmin && !comment.is_approved && (
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => approveComment.mutate({ id: comment.id, approved: true })}>
                                  <Check className="w-3 h-3 text-green-600" />
                                </Button>
                              )}
                              {isAdmin && (
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteComment.mutate(comment.id)}>
                                  <X className="w-3 h-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {!comment.is_approved && (
                            <Badge variant="outline" className="text-xs mb-1">На модерации</Badge>
                          )}
                          <p className="text-foreground/80">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={user ? "Написать комментарий..." : "Войдите, чтобы комментировать"}
                      value={commentTexts[post.id] || ""}
                      onChange={(e) => setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      onFocus={() => { if (!user) setShowLoginDialog(true); }}
                      readOnly={!user}
                    />
                    <Button
                      size="icon"
                      disabled={!user || !commentTexts[post.id]?.trim()}
                      onClick={() => addComment.mutate({ postId: post.id, content: commentTexts[post.id]!.trim() })}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Blog;
