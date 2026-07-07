import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Download, FileText, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import PageMeta from "@/components/PageMeta";
import JsonLd from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { proxyImage } from "@/lib/proxyImage";
import {
  type ParentsMaterial,
  parentsMediaPublicUrl,
  resolveMaterialPreview,
  formatBytes,
  pagesLabel,
} from "@/lib/parentsMaterialsBucket";
import { SITE_URL } from "@/lib/i18nUrls";

const audienceLabelRu: Record<string, string> = {
  parent: "Памятка для родителей",
  adult_man: "Материал для взрослого пациента",
  pediatric_patient: "Материал для юного пациента",
  professional: "Материал для врача",
};
const audienceLabelEn: Record<string, string> = {
  parent: "Handout for parents",
  adult_man: "Handout for adult patient",
  pediatric_patient: "Handout for young patient",
  professional: "Handout for medical professional",
};

const ParentsMaterialLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [item, setItem] = useState<ParentsMaterial | null>(null);
  const [related, setRelated] = useState<ParentsMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("parents_materials" as any)
        .select("*")
        .eq("slug", slug!)
        .eq("kind", "handout")
        .eq("is_published", true)
        .maybeSingle();
      if (cancelled) return;
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const rec = data as unknown as ParentsMaterial;
      setItem(rec);

      const { data: rel } = await supabase
        .from("parents_materials" as any)
        .select("*")
        .eq("kind", "handout")
        .eq("is_published", true)
        .neq("id", rec.id)
        .eq("audience", rec.audience ?? "parent")
        .order("sort_order", { ascending: true })
        .limit(3);
      let relRows = ((rel as unknown as ParentsMaterial[]) ?? []).slice(0, 3);
      if (relRows.length < 3) {
        const { data: fallback } = await supabase
          .from("parents_materials" as any)
          .select("*")
          .eq("kind", "handout")
          .eq("is_published", true)
          .neq("id", rec.id)
          .order("created_at", { ascending: false })
          .limit(3 - relRows.length);
        const extra = ((fallback as unknown as ParentsMaterial[]) ?? []).filter(
          (r) => !relRows.some((x) => x.id === r.id),
        );
        relRows = [...relRows, ...extra].slice(0, 3);
      }
      if (!cancelled) setRelated(relRows);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (notFound || !item) return <Navigate to="/404" replace />;

  const title = (isEn && item.title_en) || item.title;
  const description = (isEn && item.description_en) || item.description || "";
  const longDesc = (isEn && item.long_description_en) || item.long_description || "";
  const seoTitle = (isEn && item.seo_title_en) || item.seo_title || title;
  const seoDesc = (isEn && item.seo_description_en) || item.seo_description || description || title;
  const preview = resolveMaterialPreview(item);
  const ogImage = item.og_image_path ? parentsMediaPublicUrl(item.og_image_path) : preview;
  const audLabel = item.audience ? (isEn ? audienceLabelEn[item.audience] : audienceLabelRu[item.audience]) : (isEn ? "Handout" : "Памятка");

  const handleDownload = async () => {
    if (!item.file_path) {
      toast.error(isEn ? "PDF not available yet" : "PDF пока не прикреплён");
      return;
    }
    setDownloading(true);
    try {
      await supabase.rpc("increment_material_download" as any, { material_id: item.id });
    } catch {
      // счётчик не критичен
    }
    const url = parentsMediaPublicUrl(item.file_path)!;
    // Открываем в новой вкладке, чтобы избежать блокировок и CORS
    window.open(url, "_blank", "noopener,noreferrer");
    setDownloading(false);
  };

  const pageUrl = `${SITE_URL}/for-parents/materials/${item.slug}/`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: seoTitle,
    description: seoDesc,
    image: ogImage ? [ogImage] : undefined,
    datePublished: item.created_at,
    dateModified: item.updated_at,
    author: {
      "@type": "Person",
      name: "Тарусин Дмитрий Игоревич",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Профессор Тарусин Д.И.",
      url: SITE_URL,
    },
    mainEntityOfPage: pageUrl,
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={seoTitle}
        description={seoDesc}
        path={`/for-parents/materials/${item.slug}/`}
        image={ogImage || undefined}
        type="article"
      />
      <JsonLd data={jsonLd} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap" aria-label="breadcrumbs">
          <Link to="/" className="hover:text-foreground">{isEn ? "Home" : "Главная"}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/for-parents" className="hover:text-foreground">{isEn ? "For Parents" : "Для родителей"}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/for-parents?tab=useful" className="hover:text-foreground">{isEn ? "Materials" : "Материалы"}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground truncate">{title}</span>
        </nav>

        <Link to="/for-parents?tab=useful" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" />{isEn ? "Back to materials" : "Ко всем материалам"}
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{title}</h1>
          <p className="text-base text-muted-foreground">
            {audLabel}
            {item.pages_count ? ` · ${pagesLabel(item.pages_count)}` : ""}
            {" · PDF"}
          </p>
        </header>

        {/* Preview + download */}
        <Card className="mb-8 overflow-hidden">
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-0">
            <div className="bg-muted">
              <AspectRatio ratio={4 / 3}>
                {preview ? (
                  <img
                    src={proxyImage(preview)}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </AspectRatio>
            </div>
            <CardContent className="p-6 md:p-8 flex flex-col justify-center gap-4">
              {description && <p className="text-muted-foreground leading-relaxed">{description}</p>}
              <Button size="lg" onClick={handleDownload} disabled={downloading || !item.file_path} className="w-full">
                {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                {isEn ? "Download PDF" : "Скачать PDF"}
                {item.file_size_bytes ? ` · ${formatBytes(item.file_size_bytes)}` : ""}
              </Button>
              {!item.file_path && (
                <p className="text-xs text-muted-foreground text-center">
                  {isEn ? "PDF will be available soon." : "PDF будет доступен в ближайшее время."}
                </p>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Long description Markdown */}
        {longDesc && (
          <article className="prose prose-slate dark:prose-invert max-w-none mb-12
            prose-headings:font-semibold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3
            prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2
            prose-p:leading-relaxed prose-blockquote:border-primary prose-blockquote:text-muted-foreground
            prose-a:text-primary hover:prose-a:underline">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{longDesc}</ReactMarkdown>
          </article>
        )}

        {/* Related materials */}
        {related.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">{isEn ? "Related materials" : "Материалы по теме"}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {related.map((r) => {
                const p = resolveMaterialPreview(r);
                const t = (isEn && r.title_en) || r.title;
                return (
                  <Link key={r.id} to={`/for-parents/materials/${r.slug}/`} className="group">
                    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="bg-muted">
                        <AspectRatio ratio={16 / 10}>
                          {p ? (
                            <img src={proxyImage(p)} alt={t} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><FileText className="w-8 h-8 text-muted-foreground" /></div>
                          )}
                        </AspectRatio>
                      </div>
                      <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground mb-1.5">
                          PDF{r.pages_count ? ` · ${pagesLabel(r.pages_count)}` : ""}
                        </div>
                        <h3 className="font-medium text-sm text-foreground group-hover:text-primary line-clamp-3">{t}</h3>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="rounded-lg bg-secondary p-6 md:p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">{isEn ? "Have questions?" : "Остались вопросы?"}</h3>
          <p className="text-muted-foreground mb-4">
            {isEn ? "Book a consultation and we'll figure everything out together." : "Приходите ко мне на консультацию, и мы всё решим."}
          </p>
          <Link to="/#contact">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isEn ? "Book an Appointment" : "Записаться на приём"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ParentsMaterialLanding;
