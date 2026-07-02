import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Filter, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DiseaseArticleCard from "./DiseaseArticleCard";
import DiseaseBentoCard from "./DiseaseBentoCard";
import FriendlyFallback, { DiseaseCardsSkeleton } from "./FriendlyFallback";

interface DiseaseArticlesListProps {
  ageGroup: "children" | "adults";
  initialArticles?: any[];
}

const FEATURED_KEYWORDS = ["крипторхиз", "варикоцел", "гинекомасти", "сперматоцел", "пупочн"];
const isFeatured = (a: { title: string; slug: string }) => {
  const hay = `${a.title} ${a.slug}`.toLowerCase();
  return FEATURED_KEYWORDS.some((k) => hay.includes(k));
};

const DiseaseArticlesList = ({ ageGroup, initialArticles }: DiseaseArticlesListProps) => {
  const { isAdmin } = useAuth();
  const seeded = (initialArticles || []).filter((a) => a.age_group === ageGroup);
  const [articles, setArticles] = useState<any[]>(seeded);
  const [loading, setLoading] = useState(seeded.length === 0);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "bento">("list");

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from("disease_articles")
      .select("*")
      .eq("age_group", ageGroup)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error) {
      setLoadError(true);
      setArticles([]);
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  }, [ageGroup]);

  useEffect(() => {
    if (seeded.length > 0 && !isAdmin) return;
    fetchArticles();
  }, [fetchArticles, isAdmin, seeded.length]);

  const categories = useMemo(() => {
    const cats = new Set(articles.map((a) => a.category));
    return Array.from(cats).sort();
  }, [articles]);

  const categoryLabels: Record<string, string> = {
    general: "Общее",
    urology: "Урология",
    andrology: "Андрология",
    surgery: "Хирургия",
    endocrinology: "Эндокринология",
    psychology: "Психология",
    sexology: "Сексология",
    genetics: "Генетика",
  };

  const filtered = useMemo(() => {
    let result = articles;
    if (selectedCategory) {
      result = result.filter((a) => a.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.keywords?.some((k: string) => k.toLowerCase().includes(q))
      );
    }
    return result;
  }, [articles, searchQuery, selectedCategory]);

  return (
    <div className="flex gap-6">
      {/* Sidebar tree navigation */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 space-y-1">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Разделы
          </h3>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === null
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Все заболевания ({articles.length})
          </button>
          {categories.map((cat) => {
            const count = articles.filter(a => a.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{categoryLabels[cat] || cat}</span>
                <span className={`text-xs ${selectedCategory === cat ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile search and filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по заболеваниям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Mobile category filter */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap lg:hidden">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Badge
                variant={selectedCategory === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              >
                Все
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                >
                  {categoryLabels[cat] || cat}
                </Badge>
              ))}
            </div>
          )}

          {/* View mode toggle */}
          <div className="flex items-center justify-end gap-1">
            <span className="text-xs text-muted-foreground mr-2">Вид:</span>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              className="h-8 px-2"
              aria-label="Список"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "bento" ? "default" : "outline"}
              onClick={() => setViewMode("bento")}
              className="h-8 px-2"
              aria-label="Плитка"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Articles grid */}
        {loading ? (
          <DiseaseCardsSkeleton count={4} />
        ) : loadError ? (
          <FriendlyFallback
            variant="error"
            onRetry={fetchArticles}
            description="Не удалось загрузить список заболеваний. Проверьте интернет — данные не потеряны, можно повторить попытку."
          />
        ) : filtered.length === 0 ? (
          searchQuery || selectedCategory ? (
            <FriendlyFallback
              variant="empty"
              title="Ничего не нашлось"
              description="Попробуйте изменить поисковый запрос или сбросить фильтр по разделу."
            />
          ) : (
            <FriendlyFallback
              variant="empty"
              title={ageGroup === "children" ? "Материалы для детей скоро появятся" : "Материалы для взрослых скоро появятся"}
              description="Раздел сейчас пополняется. Загляните позже — или посмотрите другие материалы профессора."
              primaryHref="/for-parents?tab=useful"
              primaryLabel="Полезные материалы"
            />
          )
        ) : viewMode === "bento" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[minmax(140px,auto)]">
            {filtered.map((article) => (
              <DiseaseBentoCard
                key={article.id}
                article={article}
                featured={isFeatured(article)}
                categoryLabel={categoryLabels[article.category] || article.category}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filtered.map((article) => (
              <DiseaseArticleCard
                key={article.id}
                article={article}
                isAdmin={isAdmin}
                onArticleUpdated={fetchArticles}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseArticlesList;
