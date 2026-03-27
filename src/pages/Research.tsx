import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StickyBottomPanel from "@/components/StickyBottomPanel";
import PageMeta from "@/components/PageMeta";
import ResearchPostCard from "@/components/research/ResearchPostCard";
import ResearchPostDetail from "@/components/research/ResearchPostDetail";
import ResearchPostForm from "@/components/research/ResearchPostForm";
import RESEARCH_CATEGORIES, { getCategoryLabel, AGE_GROUPS } from "@/components/research/ResearchCategories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Grid3X3, List, Loader2 } from "lucide-react";

const Research = () => {
  const { isAdmin, isEditor } = useAuth();
  const canEdit = isAdmin || isEditor;
  const [viewMode, setViewMode] = useState<"grid" | "feed">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editArticle, setEditArticle] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const { data: articles = [], isLoading, refetch } = useQuery({
    queryKey: ["research-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research_articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allReactions = [] } = useQuery({
    queryKey: ["research-all-reactions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("research_article_reactions").select("article_id, reaction_type");
      if (error) throw error;
      return data;
    },
  });

  const { data: allComments = [] } = useQuery({
    queryKey: ["research-all-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research_article_comments")
        .select("article_id, is_approved");
      if (error) throw error;
      return data;
    },
  });

  const filtered = filterCategory
    ? articles.filter((a) => a.category === filterCategory)
    : articles;

  if (selectedId) {
    return (
      <div className="min-h-screen bg-background pb-14">
        <PageMeta title="Наши исследования — Профессор Тарусин Д.И." description="Научные исследования" path="/research" />
        <Header />
        <main className="pt-24 md:pt-28">
          <div className="container mx-auto px-4 py-8">
            <ResearchPostDetail articleId={selectedId} onBack={() => setSelectedId(null)} />
          </div>
        </main>
        <Footer />
        <StickyBottomPanel />
      </div>
    );
  }

  if (showForm || editArticle) {
    return (
      <div className="min-h-screen bg-background pb-14">
        <Header />
        <main className="pt-24 md:pt-28">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-foreground mb-6">
              {editArticle ? "Редактировать публикацию" : "Новая публикация"}
            </h1>
            <ResearchPostForm
              article={editArticle}
              onSave={() => {
                setShowForm(false);
                setEditArticle(null);
                refetch();
              }}
              onCancel={() => {
                setShowForm(false);
                setEditArticle(null);
              }}
            />
          </div>
        </main>
        <Footer />
        <StickyBottomPanel />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-14">
      <PageMeta title="Наши исследования — Профессор Тарусин Д.И." description="Научные исследования профессора Тарусина Д.И." path="/research" />
      <Header />
      <main className="pt-24 md:pt-28">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Наши исследования</h1>
              <p className="text-muted-foreground mt-1">Научные публикации и исследования команды</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("feed")}
                  className={`p-2 ${viewMode === "feed" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              {canEdit && (
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> Новая публикация
                </Button>
              )}
            </div>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge
              variant={filterCategory === null ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setFilterCategory(null)}
            >
              Все
            </Badge>
            {RESEARCH_CATEGORIES.map((c) => (
              <Badge
                key={c.value}
                variant={filterCategory === c.value ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setFilterCategory(c.value)}
              >
                {c.label}
              </Badge>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">📚</p>
              <p className="text-lg text-muted-foreground">
                {filterCategory ? "В этой категории пока нет публикаций" : "Публикации скоро появятся"}
              </p>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-4 max-w-3xl"}>
              {filtered.map((article) => (
                <ResearchPostCard
                  key={article.id}
                  article={article}
                  commentCount={allComments.filter((c) => c.article_id === article.id && c.is_approved).length}
                  reactionCount={allReactions.filter((r) => r.article_id === article.id).length}
                  viewMode={viewMode}
                  onClick={() => setSelectedId(article.id)}
                  onEdit={canEdit ? () => setEditArticle(article) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <StickyBottomPanel />
    </div>
  );
};

export default Research;
