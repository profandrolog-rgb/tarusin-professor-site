import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Upload, X, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast as sonnerToast } from "sonner";

// Character limits
const LIMITS = {
  mission: 300,
  description: 1000,
  conditions: 600,
  professor_opinion: 600,
};

interface TeamMember {
  id: string;
  full_name: string;
  experience_years: number;
  specialties: string[];
  mission: string;
  description: string;
  conditions: string;
  professor_opinion: string;
  photo_path: string | null;
  sort_order: number;
  is_published: boolean;
}

interface TeamMemberFormProps {
  member: TeamMember | null;
  onSuccess: () => void;
  nextSortOrder: number;
}

export function TeamMemberForm({ member, onSuccess, nextSortOrder }: TeamMemberFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [fullName, setFullName] = useState(member?.full_name || "");
  const [experienceYears, setExperienceYears] = useState(member?.experience_years?.toString() || "");
  const [specialty1, setSpecialty1] = useState(member?.specialties?.[0] || "");
  const [specialty2, setSpecialty2] = useState(member?.specialties?.[1] || "");
  const [mission, setMission] = useState(member?.mission || "");
  const [description, setDescription] = useState(member?.description || "");
  const [conditions, setConditions] = useState(member?.conditions || "");
  const [professorOpinion, setProfessorOpinion] = useState(member?.professor_opinion || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    member?.photo_path
      ? supabase.storage.from("team-photos").getPublicUrl(member.photo_path).data.publicUrl
      : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const autoSaveKey = member ? `team_edit_${member.id}` : "team_new";
  const formData = useMemo(() => ({
    fullName, experienceYears, specialty1, specialty2, mission, description, conditions, professorOpinion,
  }), [fullName, experienceYears, specialty1, specialty2, mission, description, conditions, professorOpinion]);

  const { save, loadDraft, clearDraft } = useAutoSave({ key: autoSaveKey, data: formData });

  useEffect(() => {
    if (draftLoaded) return;
    setDraftLoaded(true);
    const draft = loadDraft();
    if (draft) {
      sonnerToast("Найден черновик", {
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
          sonnerToast.success("Черновик восстановлен");
        }},
        cancel: { label: "Отклонить", onClick: () => clearDraft() },
        duration: 10000,
      });
    }
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim() || !experienceYears || !specialty1.trim() || !mission.trim() || 
        !description.trim() || !conditions.trim() || !professorOpinion.trim()) {
      toast({ title: "Заполните все обязательные поля", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      let photoPath = member?.photo_path || null;

      // Upload new photo if selected
      if (photoFile) {
        const fileExt = photoFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("team-photos")
          .upload(fileName, photoFile);
        
        if (uploadError) throw uploadError;

        // Delete old photo if exists
        if (member?.photo_path) {
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
        sort_order: member?.sort_order ?? nextSortOrder,
      };

      if (member) {
        const { error } = await supabase
          .from("team_members")
          .update(memberData)
          .eq("id", member.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("team_members")
          .insert(memberData);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: member ? "Специалист обновлён" : "Специалист добавлен" });
      onSuccess();
    } catch (error) {
      console.error("Error saving team member:", error);
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Photo */}
      <div className="space-y-2">
        <Label>Фото</Label>
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={photoPreview || undefined} className="object-cover" />
            <AvatarFallback>
              <Upload className="w-6 h-6 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="max-w-xs"
            />
            {photoPreview && (
              <Button type="button" variant="ghost" size="sm" onClick={clearPhoto} className="w-fit">
                <X className="w-4 h-4 mr-1" />
                Удалить фото
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Full name */}
      <div className="space-y-2">
        <Label htmlFor="fullName">Фамилия Имя Отчество *</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Иванов Иван Иванович"
          required
        />
      </div>

      {/* Experience */}
      <div className="space-y-2">
        <Label htmlFor="experience">Общий стаж (лет) *</Label>
        <Input
          id="experience"
          type="number"
          min="0"
          value={experienceYears}
          onChange={(e) => setExperienceYears(e.target.value)}
          placeholder="15"
          required
        />
      </div>

      {/* Specialties */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="specialty1">Специальность 1 *</Label>
          <Input
            id="specialty1"
            value={specialty1}
            onChange={(e) => setSpecialty1(e.target.value)}
            placeholder="Психолог"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialty2">Специальность 2</Label>
          <Input
            id="specialty2"
            value={specialty2}
            onChange={(e) => setSpecialty2(e.target.value)}
            placeholder="Психотерапевт"
          />
        </div>
      </div>

      {/* Mission */}
      <div className="space-y-2">
        <Label htmlFor="mission">
          Миссия * ({mission.length}/{LIMITS.mission})
        </Label>
        <Textarea
          id="mission"
          value={mission}
          onChange={(e) => setMission(e.target.value.slice(0, LIMITS.mission))}
          placeholder="Краткое описание миссии специалиста"
          rows={2}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Описание * ({description.length}/{LIMITS.description})
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, LIMITS.description))}
          placeholder="Чем занимается, сильные стороны"
          rows={4}
          required
        />
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        <Label htmlFor="conditions">
          С чем принимает * ({conditions.length}/{LIMITS.conditions})
        </Label>
        <Textarea
          id="conditions"
          value={conditions}
          onChange={(e) => setConditions(e.target.value.slice(0, LIMITS.conditions))}
          placeholder="С какими состояниями работает"
          rows={3}
          required
        />
      </div>

      {/* Professor opinion */}
      <div className="space-y-2">
        <Label htmlFor="professorOpinion">
          Личное мнение профессора * ({professorOpinion.length}/{LIMITS.professor_opinion})
        </Label>
        <Textarea
          id="professorOpinion"
          value={professorOpinion}
          onChange={(e) => setProfessorOpinion(e.target.value.slice(0, LIMITS.professor_opinion))}
          placeholder="Ваше мнение о специалисте"
          rows={3}
          required
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Сохранение..." : member ? "Сохранить" : "Добавить"}
        </Button>
      </div>
    </form>
  );
}
