import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, MessageSquare, Send, Check, X, Loader2, Upload, ArrowUp, ArrowDown, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Move, LayoutGrid, List as ListIcon, Image as ImageIcon } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import RichTextEditor from "@/components/blog/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAutoSave } from "@/hooks/useAutoSave";
import { toast as sonnerToast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useHashOpen } from "@/hooks/useHashOpen";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image_path: string | null;
  card_background_path: string | null;
  card_annotation: string | null;
  is_published: boolean;
  sort_order: number | null;
  created_at: string;
}

interface BlogPostImage {
  id: string;
  post_id: string;
  image_path: string;
  sort_order: number | null;
  object_position: string;
  created_at: string;
}

interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  author_email?: string;
  content: string;
  is_approved: boolean;
  created_at: string;
}

interface BlogReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: "like" | "dislike";
}

const IMAGE_HEIGHT_PX = 220;
const LINE_HEIGHT_PX = 24;

function estimateImageSlots(text: string): number {
  const lines = Math.max(1, Math.ceil(text.length / 80));
  const textHeight = lines * LINE_HEIGHT_PX;
  const slots = Math.max(1, Math.floor(textHeight / IMAGE_HEIGHT_PX));
  return slots;
}

const Blog = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const queryClient = useQueryClient();

  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", content: "", excerpt: "", card_annotation: "", card_background_path: null as string | null });
  const blogAutoSaveKey = useMemo(() => editingPost ? `blog_edit_${editingPost.id}` : "blog_new", [editingPost]);
  const { save: saveBlogDraft, loadDraft: loadBlogDraft, clearDraft: clearBlogDraft } = useAutoSave({
    key: blogAutoSaveKey,
    data: postForm,
    enabled: isCreating,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [cardBgFile, setCardBgFile] = useState<File | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "cards">(() => {
    if (typeof window === "undefined") return "list";
    return (localStorage.getItem("blog-view-mode") as "list" | "cards") || "list";
  });
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("blog-view-mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxUrl) setLightboxUrl(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxUrl]);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("sort_order", { ascending: true });
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
        .from("blog_comments_public" as any)
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as BlogComment[];
    },
  });

  const { data: allReactions = [] } = useQuery({
    queryKey: ["blog-reactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_post_reactions")
        .select("*");
      if (error) throw error;
      return data as BlogReaction[];
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
      let imagePath = editingPost?.image_path || null;
      let cardBgPath: string | null = postForm.card_background_path;
      if (cardBgFile) {
        cardBgPath = await uploadImage(cardBgFile);
      }

      const payload = {
        title: postForm.title,
        content: postForm.content,
        excerpt: postForm.excerpt || null,
        image_path: imagePath,
        card_background_path: cardBgPath,
        card_annotation: postForm.card_annotation?.trim() || null,
      };

      let postId: string;
      if (editingPost) {
        const { error } = await supabase
          .from("blog_posts")
          .update(payload)
          .eq("id", editingPost.id);
        if (error) throw error;
        postId = editingPost.id;
      } else {
        const { data, error } = await supabase
          .from("blog_posts")
          .insert({ ...payload, sort_order: posts.length })
          .select("id")
          .single();
        if (error) throw error;
        postId = data.id;
      }

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
      setPostForm({ title: "", content: "", excerpt: "", card_annotation: "", card_background_path: null });
      setImageFiles([]);
      setCardBgFile(null);
      clearBlogDraft();
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

  const updateImagePosition = useMutation({
    mutationFn: async ({ imageId, position }: { imageId: string; position: string }) => {
      const { error } = await supabase.from("blog_post_images").update({ object_position: position }).eq("id", imageId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-post-images"] }),
  });

  const reorderPosts = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await supabase
          .from("blog_posts")
          .update({ sort_order: i })
          .eq("id", orderedIds[i]);
        if (error) throw error;
      }
    },
    onMutate: async (orderedIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: ["blog-posts"] });
      const previous = queryClient.getQueryData<BlogPost[]>(["blog-posts"]);
      if (previous) {
        const reordered = orderedIds
          .map((id) => previous.find((p) => p.id === id))
          .filter(Boolean) as BlogPost[];
        queryClient.setQueryData(["blog-posts"], reordered.map((p, i) => ({ ...p, sort_order: i })));
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["blog-posts"], context.previous);
      }
      toast({ title: "Ошибка сортировки", variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["blog-posts"] }),
  });

  const toggleReaction = useMutation({
    mutationFn: async ({ postId, type }: { postId: string; type: "like" | "dislike" }) => {
      if (!user) throw new Error("Не авторизован");
      const existing = allReactions.find((r) => r.post_id === postId && r.user_id === user.id);
      if (existing) {
        if (existing.reaction_type === type) {
          // Remove reaction
          const { error } = await supabase.from("blog_post_reactions").delete().eq("id", existing.id);
          if (error) throw error;
        } else {
          // Change reaction
          const { error } = await supabase.from("blog_post_reactions").update({ reaction_type: type }).eq("id", existing.id);
          if (error) throw error;
        }
      } else {
        // New reaction
        const { error } = await supabase.from("blog_post_reactions").insert({
          post_id: postId,
          user_id: user.id,
          reaction_type: type,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-reactions"] }),
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
    setPostForm({ title: "", content: "", excerpt: "", card_annotation: "", card_background_path: null });
    setImageFiles([]);
    setCardBgFile(null);
    setEditingPost(null);
    setIsCreating(true);
    // Check for draft
    setTimeout(() => {
      const draft = loadBlogDraft();
      if (draft && (draft.title || draft.content)) {
        sonnerToast("Найден черновик", {
          description: "Восстановить несохранённые изменения?",
          action: { label: "Восстановить", onClick: () => {
            setPostForm({
              title: draft.title || "",
              content: draft.content || "",
              excerpt: draft.excerpt || "",
              card_annotation: draft.card_annotation || "",
              card_background_path: draft.card_background_path || null,
            });
            sonnerToast.success("Черновик восстановлен");
          }},
          cancel: { label: "Отклонить", onClick: () => clearBlogDraft() },
          duration: 10000,
        });
      }
    }, 100);
  };

  const openEdit = (post: BlogPost) => {
    setPostForm({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || "",
      card_annotation: post.card_annotation || "",
      card_background_path: post.card_background_path || null,
    });
    setImageFiles([]);
    setCardBgFile(null);
    setEditingPost(post);
    setIsCreating(true);
  };

  const toggleExpanded = (postId: string) => {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const movePost = (postId: string, direction: "up" | "down") => {
    const currentOrder = visiblePosts.map((p) => p.id);
    const index = currentOrder.indexOf(postId);
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentOrder.length) return;
    currentOrder.splice(index, 1);
    currentOrder.splice(newIndex, 0, postId);
    reorderPosts.mutate(currentOrder);
  };

  // Image position drag handler
  const handlePositionDrag = useCallback((imageId: string, e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const startY = e.clientY;
    const img = allPostImages.find((i) => i.id === imageId);
    const currentPos = img?.object_position || "center";
    // Parse current Y percentage
    let startPct = 50;
    const match = currentPos.match(/(\d+)%\s*$/);
    if (match) startPct = parseInt(match[1]);
    if (currentPos === "top") startPct = 0;
    if (currentPos === "bottom") startPct = 100;

    const onMove = (ev: MouseEvent) => {
      const dy = ev.clientY - startY;
      const pct = Math.max(0, Math.min(100, startPct + (dy / rect.height) * 100));
      // Update locally via style
      const imgEl = container.querySelector("img");
      if (imgEl) imgEl.style.objectPosition = `center ${Math.round(pct)}%`;
    };

    const onUp = (ev: MouseEvent) => {
      const dy = ev.clientY - startY;
      const pct = Math.max(0, Math.min(100, Math.round(startPct + (dy / rect.height) * 100)));
      updateImagePosition.mutate({ imageId, position: `center ${pct}%` });
      setDraggingImageId(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    setDraggingImageId(imageId);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [allPostImages, updateImagePosition]);

  // Drag and drop handlers for images
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

  const getReactionCounts = (postId: string) => {
    const postReactions = allReactions.filter((r) => r.post_id === postId);
    return {
      likes: postReactions.filter((r) => r.reaction_type === "like").length,
      dislikes: postReactions.filter((r) => r.reaction_type === "dislike").length,
      userReaction: user ? postReactions.find((r) => r.user_id === user.id)?.reaction_type || null : null,
    };
  };

  const visiblePosts = isAdmin ? posts : posts.filter((p) => p.is_published);

  // Open a specific post when arriving via #post-{id} from smart search.
  useHashOpen("post", visiblePosts.length > 0, useCallback((id: string) => {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []));

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
    <div className="min-h-screen bg-background select-none" onContextMenu={(e) => e.preventDefault()} onCopy={(e) => e.preventDefault()}>
      <PageMeta title={isEn ? "Reflections — Prof. Tarusin" : "Размышлизмы — Проф. Тарусин Д.И."} description={isEn ? "Professor Tarusin's personal blog — reflections on medicine, andrology, life and professional journey." : "Авторский блог профессора Тарусина — размышления о медицине, андрологии, жизни и профессиональном пути."} path="/blog" />
      <div className="container mx-auto px-4 py-8 pt-24">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {isEn ? "Home" : "На главную"}
        </Link>

        {/* Disclaimer */}
        <div className="mb-8 border border-destructive rounded-lg p-4 text-sm text-muted-foreground leading-relaxed space-y-3">
          <p><strong>Статус материалов.</strong> Все тексты в разделе «Размышлизмы» являются авторскими публикациями в форме личных заметок, комментариев и рассуждений. Сведения, мнения и выводы отражают исключительно личную позицию автора на момент публикации и могут изменяться.</p>
          <p><strong>Оценочные суждения.</strong> Значительная часть высказываний в данном разделе носит характер оценочных суждений, гипотез, допущений и субъективной интерпретации событий. Оценочные суждения не претендуют на установление фактов и не являются утверждениями о достоверно известных обстоятельствах.</p>
          <p><strong>О фактах и источниках.</strong> Там, где приводятся фактические данные, автор старается указывать первоисточники и открытые публикации. При обнаружении ошибок, неточностей, устаревшей информации или некорректных формулировок автор готов внести правки или дать уточнение по запросу через форму обратной связи.</p>
          <p><strong>Отсутствие призывов и инструкций.</strong> Публикации не содержат и не преследуют цели побуждения к противоправным действиям, насилию, вражде, дискриминации, распространению запрещенной информации либо совершению действий, нарушающих права третьих лиц. Материалы не являются инструкциями к действию и предназначены для обсуждения идей и общественных явлений.</p>
          <p><strong>Уважение к различным взглядам и чувствительным темам.</strong> В разделе могут затрагиваться спорные общественные вопросы (в т.ч. работа системы здравоохранения, вопросы управления, цензуры, идеологии, религии, безопасности и иные темы). Автор исходит из принципов уважения к людям и их убеждениям; критика направлена на явления, решения, практики и публичные позиции, а не на унижение достоинства конкретных лиц или социальных групп.</p>
          <p><strong>Об армии, государстве, религии и иных охраняемых темах.</strong> Любые упоминания государственных институтов, общественных организаций, религиозных взглядов и символов, а также обсуждение вопросов, связанных с армией и безопасностью, носят публицистический/аналитический характер и представляют собой мнение автора. Автор не ставит целью оскорбление, унижение, разжигание ненависти, дискредитацию кого-либо либо формирование враждебного отношения к людям по признакам принадлежности к группе.</p>
          <p><strong>Комментарии пользователей.</strong> Автор/администрация сайта оставляет за собой право модерировать и удалять комментарии и материалы пользователей, содержащие оскорбления, клевету, персональные данные без согласия, призывы к насилию/вражде, запрещенную информацию или иные нарушения законодательства и прав третьих лиц.</p>
          <p><strong>Персональные данные и частная жизнь.</strong> В публикациях не ставится цель распространения персональных данных; при выявлении персональных данных, размещенных без надлежащих оснований, просьба сообщить — информация будет удалена или обезличена.</p>
          <p><strong>Контакты для претензий.</strong> Для обращений правообладателей, государственных органов и лиц, считающих, что материал нарушает их права, доступен канал связи через форму обратной связи на сайте. Обращения рассматриваются в разумный срок; при необходимости материал может быть временно ограничен до уточнения обстоятельств.</p>
        </div>

        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{isEn ? "Reflections" : "Размышлизмы"}</h1>
            <p className="text-muted-foreground">{isEn ? "My personal blog" : "Мой личный блог"}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-border overflow-hidden">
              <Button
                type="button"
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="rounded-none gap-1"
                onClick={() => setViewMode("list")}
                title={isEn ? "List view" : "Списком"}
              >
                <ListIcon className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                className="rounded-none gap-1"
                onClick={() => setViewMode("cards")}
                title={isEn ? "Card view" : "Карточками"}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            {isAdmin && (
              <Button onClick={openCreate} className="gap-2">
                <Plus className="w-4 h-4" /> {isEn ? "New Post" : "Новая запись"}
              </Button>
            )}
          </div>
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
              <Textarea
                placeholder="Краткая аннотация (будет видна в свёрнутом виде)"
                value={postForm.excerpt}
                onChange={(e) => setPostForm((p) => ({ ...p, excerpt: e.target.value }))}
                rows={2}
              />
              <RichTextEditor
                content={postForm.content}
                onChange={(html) => setPostForm((p) => ({ ...p, content: html }))}
                placeholder="Текст..."
              />

              {/* Card view settings */}
              <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <LayoutGrid className="w-4 h-4" /> Настройки карточки (вид «карточками»)
                </div>
                <Input
                  placeholder="Короткая аннотация под карточкой (1–2 предложения)"
                  value={postForm.card_annotation}
                  onChange={(e) => setPostForm((p) => ({ ...p, card_annotation: e.target.value }))}
                  maxLength={180}
                />
                <div className="flex items-center gap-3">
                  {(cardBgFile || postForm.card_background_path) && (
                    <div className="relative w-20 h-14 rounded overflow-hidden border border-border flex-shrink-0">
                      <img
                        src={cardBgFile ? URL.createObjectURL(cardBgFile) : getImageUrl(postForm.card_background_path)!}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    <ImageIcon className="w-4 h-4" />
                    <span>{cardBgFile || postForm.card_background_path ? "Заменить фон карточки" : "Загрузить фон карточки"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setCardBgFile(f);
                      }}
                    />
                  </label>
                  {(cardBgFile || postForm.card_background_path) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCardBgFile(null);
                        setPostForm((p) => ({ ...p, card_background_path: null }));
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Изображение будет показано полупрозрачным фоном карточки, текст — поверх.
                </p>
              </div>

              {/* Image slots info */}
              <div className="text-sm text-muted-foreground">
                Фото: {totalImages} / {maxSlots} (рассчитано по длине текста)
              </div>

              {/* Existing images (for edit mode) */}
              {existingImages.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Загруженные фото</label>
                  <p className="text-xs text-muted-foreground">Перетаскивайте фото вверх/вниз для настройки кадрирования</p>
                  <div className="grid grid-cols-3 gap-2">
                    {existingImages.map((img) => {
                      const url = getImageUrl(img.image_path);
                      return (
                        <div
                          key={img.id}
                          className={`relative group rounded-lg overflow-hidden border ${draggingImageId === img.id ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                        >
                          <div
                            className="relative h-24 cursor-move select-none"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handlePositionDrag(img.id, e);
                            }}
                          >
                            <img
                              src={url!}
                              alt=""
                              className="w-full h-full object-cover pointer-events-none"
                              style={{ objectPosition: img.object_position || "center" }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                              <Move className="w-5 h-5 text-white drop-shadow" />
                            </div>
                          </div>
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

        {/* Lightbox */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-pointer"
            onClick={() => setLightboxUrl(null)}
          >
            <img
              src={lightboxUrl}
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white"
              onClick={() => setLightboxUrl(null)}
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        )}

        {/* Login prompt */}
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Требуется регистрация</DialogTitle>
              <DialogDescription>Для отправки комментариев и оценок необходимо зарегистрироваться на сайте.</DialogDescription>
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
          <p className="text-center text-muted-foreground py-16">{isEn ? "No posts yet" : "Записей пока нет"}</p>
        )}

        {viewMode === "cards" && visiblePosts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {visiblePosts.map((post) => {
              const bgUrl = post.card_background_path ? getImageUrl(post.card_background_path) : null;
              const postImages = allPostImages.filter((i) => i.post_id === post.id);
              const fallbackImg = postImages.length > 0
                ? getImageUrl(postImages[0].image_path)
                : (post.image_path ? getImageUrl(post.image_path) : null);
              const cardImg = bgUrl || fallbackImg;
              return (
                <Card
                  key={`card-${post.id}`}
                  className="relative overflow-hidden cursor-pointer group h-56 flex flex-col justify-end border border-border hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setViewMode("list");
                    setExpandedPosts((prev) => new Set(prev).add(post.id));
                    setTimeout(() => {
                      const el = document.getElementById(`post-${post.id}`);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 100);
                  }}
                >
                  {cardImg && (
                    <>
                      <img
                        src={cardImg}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
                    </>
                  )}
                  <div className="relative p-4 z-10">
                    <h3 className="text-lg font-semibold text-foreground leading-snug line-clamp-3 mb-2">
                      {post.title}
                    </h3>
                    {(post.card_annotation || post.excerpt) && (
                      <p className="text-xs text-muted-foreground line-clamp-2 italic">
                        {post.card_annotation || post.excerpt}
                      </p>
                    )}
                    {isAdmin && !post.is_published && (
                      <Badge variant="secondary" className="mt-2">Черновик</Badge>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(post); }}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {viewMode === "list" && (
        <div className="space-y-6">
          {visiblePosts.map((post) => {
            const postImages = allPostImages.filter((i) => i.post_id === post.id);
            const legacyUrl = post.image_path ? getImageUrl(post.image_path) : null;
            const firstImage = postImages.length > 0 ? getImageUrl(postImages[0].image_path) : legacyUrl;
            const firstImagePosition = postImages.length > 0 ? postImages[0].object_position : "center";
            const hasImages = postImages.length > 0 || legacyUrl;
            const postComments = allComments.filter((c) => c.post_id === post.id);
            const visibleComments = isAdmin ? postComments : postComments.filter((c) => c.is_approved || c.user_id === user?.id);
            const isExpanded = expandedPosts.has(post.id);
            const { likes, dislikes, userReaction } = getReactionCounts(post.id);

            return (
              <Card
                key={post.id}
                id={`post-${post.id}`}
                className="p-6 lg:p-8 transition-shadow scroll-mt-24"
              >
                {/* Admin controls */}
                {isAdmin && (
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => movePost(post.id, "up")}
                      disabled={visiblePosts.indexOf(post) === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => movePost(post.id, "down")}
                      disabled={visiblePosts.indexOf(post) === visiblePosts.length - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
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

                {/* Collapsed view */}
                {!isExpanded && (
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleExpanded(post.id)}
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {firstImage && (
                        <div className="sm:w-48 flex-shrink-0">
                          <img
                            src={firstImage}
                            alt={post.title}
                            className="w-full h-36 sm:h-32 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ objectPosition: firstImagePosition }}
                            onClick={(e) => { e.stopPropagation(); setLightboxUrl(firstImage); }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold text-foreground mb-1">{post.title}</h2>
                        <p className="text-xs text-muted-foreground mb-2">
                          {format(new Date(post.created_at), "d MMMM yyyy", { locale: ru })}
                        </p>
                        {post.excerpt && (
                          <p className="text-foreground/70 text-sm line-clamp-3">{post.excerpt}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-primary text-sm font-medium flex items-center gap-1">
                            {isEn ? "Read more" : "Читать далее"} <ChevronDown className="w-4 h-4" />
                          </span>
                          {/* Compact reaction counts in collapsed view */}
                          <span className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {likes}</span>
                            <span className="flex items-center gap-1"><ThumbsDown className="w-3.5 h-3.5" /> {dislikes}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expanded view */}
                {isExpanded && (
                  <>
                    <div
                      className="cursor-pointer flex items-center gap-1 text-primary text-sm font-medium mb-4"
                      onClick={() => toggleExpanded(post.id)}
                    >
                      {isEn ? "Collapse" : "Свернуть"} <ChevronUp className="w-4 h-4" />
                    </div>

                    {hasImages ? (
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="lg:w-48 flex-shrink-0 flex flex-col gap-2">
                          {postImages.map((img) => {
                            const url = getImageUrl(img.image_path);
                            return (
                              <div key={img.id} className="relative group">
                                <img
                                  src={url!}
                                  alt={post.title}
                                  className="w-full h-36 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                  style={{ objectPosition: img.object_position || "center" }}
                                  onClick={() => setLightboxUrl(url!)}
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
                              className="w-full h-36 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setLightboxUrl(legacyUrl)}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 relative">
                          <div className="lg:absolute lg:inset-0 lg:overflow-y-auto lg:pr-2">
                            <h2 className="text-2xl font-bold text-foreground mb-2">{post.title}</h2>
                            <p className="text-xs text-muted-foreground mb-4">
                              {format(new Date(post.created_at), "d MMMM yyyy", { locale: ru })}
                            </p>
                            <div
                              className="prose prose-sm max-w-none text-foreground/90"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">{post.title}</h2>
                        <p className="text-xs text-muted-foreground mb-4">
                          {format(new Date(post.created_at), "d MMMM yyyy", { locale: ru })}
                        </p>
                        <div
                          className="prose prose-sm max-w-none text-foreground/90"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                        />
                      </div>
                    )}

                    {/* Likes / Dislikes */}
                    <div className="mt-6 flex items-center gap-3">
                      <Button
                        variant={userReaction === "like" ? "default" : "outline"}
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          if (!user) { setShowLoginDialog(true); return; }
                          toggleReaction.mutate({ postId: post.id, type: "like" });
                        }}
                      >
                        <ThumbsUp className="w-4 h-4" /> {likes}
                      </Button>
                      <Button
                        variant={userReaction === "dislike" ? "default" : "outline"}
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          if (!user) { setShowLoginDialog(true); return; }
                          toggleReaction.mutate({ postId: post.id, type: "dislike" });
                        }}
                      >
                        <ThumbsDown className="w-4 h-4" /> {dislikes}
                      </Button>
                    </div>

                    {/* Comments section */}
                    <div className="mt-8 border-t border-border pt-6">
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-4">
                        <MessageSquare className="w-4 h-4" />
                        {isEn ? "Comments" : "Комментарии"} ({visibleComments.filter((c) => c.is_approved).length})
                      </h3>

                      {visibleComments.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {visibleComments.map((comment) => (
                            <div
                              key={comment.id}
                              className={`p-3 rounded-lg text-sm ${comment.is_approved ? "bg-secondary" : "bg-secondary/50 border border-dashed border-border"}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-foreground">{(comment.author_email || "Пользователь").replace(/(.{2})(.*)(@.*)/, "$1***$3")}</span>
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
                          placeholder={user ? (isEn ? "Write a comment..." : "Написать комментарий...") : (isEn ? "Sign in to comment" : "Войдите, чтобы комментировать")}
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
                  </>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Blog;
