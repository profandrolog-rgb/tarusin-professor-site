import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Lock, LogIn, Video, Loader2, Shield, Upload, Play, Trash2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { e as useToast, u as useAuth, s as supabase, C as Card, a as CardContent, B as Button, P as PageMeta } from "../main.mjs";
import { useTranslation } from "react-i18next";
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
const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  useEffect(() => {
    if (!authLoading && user) {
      fetchVideos();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    toast({
      title: "Копирование запрещено",
      description: "Копирование категорически запрещено!",
      variant: "destructive"
    });
    return false;
  }, [toast]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        toast({
          title: "Копирование запрещено",
          description: "Копирование категорически запрещено!",
          variant: "destructive"
        });
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toast]);
  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase.storage.from("videos").list("", { sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      const filteredFiles = (data || []).filter(
        (file) => file.name !== ".emptyFolderPlaceholder"
      );
      const videoFilesWithUrls = await Promise.all(
        filteredFiles.map(async (file) => {
          const { data: signedUrlData } = await supabase.storage.from("videos").createSignedUrl(file.name, 3600);
          return {
            name: file.name,
            url: (signedUrlData == null ? void 0 : signedUrlData.signedUrl) || "",
            created_at: file.created_at || ""
          };
        })
      );
      setVideos(videoFilesWithUrls.filter((v) => v.url));
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список видео",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleUpload = async (event) => {
    var _a;
    const file = (_a = event.target.files) == null ? void 0 : _a[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Неверный формат",
        description: "Пожалуйста, загрузите видеофайл (MP4, WebM, и т.д.)",
        variant: "destructive"
      });
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "Файл слишком большой",
        description: "Максимальный размер видео — 100 МБ",
        variant: "destructive"
      });
      return;
    }
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error } = await supabase.storage.from("videos").upload(fileName, file);
      if (error) throw error;
      toast({
        title: "Успешно",
        description: "Видео загружено"
      });
      fetchVideos();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить видео",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };
  const handleDelete = async (fileName) => {
    var _a;
    try {
      const { error } = await supabase.storage.from("videos").remove([fileName]);
      if (error) throw error;
      toast({
        title: "Удалено",
        description: "Видео удалено"
      });
      if (selectedVideo === ((_a = videos.find((v) => v.name === fileName)) == null ? void 0 : _a.url)) {
        setSelectedVideo(null);
      }
      fetchVideos();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Ошибка удаления",
        description: error.message || "Не удалось удалить видео",
        variant: "destructive"
      });
    }
  };
  const handleLoginRedirect = () => {
    navigate("/auth", { state: { from: "/videos" } });
  };
  if (!authLoading && !user) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
      /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-12 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/",
            className: "inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
              "На главную"
            ]
          }
        ),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-bold mb-4", children: "Видео" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-primary-foreground/80 max-w-2xl", children: "Обучающие видео и записи лекций" })
      ] }) }),
      /* @__PURE__ */ jsx("main", { className: "container mx-auto px-4 py-12 md:py-16", children: /* @__PURE__ */ jsx("div", { className: "max-w-lg mx-auto text-center", children: /* @__PURE__ */ jsx(Card, { className: "p-8", children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-6", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(Lock, { className: "w-10 h-10 text-primary" }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground mb-4", children: "Для просмотра видео необходима авторизация" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6", children: "Пожалуйста, войдите в систему или зарегистрируйтесь, чтобы получить доступ к обучающим видео и записям лекций." }),
        /* @__PURE__ */ jsxs(Button, { onClick: handleLoginRedirect, size: "lg", className: "w-full", children: [
          /* @__PURE__ */ jsx(LogIn, { className: "w-5 h-5 mr-2" }),
          "Войти или зарегистрироваться"
        ] })
      ] }) }) }) })
    ] });
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "min-h-screen bg-background",
      onContextMenu: handleContextMenu,
      children: [
        /* @__PURE__ */ jsx(
          PageMeta,
          {
            title: isEn ? "Video Library — Prof. Tarusin D.I." : "Видеотека — проф. Тарусин Д.И.",
            description: isEn ? "Educational video library by Prof. Tarusin D.I. on pediatric urology-andrology: lectures, surgical techniques, and clinical case discussions." : "Видеотека профессора Тарусина Д.И. по детской урологии-андрологии: лекции, хирургические методики и разбор клинических случаев.",
            path: "/videos"
          }
        ),
        /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-12 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/",
              className: "inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
                "На главную"
              ]
            }
          ),
          /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-bold mb-4", children: "Видео" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-primary-foreground/80 max-w-2xl", children: "Обучающие видео и записи лекций" })
        ] }) }),
        /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-12 md:py-16", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-8 border border-destructive rounded-lg p-4 text-sm text-muted-foreground leading-relaxed", children: "Изображения и видео, приведенные во всех разделах сайта не являются порнографическими изображениями, так как приводятся только в научно-образовательных и клинических целях. Материалы не предназначены для возбуждения сексуального интереса и не являются «информацией порнографического характера» в смысле п. 8 ст. 2 Федерального закона № 436‑ФЗ от 29.12.2010 г. и Постановления ВС РФ от 15.12.2022 г. Изображения и видео, приведенные во всех разделах сайта не являются порнографическими изображениями, так как приводятся только в научно-образовательных и клинических целях. Материалы не предназначены для возбуждения сексуального интереса и не являются «информацией порнографического характера» в смысле п. 8 ст. 2 Федерального закона № 436‑ФЗ от 29.12.2010 г. и Постановления ВС РФ от 15.12.2022 г. Нажимая на кнопку просмотра Вы подтверждаете свое совершеннолетие (18+). Нажимая на кнопку просмотра Вы делаете это на свой страх и риск. Все — даже обезличенные материалы, опубликованные на сайте в виде историй болезни, кейсов, фрагментов презентаций, видеофайлы, изображения опубликованы на основании универсального информированного согласия, упоминающего возможность использования материалов в научных, аналитических, учебных, образовательных, просветительских целях. Профессор не несет ответственности за Ваши эмоции, переживания, моральную травматизацию и неограниченный круг возможных последствий, наступление которых возможно при просмотре материалов, представленных на сайте. Все — даже обезличенные материалы, опубликованные на сайте в виде историй болезни, кейсов, фрагментов презентаций, видеофайлы, изображения опубликованы на основании универсального информированного согласия, упоминающего возможность использования материалов в научных, аналитических, учебных, образовательных, просветительских целях. Профессор не несет ответственности за Ваши эмоции, переживания, моральную травматизацию и неограниченный круг возможных последствий, наступление которых возможно при просмотре материалов, представленных на сайте." }),
          /* @__PURE__ */ jsx("div", { className: "mb-12", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Video, { className: "w-6 h-6 text-primary" }) }),
              /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: "Все видео" })
            ] }),
            authLoading ? /* @__PURE__ */ jsxs(Button, { disabled: true, children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
              "Загрузка..."
            ] }) : isAdmin ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Shield, { className: "w-4 h-4 text-primary" }),
                "Администратор"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "file",
                    accept: "video/*",
                    onChange: handleUpload,
                    className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
                    disabled: uploading
                  }
                ),
                /* @__PURE__ */ jsx(Button, { disabled: uploading, children: uploading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                  "Загрузка..."
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 mr-2" }),
                  "Загрузить видео"
                ] }) })
              ] })
            ] }) : null
          ] }) }),
          selectedVideo && /* @__PURE__ */ jsx("div", { className: "mb-12", onContextMenu: handleContextMenu, children: /* @__PURE__ */ jsx(Card, { className: "overflow-hidden", children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx(
            "video",
            {
              src: selectedVideo,
              controls: true,
              autoPlay: true,
              controlsList: "nodownload",
              onContextMenu: handleContextMenu,
              className: "w-full aspect-video bg-black",
              style: { pointerEvents: "auto" },
              children: "Ваш браузер не поддерживает видео."
            }
          ) }) }) }),
          loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) }) : videos.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-20", children: [
            /* @__PURE__ */ jsx(Video, { className: "w-16 h-16 mx-auto text-muted-foreground mb-4" }),
            /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground", children: "Видео пока не загружены" }),
            isAdmin && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "Нажмите «Загрузить видео» чтобы добавить первое видео" })
          ] }) : /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-6", children: videos.map((video) => /* @__PURE__ */ jsxs(
            Card,
            {
              className: "group overflow-hidden hover:shadow-lg transition-shadow",
              onContextMenu: handleContextMenu,
              children: [
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "aspect-video bg-muted relative cursor-pointer",
                    onClick: () => setSelectedVideo(video.url),
                    children: [
                      /* @__PURE__ */ jsx(
                        "video",
                        {
                          src: video.url,
                          className: "w-full h-full object-cover",
                          preload: "metadata",
                          onContextMenu: handleContextMenu
                        }
                      ),
                      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-accent flex items-center justify-center", children: /* @__PURE__ */ jsx(Play, { className: "w-8 h-8 text-accent-foreground" }) }) })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground truncate flex-1", children: video.name.replace(/^\d+-/, "").replace(/_/g, " ") }),
                  isAdmin && /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "text-muted-foreground hover:text-destructive",
                      onClick: (e) => {
                        e.stopPropagation();
                        handleDelete(video.name);
                      },
                      children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                    }
                  )
                ] }) })
              ]
            },
            video.name
          )) })
        ] })
      ]
    }
  );
};
export {
  Videos as default
};
