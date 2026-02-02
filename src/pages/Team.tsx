import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import { TeamMemberForm } from "@/components/team/TeamMemberForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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

export default function Team() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const member = members.find((m) => m.id === id);
      if (member?.photo_path) {
        await supabase.storage.from("team-photos").remove([member.photo_path]);
      }
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: "Специалист удалён" });
    },
    onError: () => {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
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
    },
  });

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMember(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {isAdmin && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            К панели администратора
          </Link>
        )}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Команда профессора
            </h1>
            <p className="text-muted-foreground mt-2">
              Профессионалы, с которыми я работаю
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Добавить специалиста
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Загрузка...
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Специалисты пока не добавлены
          </div>
        ) : (
          <div className="space-y-0">
            {members.map((member, index) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                isAdmin={isAdmin}
                isFirst={index === 0}
                isLast={index === members.length - 1}
                onEdit={() => handleEdit(member)}
                onDelete={() => deleteMutation.mutate(member.id)}
                onMoveUp={() => moveMutation.mutate({ id: member.id, direction: "up" })}
                onMoveDown={() => moveMutation.mutate({ id: member.id, direction: "down" })}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Редактировать специалиста" : "Добавить специалиста"}
            </DialogTitle>
          </DialogHeader>
          <TeamMemberForm
            member={editingMember}
            onSuccess={handleCloseForm}
            nextSortOrder={members.length > 0 ? Math.max(...members.map((m) => m.sort_order)) + 1 : 0}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
