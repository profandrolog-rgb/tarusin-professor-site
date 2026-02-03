import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ChevronUp, ChevronDown, User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

interface TeamMemberCardProps {
  member: TeamMember;
  isAdmin: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function TeamMemberCard({
  member,
  isAdmin,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: TeamMemberCardProps) {
  const photoUrl = member.photo_path
    ? supabase.storage.from("team-photos").getPublicUrl(member.photo_path).data.publicUrl
    : null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div>
      {!isFirst && <Separator className="my-6" />}
      
      <div className="flex flex-col md:flex-row gap-6 py-6">
        {/* Photo */}
        <div className="flex-shrink-0">
          <Avatar className="w-48 h-56 md:w-56 md:h-64 lg:w-64 lg:h-72 rounded-xl">
            <AvatarImage src={photoUrl || undefined} alt={member.full_name} className="object-cover object-top rounded-xl" />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary rounded-xl">
              {photoUrl ? getInitials(member.full_name) : <User className="w-12 h-12" />}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {member.full_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Стаж: {member.experience_years} {getYearWord(member.experience_years)}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {member.specialties.map((specialty, idx) => (
                <Badge key={idx} variant="secondary">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          {/* Mission */}
          <div>
            <h4 className="text-sm font-medium text-primary mb-1">Миссия</h4>
            <p className="text-sm text-foreground">{member.mission}</p>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-primary mb-1">Описание</h4>
            <p className="text-sm text-muted-foreground">{member.description}</p>
          </div>

          {/* Conditions */}
          <div>
            <h4 className="text-sm font-medium text-primary mb-1">С чем принимает</h4>
            <p className="text-sm text-muted-foreground">{member.conditions}</p>
          </div>

          {/* Professor's opinion */}
          <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
            <h4 className="text-sm font-medium text-primary mb-1">Мнение профессора</h4>
            <p className="text-sm text-foreground italic">"{member.professor_opinion}"</p>
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex items-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-1" />
                Редактировать
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Удалить
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить специалиста?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие нельзя отменить. Специалист будет удалён вместе с фото.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Удалить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMoveUp}
                  disabled={isFirst}
                  title="Переместить вверх"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMoveDown}
                  disabled={isLast}
                  title="Переместить вниз"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getYearWord(years: number): string {
  const lastTwo = years % 100;
  const lastOne = years % 10;
  
  if (lastTwo >= 11 && lastTwo <= 14) return "лет";
  if (lastOne === 1) return "год";
  if (lastOne >= 2 && lastOne <= 4) return "года";
  return "лет";
}
