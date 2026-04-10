import { ArrowLeft, Newspaper, Tv, Headphones, ExternalLink, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageMeta from "@/components/PageMeta";
import { useTranslation } from "react-i18next";

const Media = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const pressArticles = isEn ? [
    { title: "Let Him Become a Father", description: "About boys' reproductive health", source: "Novye Izvestia", url: "https://newizv.ru/news/2009-06-06/pust-on-stanet-papoy-110359", year: "2009" },
    { title: "Adolescents and Oncology: Importance of Early Diagnosis", description: "Breast ultrasound and prevention", source: "Agency for Social Information", url: "https://asi.org.ru/news/2019/04/04/podrostki-onkologiya/", year: "2019" },
    { title: "Moscow Medicine", description: "Publication in the Healthcare Research Institute journal", source: "NIIOZ", url: "https://niioz.ru/upload/iblock/fc0/fc09f5a26ec81a23de29f7402ac03df2.pdf", type: "PDF" },
    { title: "Rosary Boy", description: "Discussion on orchidometers and diagnostics", source: "Vademecum", url: "https://vademec.ru/article/chetki_patsan/" },
  ] : [
    { title: "Пусть он станет папой", description: "О репродуктивном здоровье мальчиков", source: "Новые Известия", url: "https://newizv.ru/news/2009-06-06/pust-on-stanet-papoy-110359", year: "2009" },
    { title: "Подростки и онкология: важность ранней диагностики", description: "УЗИ молочных желез и профилактика", source: "Агентство социальной информации", url: "https://asi.org.ru/news/2019/04/04/podrostki-onkologiya/", year: "2019" },
    { title: "Московская медицина", description: "Материал в издании НИИ организации здравоохранения", source: "НИИОЗ", url: "https://niioz.ru/upload/iblock/fc0/fc09f5a26ec81a23de29f7402ac03df2.pdf", type: "PDF" },
    { title: "Чётки-пацан", description: "Дискуссия об орхидометрах и диагностике", source: "Vademecum", url: "https://vademec.ru/article/chetki_patsan/" },
  ];

  const tvProjects = isEn ? [
    { title: "Grow Up a Man. Dmitry Tarusin.", description: "'Women's Question' project — Union of Women of Russia", videoUrl: "https://www.youtube.com/watch?v=f1O-1x4JPYs", infoUrl: "https://www.wuor.ru/news/17827-zhenskii_vopros_gost_efira_dmitrii_tarusin/", thumbnail: "https://img.youtube.com/vi/f1O-1x4JPYs/maxresdefault.jpg" },
    { title: "Path to Success and Daily Work of a Pediatric Andrologist", description: "Interview about the profession and daily practice", videoUrl: "https://www.youtube.com/watch?v=cVfXJrElYps", thumbnail: "https://img.youtube.com/vi/cVfXJrElYps/maxresdefault.jpg" },
    { title: "Early Diagnosis of Reproductive Health Disorders in Boys", description: "Educational video for specialists and parents", videoUrl: "https://www.youtube.com/watch?v=jO2ikp7Aenc", thumbnail: "https://img.youtube.com/vi/jO2ikp7Aenc/maxresdefault.jpg" },
  ] : [
    { title: "Вырасти мужчиной. Дмитрий Тарусин.", description: "Проект «Женский вопрос» — Союз женщин России", videoUrl: "https://www.youtube.com/watch?v=f1O-1x4JPYs", infoUrl: "https://www.wuor.ru/news/17827-zhenskii_vopros_gost_efira_dmitrii_tarusin/", thumbnail: "https://img.youtube.com/vi/f1O-1x4JPYs/maxresdefault.jpg" },
    { title: "Путь к успеху и рабочие будни детского андролога", description: "Интервью о профессии и ежедневной работе", videoUrl: "https://www.youtube.com/watch?v=cVfXJrElYps", thumbnail: "https://img.youtube.com/vi/cVfXJrElYps/maxresdefault.jpg" },
    { title: "Ранняя диагностика нарушений репродуктивного здоровья мальчиков", description: "Образовательное видео для специалистов и родителей", videoUrl: "https://www.youtube.com/watch?v=jO2ikp7Aenc", thumbnail: "https://img.youtube.com/vi/jO2ikp7Aenc/maxresdefault.jpg" },
  ];

  const podcasts = isEn ? [
    { title: "Child Touching Genitals: What to Do?", description: "Comments from a urologist and psychologist about childhood masturbation", source: "Podcast 'I Just Wanted to Ask' — Mel.fm", url: "https://mel.fm/novosti/3049162-rebenok-trogayet-genitalii-chto-delat-kommentary-urologa-i-psikhologa-v-novom-epizode-podkasta-ya" },
  ] : [
    { title: "Ребёнок трогает гениталии: что делать?", description: "Комментарии уролога и психолога о детской мастурбации", source: "Подкаст «Я просто спросить» — Mel.fm", url: "https://mel.fm/novosti/3049162-rebenok-trogayet-genitalii-chto-delat-kommentary-urologa-i-psikhologa-v-novom-epizode-podkasta-ya" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={isEn ? "Media, TV & Podcasts — Prof. Tarusin D.I." : "СМИ, ТВ и подкасты — Проф. Тарусин Д.И."}
        description={isEn ? "Press publications, TV projects, and podcasts featuring Professor Tarusin D.I." : "Публикации в прессе, телевизионные проекты и подкасты с участием профессора Тарусина Д.И."}
        path="/media"
      />
      <header className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {isEn ? "Home" : "На главную"}
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{isEn ? "Media, TV & Podcasts" : "СМИ, ТВ и подкасты"}</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            {isEn ? "Press publications, TV projects, and podcasts featuring Professor Tarusin" : "Публикации в прессе, телевизионные проекты и подкасты с участием профессора Тарусина"}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{isEn ? "Newspapers & Magazines" : "Газеты и журналы"}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {pressArticles.map((article, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">{article.source}</span>
                    {article.year && <span className="text-xs text-muted-foreground">{article.year}</span>}
                    {article.type && <span className="text-xs bg-secondary px-2 py-0.5 rounded">{article.type}</span>}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{article.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{article.description}</p>
                  <Button variant="outline" className="w-full" onClick={() => window.open(article.url, "_blank")}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {isEn ? "Read" : "Читать"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Tv className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{isEn ? "TV & Video Projects" : "ТВ и видеопроекты"}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tvProjects.map((project, index) => (
              <Card key={index} className="group overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center"><Play className="w-8 h-8 text-accent-foreground" /></div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">{project.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => window.open(project.videoUrl, "_blank")}>
                      <Play className="w-4 h-4 mr-2" />{isEn ? "Watch" : "Смотреть"}
                    </Button>
                    {project.infoUrl && (
                      <Button variant="outline" onClick={() => window.open(project.infoUrl, "_blank")}><ExternalLink className="w-4 h-4" /></Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <Headphones className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{isEn ? "Podcasts" : "Подкасты"}</h2>
          </div>
          {podcasts.map((podcast, index) => (
            <Card key={index} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-10 h-10 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-primary font-medium mb-2">{podcast.source}</div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{podcast.title}</h3>
                    <p className="text-muted-foreground mb-4">{podcast.description}</p>
                    <Button onClick={() => window.open(podcast.url, "_blank")}>
                      <Headphones className="w-4 h-4 mr-2" />{isEn ? "Listen to Podcast" : "Слушать подкаст"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Media;
