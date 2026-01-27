import { ArrowLeft, BookOpen, Video, Headphones, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const articles = [
  {
    title: "Как гарантированно стать дедушкой",
    description: "О долгосрочной заботе о мужском здоровье",
    url: "https://caprice-lifestyle.com/health-beauty/dmitriy-tarusin",
    source: "Caprice Lifestyle"
  },
  {
    title: "Баланопостит у детей: актуальное решение",
    description: "Статья о применении Balaneks Kids",
    url: "https://www.uroweb.ru/article/reshenie-problemi-balanopostita-u-detey-aktualnoe-novoe-balaneks-kids",
    source: "Uroweb.ru"
  },
  {
    title: "Орхит: причины, симптомы и лечение",
    description: "Подробная статья о воспалении яичка",
    url: "https://probolezny.ru/orhit/",
    source: "ProBolezny.ru"
  }
];

const videos = [
  {
    title: "Вырасти мужчиной. Дмитрий Тарусин.",
    description: "Проект «Женский вопрос» — Союз женщин России",
    url: "https://www.youtube.com/watch?v=f1O-1x4JPYs",
    thumbnail: "https://img.youtube.com/vi/f1O-1x4JPYs/maxresdefault.jpg"
  },
  {
    title: "Путь к успеху и рабочие будни детского андролога",
    description: "Интервью о профессии и ежедневной работе",
    url: "https://www.youtube.com/watch?v=cVfXJrElYps",
    thumbnail: "https://img.youtube.com/vi/cVfXJrElYps/maxresdefault.jpg"
  }
];

const podcasts = [
  {
    title: "Ребёнок трогает гениталии: что делать?",
    description: "Комментарии уролога и психолога в подкасте «Я просто спросить»",
    url: "https://mel.fm/novosti/3049162-rebenok-trogayet-genitalii-chto-delat-kommentary-urologa-i-psikhologa-v-novom-epizode-podkasta-ya",
    source: "Mel.fm"
  }
];

const ForParents = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Для родителей</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            Полезные материалы о мужском здоровье детей: статьи, видео и подкасты от профессора Тарусина
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Articles Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Статьи</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-sm text-muted-foreground mb-2">{article.source}</div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{article.description}</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(article.url, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Читать статью
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Videos Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Video className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Видео для родителей</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {videos.map((video, index) => (
              <Card key={index} className="group overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                      <Video className="w-8 h-8 text-accent-foreground" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{video.title}</h3>
                  <p className="text-muted-foreground mb-4">{video.description}</p>
                  <Button
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={() => window.open(video.url, "_blank")}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Смотреть видео
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Podcasts Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <Headphones className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Подкасты</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {podcasts.map((podcast, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Headphones className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground mb-1">{podcast.source}</div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{podcast.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{podcast.description}</p>
                      <Button
                        variant="outline"
                        onClick={() => window.open(podcast.url, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Слушать
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* CTA Section */}
      <section className="bg-secondary py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Остались вопросы?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Запишитесь на консультацию к профессору Тарусину для индивидуального осмотра и рекомендаций
          </p>
          <Link to="/#contact">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Записаться на приём
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ForParents;
