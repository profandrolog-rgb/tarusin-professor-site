import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FileText, Award, Microscope } from "lucide-react";

const publications = [
  { title: "Неотложная педиатрия", year: "2024" },
  { title: "Результаты открытого сравнительного клинического исследования крем-геля для наружного применения «Баланекс® Кидс» у детей с воспалительными заболеваниями препуциального мешка и головки полового члена", year: "2024" },
  { title: "Monitoring of freezing patterns within 3D collagen-hydroxyapatite scaffolds using infrared thermography", year: "2023" },
  { title: "Лимфангиома мошонки", year: "2023" },
  { title: "Towards cryopreservation of scaffold-less and scaffold-based tissue-engineered constructs", year: "2022" },
  { title: "Coaxial alginate hydrogels: from self-assembled 3D cellular constructs to long-term storage", year: "2021" },
  { title: "Вопросы профилактики андрологической патологии и гигиены половых органов у мальчиков дошкольного возраста", year: "2021" },
  { title: "Опыт применения операции Мармара в модификации научно-практического центра детской андрологии у детей и подростков с левосторонним варикоцеле", year: "2020" },
  { title: "Новый принцип ультразвуковой диагностики варикоцеле у детей и подростков", year: "2020" },
  { title: "Гигиенические аспекты использования одноразовых подгузников", year: "2020" },
  { title: "Детский хирургический стационар кратковременного пребывания в условиях мегаполиса", year: "2019" },
  { title: "Физиологическое нижнее белье для мужчин (патент)", year: "2018" },
  { title: "Профилактика нарушений репродуктивного здоровья детей и подростков", year: "2018" },
  { title: "Руководство по гигиене детей и подростков, медицинскому обеспечению обучающихся в образовательных организациях", year: "2018" },
  { title: "Здоровье здорового человека (3-е издание)", year: "2016" },
  { title: "Значимость определения концентрации ингибина В крови у юношей-подростков с заболеваниями органов репродуктивной системы", year: "2016" },
  { title: "Encapsulation of mesenchymal stromal cells in alginate microspheres", year: "2016" },
  { title: "Новые аппаратные и медикаментозные технологии последнего десятилетия в детской урологии", year: "2014" },
  { title: "Ультразвуковые исследования при патологии органов мошонки", year: "2014" },
  { title: "Фертильность подростков и молодых мужчин, излеченных от лимфомы Ходжкина", year: "2013" },
  { title: "Комбинированный поясной предмет одежды для мужчин (патент)", year: "2011" },
  { title: "Гонадотоксичность терапии лимфомы Ходжкина у подростков и молодых мужчин: актуальность проблемы и пути решения", year: "2011" },
  { title: "Оценка гонадотоксичности терапии по схеме ВЕАСОРР-14 у молодых мужчин, излеченных от лимфомы Ходжкина", year: "2011" },
  { title: "Физиологические параметры содержания свободной биологически активной фракции тестостерона в слюне у здоровых мальчиков 2-18 лет", year: "2010" },
  { title: "Recovery of spermatogenesis in treated Hodgkin's lymphoma young males", year: "2010" },
  { title: "Комментарий редакционной коллегии на статью: Лапароскопическая варикоцелэктомия — амбулаторная операция?", year: "2010" },
  { title: "Вульвовагинит — пособие по обследованию состояния репродуктивной системы детей и подростков", year: "2009" },
  { title: "Пособие по обследованию состояния репродуктивной системы детей и подростков", year: "2009" },
  { title: "Исходное и конечное состояние сперматогенеза у пациентов с варикоцеле — 15 лет анализа и прогноза", year: "2009" },
  { title: "Варикоцеле у детей и подростков — стратегия выбора тактики и прогнозирования фертильности", year: "2009" },
  { title: "Варикоцеле — ab ovo ad absurdum (в продолжение дискуссии)", year: "2008" },
  { title: "Клинические случаи микролитиаза яичек у детей", year: "2008" },
  { title: "Информация о Межрегиональной общественной организации детских урологов-андрологов", year: "2007" },
  { title: "Охрана репродуктивного здоровья мальчиков", year: "2007" },
  { title: "Организация анестезиологической помощи детям в амбулаторной хирургической практике", year: "2006" },
  { title: "Эффективная коммуникация — за и против. Консультирование в практике детской андрологии: этика, мораль и закон", year: "2006" },
  { title: "Факторы риска репродуктивных расстройств у мальчиков и юношей-подростков (докторская диссертация)", year: "2005" },
  { title: "Воспалительные заболевания в детской андрологической практике", year: "2005" },
  { title: "Поражения семявыносящих путей у детей и подростков", year: "2005" },
  { title: "Педиатрическая уроандрология в системе профессионального медицинского непрерывного образования", year: "2005" },
  { title: "Развитие андрологической помощи детям в Российской Федерации", year: "2005" },
  { title: "Заболевания и патологические состояния крайней плоти у детей", year: "2005" },
  { title: "Предикторы репродуктивных расстройств в современной популяции мальчиков", year: "2005" },
  { title: "К вопросу о скрининговой оценке состояния репродуктивной системы подростков и юношей", year: "2004" },
  { title: "Детская и подростковая андрология: охрана репродуктивного здоровья", year: "2004" },
  { title: "Организация (концепция) помощи детям с мочеполовой патологией", year: "2004" },
  { title: "Кистозные заболевания органов мошонки у детей", year: "2002" },
  { title: "К вопросу кровообращения гонад у детей", year: "2002" },
  { title: "«Острая мошонка» у детей. Всегда ли оправдана ревизия сегодня?", year: "2002" },
  { title: "Пубертатный период — проблемы подростков и родителей", year: "2002" },
  { title: "Руководство по охране репродуктивного здоровья", year: "2001" },
  { title: "Организация андрологической помощи детям. Организация гинекологической и андрологической помощи детям", year: "2001" },
  { title: "Дифференцированная тактика лечения варикоцеле у детей и подростков", year: "2001" },
  { title: "Варикоцеле у детей и подростков — клинико-эхографические параллели", year: "2000" },
  { title: "Охрана репродуктивного здоровья мальчиков и юношей-подростков (Информационное письмо МЗ РФ)", year: "1999" },
];

const stats = [
  { icon: FileText, value: "61+", label: "Научных публикаций" },
  { icon: BookOpen, value: "6", label: "Глав в нац. руководствах" },
  { icon: Award, value: "3", label: "Патента на изобретения" },
  { icon: Microscope, value: "1210+", label: "Цитирований" },
];

const Publications = () => {
  // Группируем публикации по десятилетиям
  const groupedPublications = publications.reduce((acc, pub) => {
    const decade = Math.floor(parseInt(pub.year) / 10) * 10;
    const decadeLabel = `${decade}-е`;
    if (!acc[decadeLabel]) {
      acc[decadeLabel] = [];
    }
    acc[decadeLabel].push(pub);
    return acc;
  }, {} as Record<string, typeof publications>);

  const sortedDecades = Object.keys(groupedPublications).sort((a, b) => 
    parseInt(b) - parseInt(a)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 md:pt-24">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-secondary/50 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Научные публикации
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-12">
                Полный список научных работ профессора Тарусина Д.И., включая статьи в рецензируемых журналах, 
                главы в национальных руководствах и патенты
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-6 text-center">
                      <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                      <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Publications List */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {sortedDecades.map((decade) => (
                <div key={decade} className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                    <span className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
                      {decade}
                    </span>
                    <span className="text-muted-foreground text-base font-normal">
                      ({groupedPublications[decade].length} публикаций)
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {groupedPublications[decade].map((pub, index) => (
                      <Card 
                        key={index} 
                        className="bg-card hover:bg-secondary/50 transition-colors border-border/50"
                      >
                        <CardContent className="p-4 md:p-5">
                          <div className="flex items-start gap-4">
                            <span className="flex-shrink-0 w-14 text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                              {pub.year}
                            </span>
                            <p className="text-foreground leading-relaxed">
                              {pub.title}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Source Note */}
        <section className="py-8 bg-secondary/30">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm text-muted-foreground">
              Источник: Научная электронная библиотека eLIBRARY.RU • SPIN-код автора: 5840-2109
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Publications;
