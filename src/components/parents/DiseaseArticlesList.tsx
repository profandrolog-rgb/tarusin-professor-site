import { useState, useEffect, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import DiseaseArticleCard from "./DiseaseArticleCard";

interface DiseaseArticlesListProps {
  ageGroup: "children" | "adults";
}

const DiseaseArticlesList = ({ ageGroup }: DiseaseArticlesListProps) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("disease_articles")
        .select("*")
        .eq("age_group", ageGroup)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      setArticles(data || []);
      setLoading(false);
    };
    fetchArticles();
  }, [ageGroup]);

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
    <div>
      {/* Search and filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по заболеваниям..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {categories.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
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
      </div>

      {/* Articles grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? "Ничего не найдено. Попробуйте другой запрос." : "Материалы скоро появятся."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((article) => (
            <DiseaseArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DiseaseArticlesList;
