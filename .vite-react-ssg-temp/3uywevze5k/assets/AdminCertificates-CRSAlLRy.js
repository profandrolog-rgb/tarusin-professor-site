import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { u as useAuth, s as supabase, B as Button, D as Dialog, f as DialogTrigger, h as DialogContent, i as DialogHeader, j as DialogTitle, L as Label, I as Input, C as Card, a as CardContent } from "../main.mjs";
import { S as Switch } from "./switch-D2b9t4DD.js";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Plus, X, Upload, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@supabase/supabase-js";
import "i18next";
import "@radix-ui/react-dropdown-menu";
import "react-i18next";
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
import "react-helmet-async";
import "@radix-ui/react-switch";
const AdminCertificates = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPublished, setIsPublished] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("certificates").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    }
  });
  const uploadImage = async (file) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("certificates").upload(fileName, file);
    if (uploadError) throw uploadError;
    return fileName;
  };
  const deleteImage = async (imagePath) => {
    await supabase.storage.from("certificates").remove([imagePath]);
  };
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!imageFile) throw new Error("Выберите изображение");
      setIsUploading(true);
      const imagePath = await uploadImage(imageFile);
      const maxSortOrder = certificates.length > 0 ? Math.max(...certificates.map((c) => c.sort_order || 0)) : 0;
      const { error } = await supabase.from("certificates").insert({
        title,
        image_path: imagePath,
        is_published: isPublished,
        sort_order: maxSortOrder + 1
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
    }
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
      const { error } = await supabase.from("certificates").update({
        title,
        image_path: imagePath,
        is_published: isPublished
      }).eq("id", editingCertificate.id);
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
    }
  });
  const deleteMutation = useMutation({
    mutationFn: async (certificate) => {
      await deleteImage(certificate.image_path);
      const { error } = await supabase.from("certificates").delete().eq("id", certificate.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast.success("Сертификат удалён");
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    }
  });
  const moveMutation = useMutation({
    mutationFn: async ({
      certificate,
      direction
    }) => {
      const currentIndex = certificates.findIndex((c) => c.id === certificate.id);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= certificates.length) return;
      const targetCertificate = certificates[targetIndex];
      await supabase.from("certificates").update({ sort_order: targetCertificate.sort_order }).eq("id", certificate.id);
      await supabase.from("certificates").update({ sort_order: certificate.sort_order }).eq("id", targetCertificate.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
    }
  });
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/certificates" } });
    }
  }, [user, isAdmin, authLoading, navigate]);
  if (authLoading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) });
  }
  if (!user || !isAdmin) return null;
  const resetForm = () => {
    setTitle("");
    setImageFile(null);
    setImagePreview(null);
    setIsPublished(true);
    setEditingCertificate(null);
  };
  const openEditDialog = (certificate) => {
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
  const handleImageChange = (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
    if (file) {
      processImageFile(file);
    }
  };
  const processImageFile = (file) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, выберите изображение");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    var _a;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = (_a = e.dataTransfer.files) == null ? void 0 : _a[0];
    if (file) {
      processImageFile(file);
    }
  };
  const getImageUrl = (imagePath) => {
    const { data } = supabase.storage.from("certificates").getPublicUrl(imagePath);
    return data.publicUrl;
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCertificate) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Загрузка..." }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-8", children: [
      /* @__PURE__ */ jsx(Link, { to: "/admin", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "h-5 w-5" }) }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground", children: "Сертификаты и дипломы" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Управление галереей сертификатов" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen, children: [
      /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { onClick: openCreateDialog, className: "mb-6", children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-2" }),
        "Добавить сертификат"
      ] }) }),
      /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md", children: [
        /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: editingCertificate ? "Редактировать сертификат" : "Добавить сертификат" }) }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "title", children: "Название" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "title",
                value: title,
                onChange: (e) => setTitle(e.target.value),
                placeholder: "Диплом врача",
                required: true,
                maxLength: 100
              }
            ),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
              title.length,
              "/100"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Изображение" }),
            imagePreview ? /* @__PURE__ */ jsxs("div", { className: "relative mt-2", children: [
              /* @__PURE__ */ jsx(
                "img",
                {
                  src: imagePreview,
                  alt: "Preview",
                  className: "w-full h-40 object-contain rounded-lg border bg-muted"
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: "destructive",
                  size: "icon",
                  className: "absolute top-2 right-2",
                  onClick: () => {
                    setImageFile(null);
                    setImagePreview(null);
                  },
                  children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
                }
              )
            ] }) : /* @__PURE__ */ jsxs(
              "label",
              {
                className: `flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors mt-2 ${isDragging ? "border-primary bg-primary/10" : "hover:bg-muted/50"}`,
                onDragOver: handleDragOver,
                onDragEnter: handleDragEnter,
                onDragLeave: handleDragLeave,
                onDrop: handleDrop,
                children: [
                  /* @__PURE__ */ jsx(Upload, { className: `h-8 w-8 mb-2 ${isDragging ? "text-primary" : "text-muted-foreground"}` }),
                  /* @__PURE__ */ jsx("span", { className: `text-sm ${isDragging ? "text-primary font-medium" : "text-muted-foreground"}`, children: isDragging ? "Отпустите для загрузки" : "Перетащите или нажмите для загрузки" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "file",
                      className: "hidden",
                      accept: "image/*",
                      onChange: handleImageChange
                    }
                  )
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "published", children: "Опубликован" }),
            /* @__PURE__ */ jsx(
              Switch,
              {
                id: "published",
                checked: isPublished,
                onCheckedChange: setIsPublished
              }
            )
          ] }),
          /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: isUploading, children: isUploading ? "Загрузка..." : editingCertificate ? "Сохранить" : "Добавить" })
        ] })
      ] })
    ] }),
    certificates.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-12 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Нет добавленных сертификатов" }) }) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: certificates.map((certificate, index) => /* @__PURE__ */ jsxs(
      Card,
      {
        className: `overflow-hidden ${!certificate.is_published ? "opacity-60" : ""}`,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "aspect-[4/3] relative overflow-hidden bg-muted", children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                src: getImageUrl(certificate.image_path),
                alt: certificate.title,
                className: "w-full h-full object-contain"
              }
            ),
            !certificate.is_published && /* @__PURE__ */ jsx("div", { className: "absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded", children: "Скрыт" })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-medium text-foreground mb-3 truncate", children: certificate.title }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "outline",
                    size: "icon",
                    className: "h-8 w-8",
                    onClick: () => moveMutation.mutate({ certificate, direction: "up" }),
                    disabled: index === 0,
                    children: /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "outline",
                    size: "icon",
                    className: "h-8 w-8",
                    onClick: () => moveMutation.mutate({ certificate, direction: "down" }),
                    disabled: index === certificates.length - 1,
                    children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    onClick: () => openEditDialog(certificate),
                    children: "Изменить"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "destructive",
                    size: "icon",
                    className: "h-8 w-8",
                    onClick: () => {
                      if (confirm("Удалить сертификат?")) {
                        deleteMutation.mutate(certificate);
                      }
                    },
                    children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
                  }
                )
              ] })
            ] })
          ] })
        ]
      },
      certificate.id
    )) })
  ] }) });
};
export {
  AdminCertificates as default
};
