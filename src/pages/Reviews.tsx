import { ArrowLeft, Star, ExternalLink, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageMeta from "@/components/PageMeta";
import ColleagueReviews from "@/components/ColleagueReviews";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

import prodoctorovLogo from "@/assets/platforms/prodoctorov.png";
import yandexHealthLogo from "@/assets/platforms/yandex-health.png";
import docdocLogo from "@/assets/platforms/docdoc.png";

const logoMap: Record<string, string> = { prodoctorov: prodoctorovLogo, "yandex-health": yandexHealthLogo, docdoc: docdocLogo };

const fallbackPlatforms = [
  { platform_name: "ProDoctorov", rating: "5.0", review_count: "26", description_ru: "Крупнейший сервис поиска врачей в России", description_en: "Russia's largest doctor search service", url: "https://prodoctorov.ru/moskva/vrach/32554-tarusin/", logo_key: "prodoctorov" },
  { platform_name: "Yandex Health", rating: "5.0", review_count: "40", description_ru: "Медицинский сервис Яндекса", description_en: "Yandex medical service", url: "https://yandex.ru/medicine/doctor/tarusin_dmitriy_FoTXtQPJy5wOJ", logo_key: "yandex-health" },
  { platform_name: "DocDoc", rating: "4.5", review_count: "13", description_ru: "Сервис записи к врачам онлайн", description_en: "Online doctor booking service", url: "https://docdoc.ru/doctor/Tarusin_Dmitriy", logo_key: "docdoc" },
];

const Reviews = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: platforms } = useQuery({
    queryKey: ["review-platforms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("review_platforms").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Auto-refresh from sources if data is older than 24h (admin-triggered or scheduled job will overwrite anyway)
  useEffect(() => {
    if (!platforms || platforms.length === 0) return;
    const oldest = platforms.reduce((min, p: any) => {
      const t = p.last_scraped_at ? new Date(p.last_scraped_at).getTime() : 0;
      return t < min ? t : min;
    }, Date.now());
    const ageH = (Date.now() - oldest) / 3600000;
    if (ageH > 24 && isAdmin && !refreshing) {
      handleRefresh(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms, isAdmin]);

  const handleRefresh = async (silent = false) => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-reviews", { body: {} });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["review-platforms"] });
      if (!silent) toast({ title: "Отзывы обновлены", description: "Данные платформ перезагружены" });
    } catch (e: any) {
      if (!silent) toast({ title: "Не удалось обновить", description: e?.message || "Ошибка", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const reviewPlatforms = (platforms && platforms.length > 0
    ? platforms.map(p => ({ ...p, description_ru: p.description, description_en: p.description }))
    : fallbackPlatforms);

  const ratingPlatforms = reviewPlatforms.filter(p => p.logo_key !== "docdoc");
  const totalReviews = reviewPlatforms.reduce((sum, p) => sum + parseInt(p.review_count || "0", 10), 0);
  const avgRating = ratingPlatforms.length > 0 ? (ratingPlatforms.reduce((sum, p) => sum + parseFloat(p.rating || "0"), 0) / ratingPlatforms.length).toFixed(1) : "0";
  const lastScraped = (platforms || []).reduce((max: number, p: any) => {
    const t = p.last_scraped_at ? new Date(p.last_scraped_at).getTime() : 0;
    return t > max ? t : max;
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={isEn ? "Patient Reviews — Prof. Tarusin D.I." : "Отзывы пациентов — Проф. Тарусин Д.И."}
        description={isEn ? `Real patient reviews of Professor Tarusin. Rating ${avgRating} on ${reviewPlatforms.length}+ platforms.` : `Реальные отзывы пациентов профессора Тарусина Д.И. Рейтинг ${avgRating}.`}
        path="/reviews"
      />
      <header className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {isEn ? "Back to Home" : "На главную"}
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{isEn ? "Reviews & Ratings" : "Отзывы и рейтинги"}</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            {isEn ? `Real patient reviews on independent platforms — ${reviewPlatforms.length}+ medical aggregators` : `Реальные отзывы пациентов на независимых платформах — ${reviewPlatforms.length}+ медицинских агрегатора`}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        <Tabs defaultValue="patients" className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-auto mb-8">
            <TabsTrigger value="patients" className="py-3">{isEn ? "Patient Reviews" : "Отзывы пациентов"}</TabsTrigger>
            <TabsTrigger value="colleagues" className="py-3">{isEn ? "Colleague Reviews" : "Отзывы коллег"}</TabsTrigger>
          </TabsList>

          <TabsContent value="patients">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <Card className="bg-secondary border-none"><CardContent className="p-6 text-center"><div className="text-3xl md:text-4xl font-bold text-primary mb-1">{totalReviews}+</div><div className="text-sm text-muted-foreground">{isEn ? "Reviews" : "Отзывов"}</div></CardContent></Card>
              <Card className="bg-secondary border-none"><CardContent className="p-6 text-center"><div className="text-3xl md:text-4xl font-bold text-primary mb-1">{avgRating}</div><div className="text-sm text-muted-foreground">{isEn ? "Avg. Rating" : "Средний рейтинг"}</div></CardContent></Card>
              <Card className="bg-secondary border-none"><CardContent className="p-6 text-center"><div className="text-3xl md:text-4xl font-bold text-primary mb-1">{reviewPlatforms.length}+</div><div className="text-sm text-muted-foreground">{isEn ? "Platforms" : "Платформы"}</div></CardContent></Card>
              <Card className="bg-secondary border-none"><CardContent className="p-6 text-center"><div className="text-3xl md:text-4xl font-bold text-primary mb-1">42</div><div className="text-sm text-muted-foreground">{isEn ? "Years of Experience" : "Года опыта"}</div></CardContent></Card>
            </div>

            <div className="mb-12">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">{isEn ? "Read Reviews on Platforms" : "Читать отзывы на платформах"}</h2>
                <div className="flex items-center gap-3">
                  {lastScraped > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {isEn ? "Updated" : "Обновлено"}: {new Date(lastScraped).toLocaleString(isEn ? "en-US" : "ru-RU", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  )}
                  {isAdmin && (
                    <Button size="sm" variant="outline" onClick={() => handleRefresh(false)} disabled={refreshing}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                      {refreshing ? (isEn ? "Updating…" : "Обновляю…") : (isEn ? "Refresh" : "Обновить")}
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {reviewPlatforms.map((platform, index) => (
                  <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer" onClick={() => window.open(platform.url, "_blank")}>
                    <CardContent className="p-6">
                      <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4 overflow-hidden">
                        <img src={logoMap[platform.logo_key]} alt={platform.platform_name} className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">{platform.platform_name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{isEn ? platform.description_en : platform.description_ru}</p>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">{[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-yellow-500 fill-yellow-500" />)}</div>
                        <span className="text-sm font-medium text-foreground">{platform.rating}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{platform.review_count} {isEn ? "reviews" : "отзывов"}</span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="mb-12 bg-accent/10 border-accent/30">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-foreground mb-4">{isEn ? "Online Visibility Assessment" : "Оценка интернет-видимости"}</h3>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div><div className="text-sm text-muted-foreground mb-1">{isEn ? "Professional Visibility" : "Профессиональная видимость"}</div><div className="font-bold text-primary">{isEn ? "HIGH" : "ВЫСОКАЯ"}</div></div>
                  <div><div className="text-sm text-muted-foreground mb-1">{isEn ? "Reputation" : "Репутация"}</div><div className="font-bold text-primary">{isEn ? "EXCELLENT" : "ПРЕВОСХОДНАЯ"}</div></div>
                  <div><div className="text-sm text-muted-foreground mb-1">{isEn ? "Medical Aggregators" : "Медицинские агрегаторы"}</div><div className="font-bold text-primary">{reviewPlatforms.length}+ {isEn ? "PLATFORMS" : "ПЛАТФОРМЫ"}</div></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-8 md:p-12 text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">{isEn ? "Patient Trust — The Greatest Reward" : "Доверие пациентов — главная награда"}</h2>
                <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
                  {isEn
                    ? "Over 42 years of practice, thousands of families have trusted me with their children's health. Every positive review is a story of successful treatment and gratitude that inspires me to continue."
                    : "За 42 года практики тысячи семей доверили мне здоровье своих детей. Каждый положительный отзыв — это история успешного лечения и благодарность, которая вдохновляет продолжать работу."
                  }
                </p>
                <Link to="/contacts"><Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">{isEn ? "Book a Consultation" : "Записаться на консультацию"}</Button></Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colleagues"><ColleagueReviews /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Reviews;
