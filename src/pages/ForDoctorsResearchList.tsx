import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageMeta from "@/components/PageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const ForDoctorsResearchList = () => {
  const [topic, setTopic] = useState<string>("all");

  const { data: reviews = [] } = useQuery({
    queryKey: ["public-research-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research_reviews" as any)
        .select("id, slug, title, annotation, topic, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const topics = useMemo(() => {
    const set = new Set<string>();
    reviews.forEach((r) => r.topic && set.add(r.topic));
    return Array.from(set);
  }, [reviews]);

  const filtered = topic === "all" ? reviews : reviews.filter((r) => r.topic === topic);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <PageMeta
        title="Литературные обзоры для врачей — Проф. Тарусин Д.И."
        description="Научные литературные обзоры в детской урологии, андрологии и репродуктологии для врачей-коллег."
        path="/for-doctors/research/"
        keywords={["литературный обзор", "детская урология", "андрология", "мета-анализ"]}
      />

      <div className="flex items-center gap-3">
        <Link to="/for-doctors"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Для врачей</Button></Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-primary" /> Мои исследования и литературные обзоры
        </h1>
        <p className="text-muted-foreground">
          Научные литературные обзоры для врачей-коллег: систематизация данных, критическая оценка литературы, клиническое значение.
        </p>
      </div>

      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button variant={topic === "all" ? "default" : "outline"} size="sm" onClick={() => setTopic("all")}>Все ({reviews.length})</Button>
          {topics.map((t) => (
            <Button key={t} variant={topic === t ? "default" : "outline"} size="sm" onClick={() => setTopic(t)}>{t}</Button>
          ))}
        </div>
      )}

      <div className="grid gap-4">
        {filtered.length === 0 && (
          <Card><CardContent className="p-6 text-muted-foreground">Пока нет опубликованных обзоров.</CardContent></Card>
        )}
        {filtered.map((r) => (
          <Link key={r.id} to={`/for-doctors/research/${r.slug}`}>
            <Card className="hover:shadow-lg transition-shadow border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl">{r.title}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {r.topic && <Badge variant="secondary">{r.topic}</Badge>}
                  {r.published_at && <span>{format(new Date(r.published_at), "d MMMM yyyy", { locale: ru })}</span>}
                </div>
              </CardHeader>
              {r.annotation && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{r.annotation}</p>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ForDoctorsResearchList;
