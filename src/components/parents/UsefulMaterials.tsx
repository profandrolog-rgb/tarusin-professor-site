import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Video, Headphones, ExternalLink, Loader2, FileText, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { proxyImage } from "@/lib/proxyImage";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { type ParentsMaterial, resolveMaterialPreview, pagesLabel } from "@/lib/parentsMaterialsBucket";

const UsefulMaterials = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [items, setItems] = useState<ParentsMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("parents_materials" as any)
        .select("*")
        .eq("is_published", true)
        .order("kind", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) {
        console.warn("[UsefulMaterials] load error:", error.message);
      }
      setItems((data ?? []) as unknown as ParentsMaterial[]);
      setLoading(false);
    })();
  }, []);

  const pickTitle = (m: ParentsMaterial) => (isEn && m.title_en) ? m.title_en : m.title;
  const pickDesc = (m: ParentsMaterial) => (isEn && m.description_en) ? m.description_en : (m.description || "");

  const articles = items.filter((i) => i.kind === "article");
  const videos = items.filter((i) => i.kind === "video");
  const podcasts = items.filter((i) => i.kind === "podcast");
  const handouts = items.filter((i) => i.kind === "handout");

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      {/* Articles */}
      {articles.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{isEn ? "Articles" : "Статьи"}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => {
              const preview = resolveMaterialPreview(article);
              return (
                <Card
                  key={article.id}
                  className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => window.open(article.url, "_blank")}
                >
                  <div className="relative overflow-hidden">
                    <AspectRatio ratio={16 / 10}>
                      {preview ? (
                        <img
                          src={proxyImage(preview)}
                          alt={pickTitle(article)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <BookOpen className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      {article.source && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-background/90 backdrop-blur-sm text-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                            {article.source}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-semibold text-base leading-snug line-clamp-2">
                          {article.emoji ? `${article.emoji} ` : ""}{pickTitle(article)}
                        </h3>
                      </div>
                    </AspectRatio>
                  </div>
                  <CardContent className="p-4">
                    {pickDesc(article) && (
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-3">{pickDesc(article)}</p>
                    )}
                    <div className="flex items-center text-primary text-sm font-medium group-hover:underline">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      {isEn ? "Read article" : "Читать статью"}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Video className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{isEn ? "Videos for Parents" : "Видео для родителей"}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {videos.map((video) => {
              const preview = resolveMaterialPreview(video);
              return (
                <Card key={video.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {preview ? (
                      <img
                        src={proxyImage(preview)}
                        alt={pickTitle(video)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                        <Video className="w-8 h-8 text-accent-foreground" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{pickTitle(video)}</h3>
                    {pickDesc(video) && (
                      <p className="text-muted-foreground mb-4">{pickDesc(video)}</p>
                    )}
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => window.open(video.url, "_blank")}>
                      <Video className="w-4 h-4 mr-2" />
                      {isEn ? "Watch video" : "Смотреть видео"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Podcasts */}
      {podcasts.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <Headphones className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{isEn ? "Podcasts" : "Подкасты"}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {podcasts.map((podcast) => (
              <Card key={podcast.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Headphones className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      {podcast.source && <div className="text-sm text-muted-foreground mb-1">{podcast.source}</div>}
                      <h3 className="text-lg font-semibold text-foreground mb-2">{pickTitle(podcast)}</h3>
                      {pickDesc(podcast) && (
                        <p className="text-muted-foreground text-sm mb-4">{pickDesc(podcast)}</p>
                      )}
                      <Button variant="outline" onClick={() => window.open(podcast.url, "_blank")}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {isEn ? "Listen" : "Слушать"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          {isEn ? "Materials will appear here soon." : "Материалы скоро появятся."}
        </div>
      )}
    </div>
  );
};

export default UsefulMaterials;
