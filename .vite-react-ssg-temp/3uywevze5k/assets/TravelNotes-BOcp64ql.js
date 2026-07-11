import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Image, Shield, Upload, Loader2, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { e as useToast, u as useAuth, s as supabase, P as PageMeta, D as Dialog, f as DialogTrigger, B as Button, h as DialogContent, i as DialogHeader, j as DialogTitle, L as Label, I as Input, T as Textarea, C as Card, a as CardContent } from "../main.mjs";
import "vite-react-ssg";
import "@tanstack/react-query";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@supabase/supabase-js";
import "i18next";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
import "react-helmet-async";
const TravelNotes = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newPhoto, setNewPhoto] = useState({ title: "", caption: "", file: null });
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();
  useEffect(() => {
    fetchPhotos();
  }, []);
  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase.from("travel_photos").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
      toast({
        title: isEn ? "Error" : "Ошибка",
        description: isEn ? "Failed to load photos" : "Не удалось загрузить фотографии",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const getPublicUrl = (path) => {
    const { data } = supabase.storage.from("travel-photos").getPublicUrl(path);
    return data.publicUrl;
  };
  const handleUpload = async () => {
    if (!newPhoto.file || !newPhoto.title) {
      toast({
        title: isEn ? "Fill in the fields" : "Заполните поля",
        description: isEn ? "Enter a title and select a photo" : "Укажите название и выберите фото",
        variant: "destructive"
      });
      return;
    }
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${newPhoto.file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from("travel-photos").upload(fileName, newPhoto.file);
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from("travel_photos").insert({
        title: newPhoto.title,
        caption: newPhoto.caption || null,
        image_path: fileName
      });
      if (insertError) throw insertError;
      toast({ title: isEn ? "Success" : "Успешно", description: isEn ? "Photo added" : "Фотография добавлена" });
      setNewPhoto({ title: "", caption: "", file: null });
      setUploadDialogOpen(false);
      fetchPhotos();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: isEn ? "Upload error" : "Ошибка загрузки",
        description: error.message || (isEn ? "Failed to upload photo" : "Не удалось загрузить фото"),
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  const handleDelete = async (photo) => {
    try {
      const { error: storageError } = await supabase.storage.from("travel-photos").remove([photo.image_path]);
      if (storageError) throw storageError;
      const { error: dbError } = await supabase.from("travel_photos").delete().eq("id", photo.id);
      if (dbError) throw dbError;
      toast({ title: isEn ? "Deleted" : "Удалено", description: isEn ? "Photo deleted" : "Фотография удалена" });
      if (selectedIndex !== null) setSelectedIndex(null);
      fetchPhotos();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: isEn ? "Delete error" : "Ошибка удаления",
        description: error.message || (isEn ? "Failed to delete photo" : "Не удалось удалить фото"),
        variant: "destructive"
      });
    }
  };
  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
  };
  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) setSelectedIndex(selectedIndex + 1);
  };
  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") setSelectedIndex(null);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: isEn ? "Travel Notes — Prof. Tarusin D.I." : "Путевые заметки — проф. Тарусин Д.И.",
        description: isEn ? "Travel notes and photo stories by Prof. Tarusin D.I. from medical conferences, masterclasses, and journeys across Russia and abroad." : "Путевые заметки и фотоистории профессора Тарусина Д.И. с медицинских конференций, мастер-классов и поездок по России и за рубежом.",
        path: "/travel-notes"
      }
    ),
    /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-12 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(
        Link,
        {
          to: isAdmin ? "/admin" : "/",
          className: "inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
            isAdmin ? isEn ? "Admin Panel" : "К панели администратора" : isEn ? "Home" : "На главную"
          ]
        }
      ),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-bold mb-4", children: isEn ? "Travel Notes" : "Путёвые заметки" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-primary-foreground/80 max-w-2xl", children: isEn ? "Take off — no go around. Flight log. From school surgery to the academic echelon. Through years and continents" : "Take off - no go around. Бортовой журнал. От школьной хирургии до академического эшелона. Сквозь года и континенты" })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-12 md:py-16", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-12", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Image, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: isEn ? "Gallery" : "Галерея" })
        ] }),
        !authLoading && isAdmin && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Shield, { className: "w-4 h-4 text-primary" }),
            isEn ? "Administrator" : "Администратор"
          ] }),
          /* @__PURE__ */ jsxs(Dialog, { open: uploadDialogOpen, onOpenChange: setUploadDialogOpen, children: [
            /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { children: [
              /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 mr-2" }),
              isEn ? "Add Photo" : "Добавить фото"
            ] }) }),
            /* @__PURE__ */ jsxs(DialogContent, { children: [
              /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: isEn ? "Add Photo" : "Добавить фотографию" }) }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4 mt-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs(Label, { htmlFor: "title", children: [
                    isEn ? "Title" : "Название",
                    " *"
                  ] }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      id: "title",
                      value: newPhoto.title,
                      onChange: (e) => setNewPhoto({ ...newPhoto, title: e.target.value }),
                      placeholder: isEn ? "e.g. Mountain sunset" : "Например: Закат в горах"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx(Label, { htmlFor: "caption", children: isEn ? "Caption" : "Подпись" }),
                  /* @__PURE__ */ jsx(
                    Textarea,
                    {
                      id: "caption",
                      value: newPhoto.caption,
                      onChange: (e) => setNewPhoto({ ...newPhoto, caption: e.target.value }),
                      placeholder: isEn ? "Photo description..." : "Описание фотографии...",
                      rows: 3
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs(Label, { htmlFor: "photo", children: [
                    isEn ? "Photo" : "Фотография",
                    " *"
                  ] }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      id: "photo",
                      type: "file",
                      accept: "image/*",
                      onChange: (e) => {
                        var _a;
                        return setNewPhoto({ ...newPhoto, file: ((_a = e.target.files) == null ? void 0 : _a[0]) || null });
                      }
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx(Button, { onClick: handleUpload, disabled: uploading, className: "w-full", children: uploading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                  isEn ? "Uploading..." : "Загрузка..."
                ] }) : isEn ? "Add" : "Добавить" })
              ] })
            ] })
          ] })
        ] })
      ] }) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) }) : photos.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-20", children: [
        /* @__PURE__ */ jsx(Image, { className: "w-16 h-16 mx-auto text-muted-foreground mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground", children: isEn ? "No photos added yet" : "Фотографии пока не добавлены" }),
        isAdmin && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-2", children: isEn ? 'Click "Add Photo" to upload the first one' : "Нажмите «Добавить фото» чтобы добавить первую фотографию" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: photos.map((photo, index) => /* @__PURE__ */ jsxs(Card, { className: "group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer", onClick: () => setSelectedIndex(index), children: [
        /* @__PURE__ */ jsxs("div", { className: "aspect-square relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("img", { src: getPublicUrl(photo.image_path), alt: photo.title, className: "w-full h-full object-cover transition-transform group-hover:scale-105" }),
          isAdmin && /* @__PURE__ */ jsx(Button, { variant: "destructive", size: "icon", className: "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity", onClick: (e) => {
            e.stopPropagation();
            handleDelete(photo);
          }, children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-3", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-medium text-foreground truncate", children: photo.title }),
          photo.caption && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground line-clamp-2 mt-1", children: photo.caption })
        ] })
      ] }, photo.id)) }),
      selectedIndex !== null && photos[selectedIndex] && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 bg-black/90 z-50 flex items-center justify-center", onClick: () => setSelectedIndex(null), onKeyDown: handleKeyDown, tabIndex: 0, children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "absolute top-4 right-4 text-white hover:bg-white/20", onClick: () => setSelectedIndex(null), children: /* @__PURE__ */ jsx(X, { className: "w-6 h-6" }) }),
        selectedIndex > 0 && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20", onClick: (e) => {
          e.stopPropagation();
          handlePrev();
        }, children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-8 h-8" }) }),
        selectedIndex < photos.length - 1 && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20", onClick: (e) => {
          e.stopPropagation();
          handleNext();
        }, children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-8 h-8" }) }),
        /* @__PURE__ */ jsxs("div", { className: "max-w-5xl max-h-[90vh] flex flex-col items-center px-4", onClick: (e) => e.stopPropagation(), children: [
          /* @__PURE__ */ jsx("img", { src: getPublicUrl(photos[selectedIndex].image_path), alt: photos[selectedIndex].title, className: "max-h-[70vh] max-w-full object-contain" }),
          /* @__PURE__ */ jsxs("div", { className: "text-center mt-4 text-white", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold", children: photos[selectedIndex].title }),
            photos[selectedIndex].caption && /* @__PURE__ */ jsx("p", { className: "text-white/80 mt-2 max-w-2xl", children: photos[selectedIndex].caption }),
            /* @__PURE__ */ jsxs("p", { className: "text-white/80 text-sm mt-2", children: [
              selectedIndex + 1,
              " / ",
              photos.length
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
};
export {
  TravelNotes as default
};
