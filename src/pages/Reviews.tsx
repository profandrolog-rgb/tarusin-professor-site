import { ArrowLeft, Star, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const reviewPlatforms = [
  {
    name: "ProDoctorov",
    rating: "5.0",
    reviewCount: "22+",
    description: "Крупнейший сервис поиска врачей в России",
    url: "https://prodoctorov.ru/moskva/vrach/32554-tarusin/",
    color: "bg-green-500"
  },
  {
    name: "Яндекс.Здоровье",
    rating: "5.0",
    reviewCount: "15+",
    description: "Медицинский сервис Яндекса",
    url: "https://yandex.ru/medicine/doctor/tarusin_dmitriy_FoTXtQPJy5wOJ",
    color: "bg-yellow-500"
  },
  {
    name: "DocDoc",
    rating: "5.0",
    reviewCount: "10+",
    description: "Сервис записи к врачам онлайн",
    url: "https://docdoc.ru/doctor/Tarusin_Dmitriy",
    color: "bg-blue-500"
  },
  {
    name: "Zoon",
    rating: "5.0",
    reviewCount: "5+",
    description: "Рекомендательный сервис",
    url: "https://zoon.ru/msk/p-doctor/dmitrij_igorevich_tarusin-e3e8/",
    color: "bg-purple-500"
  }
];

const Reviews = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Отзывы и рейтинги</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            Реальные отзывы пациентов на независимых платформах
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="bg-secondary border-none">
            <CardContent className="p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">50+</div>
              <div className="text-sm text-muted-foreground">Отзывов</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-none">
            <CardContent className="p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">5.0</div>
              <div className="text-sm text-muted-foreground">Средний рейтинг</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-none">
            <CardContent className="p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">4</div>
              <div className="text-sm text-muted-foreground">Платформы</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-none">
            <CardContent className="p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">32</div>
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
                  <div className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center mb-4`}>
                    <Star className="w-6 h-6 text-white fill-white" />
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

        {/* Trust Banner */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Доверие пациентов — главная награда
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              За 32 года практики тысячи семей доверили мне здоровье своих детей. 
              Каждый положительный отзыв — это история успешного лечения и благодарность, 
              которая вдохновляет продолжать работу.
            </p>
            <Link to="/#contact">
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
