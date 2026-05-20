import { useState } from "react";
import { Link } from "react-router-dom";
import { Video, Headphones, ChevronDown, ChevronUp, FileText, Pencil, Save, X, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RichTextEditor from "@/components/blog/RichTextEditor";

interface DiseaseArticle {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  video_path: string | null;
  audio_path: string | null;
  article_content: string | null;
  thumbnail_path: string | null;
  category: string;
}

interface DiseaseArticleCardProps {
  article: DiseaseArticle;
  isAdmin?: boolean;
  onArticleUpdated?: () => void;
}

const getPublicUrl = (path: string) => {
  const { data } = supabase.storage.from("disease-media").getPublicUrl(path);
  return data.publicUrl;
};

const DiseaseArticleCard = ({ article, isAdmin, onArticleUpdated }: DiseaseArticleCardProps) => {
  const [isArticleOpen, setIsArticleOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"video" | "audio" | "text">(
    article.video_path ? "video" : article.audio_path ? "audio" : "text"
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(article.title);
  const [editDescription, setEditDescription] = useState(article.description || "");
  const [editContent, setEditContent] = useState(article.article_content || "");
  const [saving, setSaving] = useState(false);

  const hasVideo = !!article.video_path;
  const hasAudio = !!article.audio_path;
  const hasText = !!article.article_content;

  const handleEdit = () => {
    setEditTitle(article.title);
    setEditDescription(article.description || "");
    setEditContent(article.article_content || "");
    setIsEditing(true);
    setIsArticleOpen(true);
    setActiveTab("text");
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("disease_articles")
      .update({
        title: editTitle,
        description: editDescription || null,
        article_content: editContent || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", article.id);

    setSaving(false);
    if (error) {
      toast.error("Ошибка сохранения: " + error.message);
    } else {
      toast.success("Статья сохранена");
      setIsEditing(false);
      onArticleUpdated?.();
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow select-none">
      <CardContent className="p-0">
        {/* Admin toolbar */}
        {isAdmin && (
          <div className="flex items-center justify-end gap-2 px-4 py-2 bg-muted/50 border-b">
            {isEditing ? (
              <>
                <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
                  <X className="w-4 h-4 mr-1" /> Отмена
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" /> {saving ? "Сохранение..." : "Сохранить"}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={handleEdit}>
                <Pencil className="w-4 h-4 mr-1" /> Править
              </Button>
            )}
          </div>
        )}

        {/* Tab buttons */}
        <div className="flex border-b bg-muted/30">
          {hasVideo && (
            <button
              onClick={() => setActiveTab("video")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "video"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Video className="w-4 h-4" />
              Смотреть
            </button>
          )}
          {hasAudio && (
            <button
              onClick={() => setActiveTab("audio")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "audio"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Headphones className="w-4 h-4" />
              Слушать
            </button>
          )}
          {(hasText || isEditing) && (
            <button
              onClick={() => setActiveTab("text")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "text"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <FileText className="w-4 h-4" />
              Читать
            </button>
          )}
        </div>

        <div className="p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Заголовок</label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Описание</label>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} />
              </div>
              {activeTab === "text" && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Текст статьи</label>
                  <RichTextEditor content={editContent} onChange={setEditContent} />
                </div>
              )}
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                <Link to={`/for-parents/${article.slug}/`} className="hover:text-primary transition-colors">
                  {article.title}
                </Link>
              </h3>
              {article.description && (
                <p className="text-muted-foreground text-sm mb-4">{article.description}</p>
              )}

              {/* Video player */}
              {activeTab === "video" && hasVideo && (
                <div
                  className="aspect-video bg-black rounded-lg overflow-hidden mb-4"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <video
                    controls
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture
                    className="w-full h-full"
                    src={getPublicUrl(article.video_path!)}
                    poster={article.thumbnail_path ? getPublicUrl(article.thumbnail_path) : undefined}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
              )}

              {/* Audio player */}
              {activeTab === "audio" && hasAudio && (
                <div className="mb-4">
                  <div className="bg-secondary rounded-lg p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Headphones className="w-6 h-6 text-primary" />
                    </div>
                    <audio
                      controls
                      controlsList="nodownload"
                      className="w-full"
                      src={getPublicUrl(article.audio_path!)}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </div>
                </div>
              )}

              {/* Article text - collapsible */}
              {activeTab === "text" && hasText && (
                <>
                  <Collapsible open={isArticleOpen} onOpenChange={setIsArticleOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full mb-2">
                        {isArticleOpen ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Свернуть статью
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Развернуть статью
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div
                        className="prose prose-sm max-w-none text-foreground bg-secondary/30 rounded-lg p-4 [&_img]:rounded-lg [&_img]:mx-auto [&_img]:max-w-full [&_table]:w-full [&_table]:border-collapse [&_th]:bg-muted [&_th]:p-2 [&_th]:border [&_th]:border-border [&_td]:p-2 [&_td]:border [&_td]:border-border"
                        dangerouslySetInnerHTML={{ __html: article.article_content! }}
                        onCopy={(e) => e.preventDefault()}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                  <Button asChild variant="secondary" className="w-full mt-2">
                    <Link to={`/for-parents/${article.slug}/`}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Открыть полную страницу
                    </Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DiseaseArticleCard;
