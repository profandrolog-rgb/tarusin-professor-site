import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCategoryLabel } from "./ResearchCategories";
import ResearchReactions from "./ResearchReactions";
import ResearchComments from "./ResearchComments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Image as ImageIcon, Download } from "lucide-react";
import { format } from "date-fns";
import SocialBar from "@/components/SocialLinks";
import { ru } from "date-fns/locale";
import DOMPurify from "dompurify";

interface ResearchPostDetailProps {
  articleId: string;
  onBack: () => void;
}

const ResearchPostDetail = ({ articleId, onBack }: ResearchPostDetailProps) => {
  const { data: article } = useQuery({
    queryKey: ["research-article", articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research_articles")
        .select("*")
        .eq("id", articleId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: attachments = [] } = useQuery({
    queryKey: ["research-attachments", articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research_article_attachments")
        .select("*")
        .eq("article_id", articleId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: reactions = [], refetch: refetchReactions } = useQuery({
    queryKey: ["research-reactions", articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research_article_reactions")
        .select("*")
        .eq("article_id", articleId);
      if (error) throw error;
      return data;
    },
  });

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["research-comments", articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research_article_comments")
        .select("*")
        .eq("article_id", articleId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (!article) return null;

  const imageUrl = article.image_path
    ? supabase.storage.from("research-attachments").getPublicUrl(article.image_path).data.publicUrl
    : null;

  const imageAttachments = attachments.filter((a) => a.file_type === "image");
  const fileAttachments = attachments.filter((a) => a.file_type !== "image");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Назад к ленте
      </Button>

      {imageUrl && (
        <div className="rounded-xl overflow-hidden border bg-muted flex items-center justify-center">
          <img src={imageUrl} alt={article.title} className="w-full h-auto object-contain" />
        </div>
      )}

      {/* Social media links */}
      <SocialBar />

      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">{getCategoryLabel(article.category)}</Badge>
          <span className="text-sm text-muted-foreground">
            {format(new Date(article.created_at), "d MMMM yyyy", { locale: ru })}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{article.title}</h1>
        {article.excerpt && (
          <p className="text-lg text-muted-foreground italic">{article.excerpt}</p>
        )}
      </div>

      <div
        className="prose prose-sm max-w-none text-foreground"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
      />

      {/* Image gallery */}
      {imageAttachments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {imageAttachments.map((att) => {
            const url = supabase.storage.from("research-attachments").getPublicUrl(att.file_path).data.publicUrl;
            return (
              <div key={att.id} className="rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                <img src={url} alt={att.file_name} className="w-full h-auto object-contain" />
              </div>
            );
          })}
        </div>
      )}

      {/* File attachments */}
      {fileAttachments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Вложения</h3>
          {fileAttachments.map((att) => {
            const url = supabase.storage.from("research-attachments").getPublicUrl(att.file_path).data.publicUrl;
            return (
              <a
                key={att.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                {att.file_type === "pdf" ? <FileText className="w-5 h-5 text-red-500" /> : <ImageIcon className="w-5 h-5 text-blue-500" />}
                <span className="text-sm text-foreground flex-1 truncate">{att.file_name}</span>
                <Download className="w-4 h-4 text-muted-foreground" />
              </a>
            );
          })}
        </div>
      )}

      <ResearchReactions articleId={articleId} reactions={reactions} onReactionChange={() => refetchReactions()} />

      <div className="border-t pt-6">
        <ResearchComments articleId={articleId} comments={comments} onCommentChange={() => refetchComments()} />
      </div>
    </div>
  );
};

export default ResearchPostDetail;
