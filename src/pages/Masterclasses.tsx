import { ArrowLeft, Calendar, MapPin, Users, Presentation, Globe, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageMeta from "@/components/PageMeta";
import { useTranslation } from "react-i18next";

const Masterclasses = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const pastEvents = isEn ? [
    { year: "2024", events: [
      { title: "Labyrinths of Pediatric Urology", location: "Moscow", type: "Author's Project", description: "Educational project for physicians — systematization of knowledge in pediatric urology-andrology" },
      { title: "National School of Pediatric Urology-Andrology", location: "Russia", type: "School", description: "Annual educational program for physicians from across the country" },
    ]},
    { year: "2023", events: [
      { title: "Congress of the Russian Society of Urologists", location: "Moscow", type: "Report", description: "Plenary reports on diagnosis and treatment of pediatric reproductive system diseases" },
      { title: "International Congress of Pediatric Surgeons", location: "International", type: "Presentation", description: "Presentation of original microsurgical treatment techniques" },
    ]},
    { year: "2022", events: [
      { title: "School of Pediatric Andrology", location: "Moscow", type: "School", description: "Practical master classes for young specialists" },
      { title: "Reproductive Medicine Conference", location: "St. Petersburg", type: "Report", description: "Modern approaches to preserving male reproductive health" },
    ]},
  ] : [
    { year: "2024", events: [
      { title: "Лабиринты детской урологии", location: "Москва", type: "Авторский проект", description: "Образовательный проект для врачей — систематизация знаний в детской урологии-андрологии" },
      { title: "Всероссийская школа по детской урологии-андрологии", location: "Россия", type: "Школа", description: "Ежегодная образовательная программа для врачей со всей страны" },
    ]},
    { year: "2023", events: [
      { title: "Конгресс Российского общества урологов", location: "Москва", type: "Доклад", description: "Пленарные доклады по диагностике и лечению заболеваний репродуктивной системы у детей" },
      { title: "Международный конгресс детских хирургов", location: "Международный", type: "Выступление", description: "Презентация авторских методик микрохирургического лечения" },
    ]},
    { year: "2022", events: [
      { title: "Школа детской андрологии", location: "Москва", type: "Школа", description: "Практические мастер-классы для молодых специалистов" },
      { title: "Конференция по репродуктивной медицине", location: "Санкт-Петербург", type: "Доклад", description: "Современные подходы к сохранению мужского репродуктивного здоровья" },
    ]},
  ];

  const stats = [
    { icon: Presentation, value: "860+", label: isEn ? "Presentations & reports" : "Выступлений и докладов" },
    { icon: Globe, value: "15+", label: isEn ? "Countries for master classes" : "Стран для мастер-классов" },
    { icon: Users, value: "600+", label: isEn ? "Trained physicians" : "Обученных врачей" },
    { icon: Award, value: "12+", label: isEn ? "Years of PUA School" : "Лет школы ДУА" },
  ];

  const typeColors: Record<string, string> = {
    "Школа": "bg-primary/10 text-primary", "School": "bg-primary/10 text-primary",
    "Доклад": "bg-accent/10 text-accent-foreground", "Report": "bg-accent/10 text-accent-foreground",
    "Выступление": "bg-secondary text-foreground", "Presentation": "bg-secondary text-foreground",
    "Авторский проект": "bg-primary/20 text-primary", "Author's Project": "bg-primary/20 text-primary",
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={isEn ? "Master Classes & Presentations — Prof. Tarusin D.I." : "Мастер-классы и выступления — Проф. Тарусин Д.И."}
        description={isEn ? "Master classes, presentations, and educational programs by Professor Tarusin. Over 860 reports, training physicians from 15+ countries." : "Мастер-классы, выступления и образовательные программы профессора Тарусина. Более 860 докладов, обучение врачей из 15+ стран."}
        path="/masterclasses"
      />
      <header className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />{isEn ? "Home" : "На главную"}
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{isEn ? "Master Classes & Presentations" : "Мастер-классы и выступления"}</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            {isEn ? "Educational activities, lectures, and international presentations by Professor Tarusin" : "Образовательная деятельность, лекции и международные выступления профессора Тарусина"}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, i) => (
            <Card key={i} className="bg-secondary border-none">
              <CardContent className="p-6 text-center">
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-12 bg-primary/5 border-primary/20">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />{isEn ? "Current Projects" : "Текущие проекты"}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-background rounded-lg p-4 border border-border">
                <Badge className={typeColors[isEn ? "Author's Project" : "Авторский проект"]}>{isEn ? "Author's Project" : "Авторский проект"}</Badge>
                <h3 className="font-semibold text-foreground mt-2 mb-1">{isEn ? "Labyrinths of Pediatric Urology" : "Лабиринты детской урологии"}</h3>
                <p className="text-sm text-muted-foreground">
                  {isEn ? "Educational project for physicians since 2024. Systematization of 42 years of experience in practical case reviews and clinical recommendations." : "Образовательный проект для врачей с 2024 года. Систематизация 42-летнего опыта в формате практических разборов и клинических рекомендаций."}
                </p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <Badge className={typeColors[isEn ? "School" : "Школа"]}>{isEn ? "Annual" : "Ежегодная"}</Badge>
                <h3 className="font-semibold text-foreground mt-2 mb-1">{isEn ? "National School of PUA" : "Всероссийская школа по ДУА"}</h3>
                <p className="text-sm text-muted-foreground">
                  {isEn ? "Co-chair since 2012. Annual training program for pediatric urology-andrology specialists from across Russia." : "Сопредседатель с 2012 года. Ежегодная программа подготовки врачей-специалистов по детской урологии-андрологии со всей России."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">{isEn ? "Presentation Archive" : "Архив выступлений"}</h2>
        <div className="space-y-8 max-w-4xl mx-auto">
          {pastEvents.map((group) => (
            <div key={group.year}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">{group.year}</span>
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid md:grid-cols-2 gap-4 ml-7">
                {group.events.map((event, i) => (
                  <Card key={i} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className={typeColors[event.type] || ""}>{event.type}</Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 text-sm">{event.title}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="w-3 h-3" />{event.location}
                      </div>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Card className="mt-12 bg-primary text-primary-foreground">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{isEn ? "Master Class Invitation" : "Приглашение на мастер-класс"}</h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-6">
              {isEn ? "Professor Tarusin is open to invitations for conferences, master classes, and educational events. To arrange a presentation, please use the contact form." : "Профессор Тарусин открыт к приглашениям на конференции, мастер-классы и образовательные мероприятия. Для организации выступления свяжитесь через форму обратной связи."}
            </p>
            <Link to="/contacts">
              <button className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 rounded-md font-medium transition-colors">
                {isEn ? "Contact" : "Связаться"}
              </button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Masterclasses;
