import { BookOpen, Video, Headphones, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const articles = [
  {
    title: "Как гарантированно стать дедушкой",
    description: "О долгосрочной заботе о мужском здоровье. Что нужно знать родителям мальчиков, чтобы в будущем их сыновья стали здоровыми отцами.",
    url: "https://caprice-lifestyle.com/health-beauty/dmitriy-tarusin",
    source: "Caprice Lifestyle",
    preview: "https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=600&h=400&fit=crop",
    emoji: "👴",
  },
  {
    title: "Баланопостит у детей: актуальное решение",
    description: "Статья о применении Balaneks Kids — современного средства для лечения и профилактики воспалительных заболеваний крайней плоти у мальчиков.",
    url: "https://www.uroweb.ru/article/reshenie-problemi-balanopostita-u-detey-aktualnoe-novoe-balaneks-kids",
    source: "Uroweb.ru",
    preview: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&h=400&fit=crop",
    emoji: "💊",
  },
  {
    title: "Орхит: причины, симптомы и лечение",
    description: "Подробная статья о воспалении яичка — причины возникновения, основные симптомы, методы диагностики и современные подходы к лечению.",
    url: "https://probolezny.ru/orhit/",
    source: "ProBolezny.ru",
    preview: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop",
    emoji: "🏥",
  },
];

const videos = [
  {
    title: "Вырасти мужчиной. Дмитрий Тарусин.",
    description: "Проект «Женский вопрос» — Союз женщин России",
    url: "https://www.youtube.com/watch?v=f1O-1x4JPYs",
    thumbnail: "https://img.youtube.com/vi/f1O-1x4JPYs/maxresdefault.jpg",
  },
  {
    title: "Путь к успеху и рабочие будни детского андролога",
    description: "Интервью о профессии и ежедневной работе",
    url: "https://www.youtube.com/watch?v=cVfXJrElYps",
    thumbnail: "https://img.youtube.com/vi/cVfXJrElYps/maxresdefault.jpg",
  },
];

const podcasts = [
  {
    title: "Ребёнок трогает гениталии: что делать?",
    description: "Комментарии уролога и психолога в подкасте «Я просто спросить»",
    url: "https://mel.fm/novosti/3049162-rebenok-trogayet-genitalii-chto-delat-kommentary-urologa-i-psikhologa-v-novom-epizode-podkasta-ya",
    source: "Mel.fm",
  },
];

const UsefulMaterials = () => (
  <div>
    {/* Articles */}
    <section className="mb-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Статьи</h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <Card
            key={index}
            className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => window.open(article.url, "_blank")}
          >
            <div className="relative overflow-hidden">
              <AspectRatio ratio={16 / 10}>
                <img
                  src={article.preview}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="bg-background/90 backdrop-blur-sm text-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                    {article.source}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-semibold text-base leading-snug line-clamp-2">
                    {article.emoji} {article.title}
                  </h3>
                </div>
              </AspectRatio>
            </div>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-sm line-clamp-3 mb-3">{article.description}</p>
              <div className="flex items-center text-primary text-sm font-medium group-hover:underline">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Читать статью
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>

    {/* Videos */}
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
                onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
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
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => window.open(video.url, "_blank")}>
                <Video className="w-4 h-4 mr-2" />
                Смотреть видео
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>

    {/* Podcasts */}
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
                  <Button variant="outline" onClick={() => window.open(podcast.url, "_blank")}>
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
  </div>
);

export default UsefulMaterials;
