import { supabase } from "@/integrations/supabase/client";
import { getCategoryLabel, getAgeGroupLabel, AGE_GROUPS } from "./ResearchCategories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ResearchPostCardProps {
  article: {
    id: string;
    title: string;
    excerpt: string | null;
    image_path: string | null;
    category: string;
    created_at: string;
    is_published: boolean;
  };
  commentCount: number;
  reactionCount: number;
  viewMode: "grid" | "feed";
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ResearchPostCard = ({ article, commentCount, reactionCount, viewMode, onClick, onEdit, onDelete }: ResearchPostCardProps) => {
  const imageUrl = article.image_path
    ? supabase.storage.from("research-attachments").getPublicUrl(article.image_path).data.publicUrl
    : null;

  if (viewMode === "grid") {
    return (
      <div
        onClick={onClick}
        className="group cursor-pointer rounded-xl overflow-hidden border bg-card hover:shadow-lg transition-all"
      >
        <div className="bg-muted overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt={article.title} className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-primary/10 to-accent/10">
              📄
            </div>
          )}
        </div>
        <div className="p-3 space-y-1.5">
          <Badge variant="secondary" className="text-xs">{getCategoryLabel(article.category)}</Badge>
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{article.title}</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{format(new Date(article.created_at), "d MMM yyyy", { locale: ru })}</span>
            {reactionCount > 0 && <span>👍 {reactionCount}</span>}
            {commentCount > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageCircle className="w-3 h-3" /> {commentCount}
              </span>
            )}
          </div>
          {!article.is_published && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Черновик</Badge>
          )}
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Pencil className="w-3 h-3 mr-1" /> Ред.
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="w-3 h-3 mr-1" /> Удалить
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Feed mode
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border bg-card hover:shadow-md transition-all overflow-hidden"
    >
      <div className="flex gap-4 p-4">
        {imageUrl && (
          <div className="w-24 md:w-32 rounded-lg overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
            <img src={imageUrl} alt={article.title} className="w-full h-auto object-contain" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{getCategoryLabel(article.category)}</Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(article.created_at), "d MMM yyyy", { locale: ru })}
            </span>
            {!article.is_published && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Черновик</Badge>
            )}
          </div>
          <h3 className="text-base font-semibold text-foreground line-clamp-2">{article.title}</h3>
          {article.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {reactionCount > 0 && <span>👍 {reactionCount}</span>}
            {commentCount > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageCircle className="w-3 h-3" /> {commentCount}
              </span>
            )}
            {onEdit && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs ml-auto" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Pencil className="w-3 h-3 mr-1" /> Ред.
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchPostCard;
