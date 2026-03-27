import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Comment {
  id: string;
  author_name: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  user_id: string;
}

interface ResearchCommentsProps {
  articleId: string;
  comments: Comment[];
  onCommentChange: () => void;
}

const ResearchComments = ({ articleId, comments, onCommentChange }: ResearchCommentsProps) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const visibleComments = comments.filter(
    (c) => c.is_approved || isAdmin || c.user_id === user?.id
  );

  const handleSubmit = async () => {
    if (!user || !text.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("research_article_comments").insert({
        article_id: articleId,
        user_id: user.id,
        author_name: user.email?.split("@")[0] || "Пользователь",
        author_email: user.email || "",
        content: text.trim(),
      });
      if (error) throw error;
      setText("");
      toast({ title: "Комментарий отправлен на модерацию" });
      onCommentChange();
    } catch {
      toast({ title: "Ошибка отправки", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    await supabase.from("research_article_comments").update({ is_approved: true }).eq("id", id);
    onCommentChange();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("research_article_comments").delete().eq("id", id);
    onCommentChange();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <MessageCircle className="w-4 h-4" />
        Комментарии ({visibleComments.filter((c) => c.is_approved).length})
      </h3>

      {visibleComments.map((c) => (
        <div
          key={c.id}
          className={`p-3 rounded-lg border ${!c.is_approved ? "border-amber-300 bg-amber-50/50" : "border-border bg-muted/30"}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">{c.author_name}</span>
            <div className="flex items-center gap-2">
              {!c.is_approved && (
                <span className="text-xs text-amber-600">На модерации</span>
              )}
              <span className="text-xs text-muted-foreground">
                {format(new Date(c.created_at), "d MMM yyyy", { locale: ru })}
              </span>
              {isAdmin && (
                <div className="flex gap-1">
                  {!c.is_approved && (
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => handleApprove(c.id)}>
                      ✓
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-destructive" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{c.content}</p>
        </div>
      ))}

      {user ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Написать комментарий..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[60px]"
          />
          <Button size="sm" onClick={handleSubmit} disabled={loading || !text.trim()}>
            Отправить
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <a href="/auth" className="text-primary hover:underline">Войдите</a>, чтобы оставить комментарий
        </p>
      )}
    </div>
  );
};

export default ResearchComments;
