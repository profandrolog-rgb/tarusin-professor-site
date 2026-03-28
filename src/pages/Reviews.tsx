import { ArrowLeft, Star, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageMeta from "@/components/PageMeta";

import prodoctorovLogo from "@/assets/platforms/prodoctorov.png";
import yandexHealthLogo from "@/assets/platforms/yandex-health.png";
import docdocLogo from "@/assets/platforms/docdoc.png";


const reviewPlatforms = [
  {
    name: "ProDoctorov",
    rating: "5.0",
    reviewCount: "26",
    description: "Крупнейший сервис поиска врачей в России",
    url: "https://prodoctorov.ru/moskva/vrach/32554-tarusin/",
    logo: prodoctorovLogo
  },
  {
    name: "Яндекс.Здоровье",
    rating: "5.0",
    reviewCount: "40",
    description: "Медицинский сервис Яндекса",
    url: "https://yandex.ru/medicine/doctor/tarusin_dmitriy_FoTXtQPJy5wOJ",
    logo: yandexHealthLogo
  },
  {
    name: "DocDoc",
    rating: "4.5",
    reviewCount: "13",
    description: "Сервис записи к врачам онлайн",
    url: "https://docdoc.ru/doctor/Tarusin_Dmitriy",
    logo: docdocLogo
  },
];

const Reviews = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Отзывы пациентов — Проф. Тарусин Д.И."
        description="Реальные отзывы пациентов профессора Тарусина Д.И. на независимых платформах. Рейтинг 4.8 на 3+ медицинских агрегаторах."
        path="/reviews"
      />
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Отзывы и рейтинги</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            Реальные отзывы пациентов на независимых платформах — 3+ медицинских агрегатора
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="bg-secondary border-none">
            <CardContent className="p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">79+</div>
              <div className="text-sm text-muted-foreground">Отзывов</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-none">
            <CardContent className="p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">4.7</div>
              <div className="text-sm text-muted-foreground">Средний рейтинг</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-none">
            <CardContent className="p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">3+</div>
              <div className="text-sm text-muted-foreground">Платформы</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-none">
            <CardContent className="p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">42</div>
              <div className="text-sm text-muted-foreground">Года опыта</div>
            </CardContent>
          </Card>
        </div>

        {/* Platforms */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            Читать отзывы на платформах
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviewPlatforms.map((platform, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => window.open(platform.url, "_blank")}
              >
                <CardContent className="p-6">
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4 overflow-hidden">
                    <img 
                      src={platform.logo} 
                      alt={platform.name} 
                      className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-110" 
                    />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-1">{platform.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-foreground">{platform.rating}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{platform.reviewCount} отзывов</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-12 bg-accent/10 border-accent/30">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-foreground mb-4">Оценка интернет-видимости</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Профессиональная видимость</div>
                <div className="font-bold text-primary">ВЫСОКАЯ</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Репутация</div>
                <div className="font-bold text-primary">ПРЕВОСХОДНАЯ</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Медицинские агрегаторы</div>
                <div className="font-bold text-primary">3+ ПЛАТФОРМЫ</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Banner */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Доверие пациентов — главная награда
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              За 42 года практики тысячи семей доверили мне здоровье своих детей. 
              Каждый положительный отзыв — это история успешного лечения и благодарность, 
              которая вдохновляет продолжать работу.
            </p>
            <Link to="/contacts">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Записаться на консультацию
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reviews;
