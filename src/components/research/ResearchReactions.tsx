import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const REACTIONS = [
  { type: "like", emoji: "👍", label: "Нравится" },
  { type: "heart", emoji: "❤️", label: "Люблю" },
  { type: "fire", emoji: "🔥", label: "Огонь" },
  { type: "clap", emoji: "👏", label: "Браво" },
  { type: "think", emoji: "🤔", label: "Интересно" },
  { type: "wow", emoji: "😮", label: "Ого" },
];

interface ResearchReactionsProps {
  articleId: string;
  reactions: { counts: { reaction_type: string; count: number }[]; myReaction: string | null };
  onReactionChange: () => void;
}

const ResearchReactions = ({ articleId, reactions, onReactionChange }: ResearchReactionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const userReaction = reactions.myReaction;

  const reactionCounts = REACTIONS.map((r) => ({
    ...r,
    count: Number(reactions.counts.find((rx) => rx.reaction_type === r.type)?.count || 0),
    isActive: userReaction === r.type,
  }));

  const handleReaction = async (type: string) => {
    if (!user) {
      toast({ title: "Войдите, чтобы оставить реакцию", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (userReaction === type) {
        await supabase
          .from("research_article_reactions")
          .delete()
          .eq("article_id", articleId)
          .eq("user_id", user.id);
      } else if (userReaction) {
        await supabase
          .from("research_article_reactions")
          .update({ reaction_type: type })
          .eq("article_id", articleId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("research_article_reactions")
          .insert({ article_id: articleId, user_id: user.id, reaction_type: type });
      }
      onReactionChange();
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {reactionCounts.map((r) => (
        <button
          key={r.type}
          disabled={loading}
          onClick={() => handleReaction(r.type)}
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all border",
            r.isActive
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-muted/50 border-transparent hover:bg-muted text-muted-foreground"
          )}
          title={r.label}
        >
          <span>{r.emoji}</span>
          {r.count > 0 && <span className="text-xs font-medium">{r.count}</span>}
        </button>
      ))}
    </div>
  );
};

export default ResearchReactions;
