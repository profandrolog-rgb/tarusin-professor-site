import { ArrowLeft, FileText, Video, BookOpen, Award, ExternalLink, Play, Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const specializations = [
  "Микрохирургия (варикоцеле, крипторхизм, водянка, сперматоцеле)",
  "Ультразвуковая диагностика органов мошонки и предстательной железы",
  "Патология крайней плоти: фимоз, баланопостит, морфологические аспекты",
  "Неотложные состояния: острые заболевания органов мошонки, перекруты",
  "Тестикулярный микролитиаз: очаговые и диффузные поражения ткани яичка",
  "Задержка полового развития: диагностика и тактика у мальчиков",
  "Эректильная дисфункция и функциональные нарушения",
  "Юридические аспекты: ошибки, опасности и стратегии в детской уроандрологии"
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
  { title: "Паттерн ночной эрекции – что, зачем, почему", views: "295", year: "2024" },
  { title: "Клиническое наблюдение – полное удвоение уретры при гипоспадии", views: "90", year: "2024" },
  { title: "Острые и хронические заболевания крайней плоти у детей", views: "93", year: "2024" },
  { title: "Заболевания крайней плоти и головки полового члена у детей", views: "481", year: "2024" },
  { title: "Варикоцеле. To be or not to beat", views: "584", year: "2024" },
  { title: "Армагеддон в андрологии: последствия ошибок лечения", views: "464", year: "2023" },
  { title: "Симбиоз детского и взрослого уролога как фундамент мужского здоровья", views: "400", year: "2022" },
  { title: "Варикоцеле. Ab ovo ad absurdum", views: "694", year: "2021" },
  { title: "Очаговые и диффузные поражения ткани яичка. Тестикулярный микролитиаз", views: "706", year: "2020" },
  { title: "Стратегия и тактика диагностики и лечения варикоцеле у детей и подростков", views: "892", year: "2019" },
  { title: "Болезни крайней плоти – новые морфологические данные", views: "2569", year: "2019" },
  { title: "Крайняя плоть – бескрайняя", views: "1582", year: "2018" },
  { title: "Ультразвуковая диагностика острых заболеваний органов мошонки", views: "1013", year: "2018" },
  { title: "Детская и подростковая андрология (интервью)", views: "3635", year: "2018" },
  { title: "Неотложные состояния в детской урологии-андрологии", views: "1579", year: "2017" },
];

const labirintyEpisodes = [
  { title: "Варикоцеле", date: "25.01.2024" },
  { title: "Инфекции мочевой системы у детей с позиции педиатра и нефролога", date: "2024" },
  { title: "Детская андрология: Перекруты", date: "2024" },
  { title: "Диагностика и подходы к терапии кристаллурии у детей", date: "2024" },
  { title: "Энурез как проявление коморбидных состояний", date: "15.04.2025" },
  { title: "Отчет урологической службы ДЗМ за 2024 год", date: "20.05.2025" },
  { title: "Мегауретер у детей: этиология, диагностика, тактика", date: "24.06.2025" },
];

const schools = [
  { name: "XIII Школа", year: "2025", date: "3-4 апреля", location: "Москва, гостиница Измайлово" },
  { name: "XII Школа", year: "2024", date: "4-5 апреля", note: "Посвящена 100-летию Н.А. Лопаткина" },
  { name: "XI Школа", year: "2023", date: "6-7 апреля", location: "Москва, гостиница Измайлово" },
  { name: "X Школа", year: "2022", date: "—", note: "Юбилейная школа" },
  { name: "III Школа", year: "2015", date: "28-30 мая", note: "Курс ESPU (Европейская ассоциация детских урологов)" },
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
        {/* Disclaimer */}
        <div className="mb-8 border border-destructive rounded-lg p-4 text-sm text-muted-foreground leading-relaxed">
          Изображения и видео, приведенные во всех разделах сайта не являются порнографическими изображениями, так как приводятся только в научно-образовательных и клинических целях. Материалы не предназначены для возбуждения сексуального интереса и не являются «информацией порнографического характера» в смысле п.&nbsp;8 ст.&nbsp;2 Федерального закона №&nbsp;436‑ФЗ от 29.12.2010&nbsp;г. и Постановления ВС РФ от 15.12.2022&nbsp;г. Нажимая на кнопку просмотры Вы подтверждаете свое совершеннолетие (18+). Нажимая на кнопку просмотры Вы делаете это на свой страх и риск. Все — даже обезличенные материалы, опубликованные на сайте в виде историй болезни, кейсов, фрагментов презентаций, видеофайлы, изображения опубликованы на основании универсального информированного согласия, упоминающего возможность использования материалов в научных, аналитических, учебных, образовательных, просветительских целях. Профессор не несет ответственности за Ваши эмоции, переживания, моральную травматизацию и неограниченный круг возможных последствий, наступление которых возможно при просмотре материалов, представленных на сайте.
        </div>

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
                  <p className="text-lg text-muted-foreground mb-4">
                    Доктор медицинских наук (с 2005), профессор, член-корреспондент РАЕН, врач высшей категории. 
                    В 2003 году совместно с профессором Казанской И.В. организовал новую медицинскую 
                    специальность «детская урология-андрология» в России.
                  </p>
                  <div className="grid sm:grid-cols-4 gap-4 mt-6">
                    <div className="bg-background rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">126+</div>
                      <div className="text-sm text-muted-foreground">Научных статей</div>
                    </div>
                    <div className="bg-background rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">6</div>
                      <div className="text-sm text-muted-foreground">Глав в нац. руководствах</div>
                    </div>
                    <div className="bg-background rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">860+</div>
                      <div className="text-sm text-muted-foreground">Выступлений</div>
                    </div>
                    <div className="bg-background rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">9+</div>
                      <div className="text-sm text-muted-foreground">Кандидатов наук</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Основные направления и темы выступлений</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {specializations.map((spec, index) => (
                    <div key={index} className="flex items-start gap-3 bg-background rounded-lg p-4">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground text-sm">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Labirinty Project */}
        <section className="mb-16">
          <Card className="bg-accent/10 border-accent/30">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <BookOpen className="w-10 h-10 text-accent" />
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Проект «Лабиринты детской урологии»</h2>
                    <p className="text-muted-foreground">Авторский образовательный проект (с 2024 года)</p>
                  </div>
                </div>
                <Button
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => window.open("https://uroweb.ru/news/tarusin-d-i-priglashaet-prisoedinitsya-k-novomu-proektu-labirinti-detskoy-urologii", "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Присоединиться
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {labirintyEpisodes.map((episode, index) => (
                  <div key={index} className="bg-background rounded-lg p-4 border border-border">
                    <div className="text-sm text-primary font-medium mb-1">{episode.date}</div>
                    <div className="font-medium text-foreground">{episode.title}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Schools Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Всероссийская школа по детской урологии-андрологии</h2>
              <p className="text-muted-foreground">Сопредседатель ежегодной школы с 2012 года</p>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map((school, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="font-bold text-foreground">{school.name} ({school.year})</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{school.date}</p>
                  {school.location && <p className="text-sm text-muted-foreground">{school.location}</p>}
                  {school.note && <p className="text-sm text-primary mt-2">{school.note}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
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
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Видеолекции на Uro.TV</h2>
                <p className="text-muted-foreground">22+ докладов, 21 000+ просмотров</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => window.open("https://uro.tv/speaker2021/tarusin_dmitriy_igorevich", "_blank")}
              className="hidden md:flex"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Все выступления
            </Button>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videoLectures.slice(0, 9).map((lecture, index) => (
              <Card 
                key={index} 
                className="group cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent transition-colors">
                      <Play className="w-4 h-4 text-accent group-hover:text-accent-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors text-sm leading-tight mb-2">
                        {lecture.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{lecture.year}</span>
                        <span>•</span>
                        <span>{lecture.views} просм.</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => window.open("https://uro.tv/speaker2021/tarusin_dmitriy_igorevich", "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Смотреть все 22+ доклада на Uro.TV
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForDoctors;
