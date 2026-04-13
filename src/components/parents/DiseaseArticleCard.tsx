import { useState } from "react";
import { Video, Headphones, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";

interface DiseaseArticle {
  id: string;
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
}

const getPublicUrl = (path: string) => {
  const { data } = supabase.storage.from("disease-media").getPublicUrl(path);
  return data.publicUrl;
};

const DiseaseArticleCard = ({ article }: DiseaseArticleCardProps) => {
  const [isArticleOpen, setIsArticleOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"video" | "audio" | "text">(
    article.video_path ? "video" : article.audio_path ? "audio" : "text"
  );

  const hasVideo = !!article.video_path;
  const hasAudio = !!article.audio_path;
  const hasText = !!article.article_content;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow select-none">
      <CardContent className="p-0">
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
          {hasText && (
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
          <h3 className="text-lg font-semibold text-foreground mb-2">{article.title}</h3>
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
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DiseaseArticleCard;
