import { ArrowLeft, FileText, Video, BookOpen, Award, ExternalLink, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const specializations = [
  "Микрохирургия (варикоцеле, крипторхизм, водянка, сперматоцеле)",
  "Ультразвуковая диагностика органов мошонки и предстательной железы",
  "Функциональные нарушения мочеполовой системы",
  "Эректильная дисфункция"
];

const publications = [
  {
    title: "Урология сегодня",
    description: "Детская урология и реабилитация — актуальные вопросы",
    url: "https://abvpress.ru/upload/iblock/a7f/a7fb857a9885cdf8c4603cb8523ef37a.pdf",
    type: "PDF"
  },
  {
    title: "Журнал «Урологи» (Urodigest)",
    description: "Публикация в профессиональном урологическом издании",
    url: "https://urodigest.ru/sites/default/files/issue/02-2012.pdf",
    type: "PDF"
  },
  {
    title: "Профилактика мужского бесплодия при лечении опухолей",
    description: "Проблемы и решения — научная статья на CyberLeninka",
    url: "https://cyberleninka.ru/article/n/profilaktika-muzhskogo-besplodiya-pri-lechenii-opuholey-problemy-i-resheniya",
    type: "Статья"
  }
];

const videoLectures = [
  {
    title: "Крайняя плоть — бескрайняя",
    url: "https://uro.tv/video/tarusin_di_-_kraynyaya_plot_-_beskraynya"
  },
  {
    title: "Армагеддон в андрологии: последствия ошибок лечения",
    url: "https://uro.tv/online/proekt_na_kameru_armagedon_v_andrologii_posledstviya_oshibok_lecheniya"
  },
  {
    title: "Ультразвуковая диагностика острых заболеваний органов мошонки",
    url: "https://uro.tv/video/tarusin_di_-_ultrazvukovaya_diagnostika_ostrih_zabolevaniy_organov_moshonki"
  },
  {
    title: "Лабиринты детской урологии: варикоцеле",
    url: "https://uro.tv/online/labirinti_detskoy_urologii_varikotsele"
  },
  {
    title: "Дискуссионный андрологический клуб: гипогонадизм",
    url: "https://uro.tv/online/diskussionniy_andrologicheskiy_klub__po_teme_gipogonadizm"
  }
];

const ForDoctors = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Для врачей</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            Научные публикации, видеолекции и образовательные материалы для коллег
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Resume Section */}
        <section className="mb-16">
          <Card className="bg-secondary border-none">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Award className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Профессор Тарусин Дмитрий Игоревич
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Доктор медицинских наук, профессор, член-корреспондент РАЕН. 
                    Создатель детской урологии-андрологии в России, руководитель научных проектов. 
                    Автор более 89 научных статей и 6 глав в национальных руководствах.
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Основные направления</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {specializations.map((spec, index) => (
                    <div key={index} className="flex items-start gap-3 bg-background rounded-lg p-4">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Publications Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Публикации и статьи</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publications.map((pub, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded w-fit mb-2">
                    <FileText className="w-3 h-3" />
                    {pub.type}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {pub.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{pub.description}</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(pub.url, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Открыть
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Video Lectures Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Video className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Видеолекции на Uro.TV</h2>
            </div>
            <Button
              variant="outline"
              onClick={() => window.open("https://uro.tv/speaker/tarusin_dmitriy_igorevich", "_blank")}
              className="hidden md:flex"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Все выступления
            </Button>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videoLectures.map((lecture, index) => (
              <Card 
                key={index} 
                className="group cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                onClick={() => window.open(lecture.url, "_blank")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                      <Play className="w-5 h-5 text-accent group-hover:text-accent-foreground" />
                    </div>
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {lecture.title}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 md:hidden">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open("https://uro.tv/speaker/tarusin_dmitriy_igorevich", "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Все выступления на Uro.TV
            </Button>
          </div>
        </section>

        {/* Uroweb Project */}
        <section>
          <Card className="bg-primary text-primary-foreground overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">Проект «Лабиринты детской урологии»</h2>
                  </div>
                  <p className="text-primary-foreground/80 max-w-xl">
                    Приглашаю коллег присоединиться к образовательному проекту на платформе Uroweb — 
                    обсуждение сложных клинических случаев и обмен опытом
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground flex-shrink-0"
                  onClick={() => window.open("https://uroweb.ru/news/tarusin-d-i-priglashaet-prisoedinitsya-k-novomu-proektu-labirinti-detskoy-urologii", "_blank")}
                >
                  Подробнее о проекте
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default ForDoctors;
