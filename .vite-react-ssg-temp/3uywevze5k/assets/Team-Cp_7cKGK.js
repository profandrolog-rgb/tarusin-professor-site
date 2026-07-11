import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { n as cn, s as supabase, o as Separator, b as Badge, B as Button, e as useToast, L as Label, I as Input, T as Textarea, u as useAuth, P as PageMeta, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle } from "../main.mjs";
import { User, Pencil, Trash2, ChevronUp, ChevronDown, Upload, X, Save, ArrowLeft, Plus } from "lucide-react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-B9yOFgqE.js";
import { u as useAutoSave } from "./useAutoSave-DcIiKxWj.js";
import { toast } from "sonner";
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
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
import "react-helmet-async";
import "@radix-ui/react-alert-dialog";
const Avatar = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AvatarPrimitive.Root,
  {
    ref,
    className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
    ...props
  }
));
Avatar.displayName = AvatarPrimitive.Root.displayName;
const AvatarImage = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(AvatarPrimitive.Image, { ref, className: cn("aspect-square h-full w-full", className), ...props }));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;
const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AvatarPrimitive.Fallback,
  {
    ref,
    className: cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className),
    ...props
  }
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;
function TeamMemberCard({
  member,
  isAdmin,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown
}) {
  const photoUrl = member.photo_path ? supabase.storage.from("team-photos").getPublicUrl(member.photo_path).data.publicUrl : null;
  const getInitials = (name) => {
    return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    !isFirst && /* @__PURE__ */ jsx(Separator, { className: "my-6" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-6 py-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxs(Avatar, { className: "w-48 h-56 md:w-56 md:h-64 lg:w-64 lg:h-72 rounded-xl", children: [
        /* @__PURE__ */ jsx(AvatarImage, { src: photoUrl || void 0, alt: member.full_name, className: "object-cover object-top rounded-xl" }),
        /* @__PURE__ */ jsx(AvatarFallback, { className: "text-2xl bg-primary/10 text-primary rounded-xl", children: photoUrl ? getInitials(member.full_name) : /* @__PURE__ */ jsx(User, { className: "w-12 h-12" }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-foreground", children: member.full_name }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
              "Стаж: ",
              member.experience_years,
              " ",
              getYearWord(member.experience_years)
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: member.specialties.map((specialty, idx) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: specialty }, idx)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium text-primary mb-1", children: "Миссия" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground", children: member.mission })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium text-primary mb-1", children: "Описание" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: member.description })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium text-primary mb-1", children: "С чем принимает" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: member.conditions })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-muted/50 p-4 rounded-lg border-l-4 border-primary", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium text-primary mb-1", children: "Мнение профессора" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-foreground italic", children: [
            '"',
            member.professor_opinion,
            '"'
          ] })
        ] }),
        isAdmin && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-2", children: [
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: onEdit, children: [
            /* @__PURE__ */ jsx(Pencil, { className: "w-4 h-4 mr-1" }),
            "Редактировать"
          ] }),
          /* @__PURE__ */ jsxs(AlertDialog, { children: [
            /* @__PURE__ */ jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", className: "text-destructive hover:text-destructive", children: [
              /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4 mr-1" }),
              "Удалить"
            ] }) }),
            /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
              /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
                /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Удалить специалиста?" }),
                /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Это действие нельзя отменить. Специалист будет удалён вместе с фото." })
              ] }),
              /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
                /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Отмена" }),
                /* @__PURE__ */ jsx(AlertDialogAction, { onClick: onDelete, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: "Удалить" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 ml-auto", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: onMoveUp,
                disabled: isFirst,
                title: "Переместить вверх",
                children: /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: onMoveDown,
                disabled: isLast,
                title: "Переместить вниз",
                children: /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" })
              }
            )
          ] })
        ] })
      ] })
    ] })
  ] });
}
function getYearWord(years) {
  const lastTwo = years % 100;
  const lastOne = years % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "лет";
  if (lastOne === 1) return "год";
  if (lastOne >= 2 && lastOne <= 4) return "года";
  return "лет";
}
const LIMITS = {
  mission: 300,
  description: 1e3,
  conditions: 600,
  professor_opinion: 600
};
function TeamMemberForm({ member, onSuccess, nextSortOrder }) {
  var _a, _b, _c;
  const { toast: toast$1 } = useToast();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState((member == null ? void 0 : member.full_name) || "");
  const [experienceYears, setExperienceYears] = useState(((_a = member == null ? void 0 : member.experience_years) == null ? void 0 : _a.toString()) || "");
  const [specialty1, setSpecialty1] = useState(((_b = member == null ? void 0 : member.specialties) == null ? void 0 : _b[0]) || "");
  const [specialty2, setSpecialty2] = useState(((_c = member == null ? void 0 : member.specialties) == null ? void 0 : _c[1]) || "");
  const [mission, setMission] = useState((member == null ? void 0 : member.mission) || "");
  const [description, setDescription] = useState((member == null ? void 0 : member.description) || "");
  const [conditions, setConditions] = useState((member == null ? void 0 : member.conditions) || "");
  const [professorOpinion, setProfessorOpinion] = useState((member == null ? void 0 : member.professor_opinion) || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(
    (member == null ? void 0 : member.photo_path) ? supabase.storage.from("team-photos").getPublicUrl(member.photo_path).data.publicUrl : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const autoSaveKey = member ? `team_edit_${member.id}` : "team_new";
  const formData = useMemo(() => ({
    fullName,
    experienceYears,
    specialty1,
    specialty2,
    mission,
    description,
    conditions,
    professorOpinion
  }), [fullName, experienceYears, specialty1, specialty2, mission, description, conditions, professorOpinion]);
  const { save, loadDraft, clearDraft } = useAutoSave({ key: autoSaveKey, data: formData });
  useEffect(() => {
    if (draftLoaded) return;
    setDraftLoaded(true);
    const draft = loadDraft();
    if (draft) {
      toast("Найден черновик", {
        description: "Восстановить несохранённые изменения?",
        action: { label: "Восстановить", onClick: () => {
          if (draft.fullName) setFullName(draft.fullName);
          if (draft.experienceYears) setExperienceYears(draft.experienceYears);
          if (draft.specialty1) setSpecialty1(draft.specialty1);
          if (draft.specialty2) setSpecialty2(draft.specialty2);
          if (draft.mission) setMission(draft.mission);
          if (draft.description) setDescription(draft.description);
          if (draft.conditions) setConditions(draft.conditions);
          if (draft.professorOpinion) setProfessorOpinion(draft.professorOpinion);
          toast.success("Черновик восстановлен");
        } },
        cancel: { label: "Отклонить", onClick: () => clearDraft() },
        duration: 1e4
      });
    }
  }, []);
  const handlePhotoChange = (e) => {
    var _a2;
    const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };
  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !experienceYears || !specialty1.trim() || !mission.trim() || !description.trim() || !conditions.trim() || !professorOpinion.trim()) {
      toast$1({ title: "Заполните все обязательные поля", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      let photoPath = (member == null ? void 0 : member.photo_path) || null;
      if (photoFile) {
        const fileExt = photoFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("team-photos").upload(fileName, photoFile);
        if (uploadError) throw uploadError;
        if (member == null ? void 0 : member.photo_path) {
          await supabase.storage.from("team-photos").remove([member.photo_path]);
        }
        photoPath = fileName;
      }
      const specialties = [specialty1.trim()];
      if (specialty2.trim()) specialties.push(specialty2.trim());
      const memberData = {
        full_name: fullName.trim(),
        experience_years: parseInt(experienceYears),
        specialties,
        mission: mission.trim(),
        description: description.trim(),
        conditions: conditions.trim(),
        professor_opinion: professorOpinion.trim(),
        photo_path: photoPath,
        sort_order: (member == null ? void 0 : member.sort_order) ?? nextSortOrder
      };
      if (member) {
        const { error } = await supabase.from("team_members").update(memberData).eq("id", member.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("team_members").insert(memberData);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast$1({ title: member ? "Специалист обновлён" : "Специалист добавлен" });
      clearDraft();
      onSuccess();
    } catch (error) {
      console.error("Error saving team member:", error);
      toast$1({ title: "Ошибка сохранения", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { children: "Фото" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxs(Avatar, { className: "w-20 h-20", children: [
          /* @__PURE__ */ jsx(AvatarImage, { src: photoPreview || void 0, className: "object-cover" }),
          /* @__PURE__ */ jsx(AvatarFallback, { children: /* @__PURE__ */ jsx(Upload, { className: "w-6 h-6 text-muted-foreground" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "file",
              accept: "image/*",
              onChange: handlePhotoChange,
              className: "max-w-xs"
            }
          ),
          photoPreview && /* @__PURE__ */ jsxs(Button, { type: "button", variant: "ghost", size: "sm", onClick: clearPhoto, className: "w-fit", children: [
            /* @__PURE__ */ jsx(X, { className: "w-4 h-4 mr-1" }),
            "Удалить фото"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "fullName", children: "Фамилия Имя Отчество *" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "fullName",
          value: fullName,
          onChange: (e) => setFullName(e.target.value),
          placeholder: "Иванов Иван Иванович",
          required: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "experience", children: "Общий стаж (лет) *" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "experience",
          type: "number",
          min: "0",
          value: experienceYears,
          onChange: (e) => setExperienceYears(e.target.value),
          placeholder: "15",
          required: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "specialty1", children: "Специальность 1 *" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "specialty1",
            value: specialty1,
            onChange: (e) => setSpecialty1(e.target.value),
            placeholder: "Психолог",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "specialty2", children: "Специальность 2" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "specialty2",
            value: specialty2,
            onChange: (e) => setSpecialty2(e.target.value),
            placeholder: "Психотерапевт"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs(Label, { htmlFor: "mission", children: [
        "Миссия * (",
        mission.length,
        "/",
        LIMITS.mission,
        ")"
      ] }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          id: "mission",
          value: mission,
          onChange: (e) => setMission(e.target.value.slice(0, LIMITS.mission)),
          placeholder: "Краткое описание миссии специалиста",
          rows: 2,
          required: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs(Label, { htmlFor: "description", children: [
        "Описание * (",
        description.length,
        "/",
        LIMITS.description,
        ")"
      ] }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          id: "description",
          value: description,
          onChange: (e) => setDescription(e.target.value.slice(0, LIMITS.description)),
          placeholder: "Чем занимается, сильные стороны",
          rows: 4,
          required: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs(Label, { htmlFor: "conditions", children: [
        "С чем принимает * (",
        conditions.length,
        "/",
        LIMITS.conditions,
        ")"
      ] }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          id: "conditions",
          value: conditions,
          onChange: (e) => setConditions(e.target.value.slice(0, LIMITS.conditions)),
          placeholder: "С какими состояниями работает",
          rows: 3,
          required: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs(Label, { htmlFor: "professorOpinion", children: [
        "Личное мнение профессора * (",
        professorOpinion.length,
        "/",
        LIMITS.professor_opinion,
        ")"
      ] }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          id: "professorOpinion",
          value: professorOpinion,
          onChange: (e) => setProfessorOpinion(e.target.value.slice(0, LIMITS.professor_opinion)),
          placeholder: "Ваше мнение о специалисте",
          rows: 3,
          required: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-4", children: [
      /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? "Сохранение..." : member ? "Сохранить" : "Добавить" }),
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "ghost", size: "sm", onClick: save, className: "ml-auto gap-1 text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
        " Черновик"
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Автосохранение каждые 3 минуты" })
  ] });
}
function Team() {
  const { isAdmin } = useAuth();
  const { toast: toast2 } = useToast();
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    }
  });
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const member = members.find((m) => m.id === id);
      if (member == null ? void 0 : member.photo_path) await supabase.storage.from("team-photos").remove([member.photo_path]);
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast2({ title: isEn ? "Specialist deleted" : "Специалист удалён" });
    },
    onError: () => {
      toast2({ title: isEn ? "Delete error" : "Ошибка удаления", variant: "destructive" });
    }
  });
  const moveMutation = useMutation({
    mutationFn: async ({ id, direction }) => {
      const currentIndex = members.findIndex((m) => m.id === id);
      const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= members.length) return;
      const current = members[currentIndex];
      const swap = members[swapIndex];
      await supabase.from("team_members").update({ sort_order: swap.sort_order }).eq("id", current.id);
      await supabase.from("team_members").update({ sort_order: current.sort_order }).eq("id", swap.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    }
  });
  const handleEdit = (member) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMember(null);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: isEn ? "Professor Tarusin's Team" : "Команда профессора Тарусина Д.И.",
        description: isEn ? "Doctors and specialists on Professor Tarusin's team — andrologists, urologists, and surgeons with extensive experience." : "Врачи и специалисты команды профессора Тарусина — андрологи, урологи и хирурги с многолетним опытом.",
        path: "/team"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-12", children: [
      isAdmin && /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        isEn ? "Admin Panel" : "К панели администратора"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-4xl font-bold text-foreground", children: isEn ? "My Team" : "Моя команда" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2", children: isEn ? "Professionals I work with. Absolute trust. Crystal-clear honesty" : "Профессионалы, с которыми я работаю. Абсолютное доверие. Кристальная честность" })
        ] }),
        isAdmin && /* @__PURE__ */ jsxs(Button, { onClick: () => setIsFormOpen(true), className: "gap-2", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          isEn ? "Add Specialist" : "Добавить специалиста"
        ] })
      ] }),
      isLoading ? /* @__PURE__ */ jsx("div", { className: "text-center py-12 text-muted-foreground", children: isEn ? "Loading..." : "Загрузка..." }) : members.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-12 text-muted-foreground", children: isEn ? "No specialists added yet" : "Специалисты пока не добавлены" }) : /* @__PURE__ */ jsx("div", { className: "space-y-0", children: members.map((member, index) => /* @__PURE__ */ jsx(
        TeamMemberCard,
        {
          member,
          isAdmin,
          isFirst: index === 0,
          isLast: index === members.length - 1,
          onEdit: () => handleEdit(member),
          onDelete: () => deleteMutation.mutate(member.id),
          onMoveUp: () => moveMutation.mutate({ id: member.id, direction: "up" }),
          onMoveDown: () => moveMutation.mutate({ id: member.id, direction: "down" })
        },
        member.id
      )) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: isFormOpen, onOpenChange: handleCloseForm, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: editingMember ? isEn ? "Edit Specialist" : "Редактировать специалиста" : isEn ? "Add Specialist" : "Добавить специалиста" }) }),
      /* @__PURE__ */ jsx(TeamMemberForm, { member: editingMember, onSuccess: handleCloseForm, nextSortOrder: members.length > 0 ? Math.max(...members.map((m) => m.sort_order)) + 1 : 0 })
    ] }) })
  ] });
}
export {
  Team as default
};
