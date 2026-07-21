import { useMemo, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageMeta from "@/components/PageMeta";
import JsonLd from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import DOMPurify from "dompurify";
import { SITE_URL } from "@/lib/i18nUrls";

interface Ref {
  number: number; authors?: string; title?: string; journal?: string;
  year?: string; volume_issue?: string; pages?: string; doi_or_pmid?: string;
}

const ForDoctorsResearchDetail = () => {
  const { slug } = useParams();

  const { data: review, isLoading } = useQuery({
    queryKey: ["research-review", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research_reviews" as any)
        .select("*")
        .eq("slug", slug!)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  // Аналитика: просмотр обзора (GA4 + Яндекс.Метрика).
  useEffect(() => {
    if (!review?.slug) return;
    try {
      const w = window as any;
      w.gtag?.("event", "research_review_view", {
        review_slug: review.slug,
        review_title: review.title,
        topic: review.topic || "",
      });
      w.ym?.(107724120, "reachGoal", "research_review_view", { slug: review.slug });
    } catch { /* no-op */ }
  }, [review?.slug, review?.title, review?.topic]);

  const html = useMemo(() => {
    if (!review?.content) return "";
    // Заменяем [N] на <a href="#ref-N" data-ref="N">[N]</a> для навигации к списку литературы.
    const withAnchors = String(review.content).replace(
      /\[(\d+)\]/g,
      (_m, n) => `<a href="#ref-${n}" data-ref="${n}" class="text-primary hover:underline">[${n}]</a>`,
    );
    return DOMPurify.sanitize(withAnchors, { ADD_ATTR: ["target", "rel", "data-ref"] });
  }, [review?.content]);

  // Аналитика: клик по номеру источника в теле статьи.
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a[data-ref]") as HTMLAnchorElement | null;
    if (!anchor) return;
    const refNum = anchor.dataset.ref;
    try {
      const w = window as any;
      w.gtag?.("event", "research_reference_click", { review_slug: review?.slug, ref_number: refNum });
      w.ym?.(107724120, "reachGoal", "research_reference_click", { slug: review?.slug, ref: refNum });
    } catch { /* no-op */ }
  };

  if (isLoading) return <div className="p-6"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!review) return <div className="max-w-3xl mx-auto p-6">Обзор не найден.</div>;

  const rawRefs: Ref[] = Array.isArray(review.references_list) ? review.references_list : [];
  const refs: Ref[] = rawRefs.filter((r) => {
    const fields = [r.authors, r.title, r.journal, r.year, r.volume_issue, r.pages, r.doi_or_pmid];
    return fields.some((f) => typeof f === "string" && f.trim() && !/^не\s*применимо$/i.test(f.trim()) && !/^автор\s*материала$/i.test(f.trim()) && !/^н\/д$/i.test(f.trim()));
  });
  const canonicalPath = `/for-doctors/research/${review.slug}/`;
  const url = `${SITE_URL}${canonicalPath}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Проф. Тарусин Дмитрий Игоревич",
      url: SITE_URL,
      jobTitle: "Детский уролог-андролог, д.м.н., профессор",
    },
    {
      "@context": "https://schema.org",
      "@type": "MedicalScholarlyArticle",
      headline: review.title,
      abstract: review.annotation,
      inLanguage: "ru",
      url,
      datePublished: review.published_at,
      dateModified: review.updated_at,
      author: { "@type": "Person", name: "Проф. Тарусин Дмитрий Игоревич" },
      publisher: { "@type": "Organization", name: "Проф. Тарусин Д.И." },
      citation: refs.map((r) => ({
        "@type": "CreativeWork",
        name: r.title,
        author: r.authors,
        datePublished: r.year,
        isPartOf: r.journal,
        identifier: r.doi_or_pmid,
      })),
    },
  ];

  return (
    <article className="max-w-3xl mx-auto p-6 space-y-6">
      <PageMeta
        title={review.seo_title || `${review.title} — Проф. Тарусин Д.И.`}
        description={review.seo_meta_description || String(review.annotation || "").slice(0, 160)}
        path={canonicalPath}
        type="article"
      />
      <JsonLd data={jsonLd as any} />

      <Link to="/for-doctors/research"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> К обзорам</Button></Link>

      <header className="space-y-3">
        <div className="flex items-center gap-2">
          {review.topic && <Badge variant="secondary">{review.topic}</Badge>}
          {review.published_at && (
            <span className="text-xs text-muted-foreground">{format(new Date(review.published_at), "d MMMM yyyy", { locale: ru })}</span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-foreground">{review.title}</h1>
        {review.annotation && (
          <p className="text-lg text-muted-foreground italic border-l-4 border-primary/40 pl-4">{review.annotation}</p>
        )}
      </header>

      <div
        onClick={handleContentClick}
        className="prose prose-sm md:prose-base max-w-none text-foreground"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {refs.length > 0 && (
        <section className="border-t pt-6 space-y-3">
          <h2 className="text-xl font-semibold">Список литературы</h2>
          <ol className="space-y-2 text-sm">
            {refs.map((r) => {
              const clean = (v?: string) => {
                const s = (v ?? "").trim();
                if (!s) return "";
                if (/^(не\s*применимо|автор\s*материала|н\/д|n\/a)$/i.test(s)) return "";
                return s;
              };
              const authors = clean(r.authors);
              const title = clean(r.title);
              const journal = clean(r.journal);
              const year = clean(r.year);
              const vol = clean(r.volume_issue);
              const pages = clean(r.pages);
              const doi = clean(r.doi_or_pmid);
              return (
                <li key={r.number} id={`ref-${r.number}`} className="scroll-mt-20">
                  <span className="font-semibold">{r.number}.</span>{" "}
                  {authors && <span>{authors}. </span>}
                  {title && <span className="italic">{title}. </span>}
                  {journal && <span>{journal} </span>}
                  {year && <span>{year}</span>}
                  {vol && <span>;{vol}</span>}
                  {pages && <span>:{pages}</span>}
                  {doi && <span>. {doi}</span>}
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </article>
  );
};

export default ForDoctorsResearchDetail;
