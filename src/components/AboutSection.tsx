import { Card, CardContent } from "@/components/ui/card";
import { 
  Stethoscope, 
  Baby, 
  Heart, 
  Scissors, 
  Microscope, 
  Sparkles, 
  Brain, 
  MonitorCheck,
  Shield,
  Bone,
  Building
} from "lucide-react";

const specializations = [
  { icon: Heart, title: "Детская урология-андрология", description: "Создатель специальности в России (с 2003 года)" },
  { icon: Stethoscope, title: "Урология взрослых", description: "Диагностика и лечение мужских заболеваний" },
  { icon: Baby, title: "Педиатрия", description: "Комплексное наблюдение и лечение детей" },
  { icon: Scissors, title: "Детская хирургия", description: "Хирургическое лечение врождённых и приобретённых патологий" },
  { icon: Microscope, title: "Микрохирургия", description: "Операции с точностью офтальмологической хирургии" },
  { icon: Sparkles, title: "Пластическая хирургия", description: "Реконструктивные и эстетические операции" },
  { icon: Brain, title: "Сексология", description: "Консультации по вопросам интимного здоровья" },
  { icon: MonitorCheck, title: "УЗИ-диагностика", description: "Мировой эксперт в УЗИ органов репродуктивной системы" },
  { icon: Bone, title: "Травматология-ортопедия", description: "Лечение травм и патологий опорно-двигательного аппарата" },
  { icon: Building, title: "Организация здравоохранения", description: "Руководство Городским центром охраны репродуктивного здоровья" },
];

const achievements = [
  { value: "32", label: "Года опыта" },
  { value: "126+", label: "Научных статей" },
  { value: "6", label: "Глав в нац. руководствах" },
  { value: "9+", label: "Подготовленных кандидатов наук" },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Обо мне
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Доктор медицинских наук (с 2005 года), профессор, член-корреспондент РАЕН, врач высшей категории. 
            В медицине с 13 лет, в хирургии с 14 лет. В 2003 году совместно с профессором Казанской И.В. 
            организовал новую медицинскую специальность «детская урология-андрология» в России.
          </p>
        </div>

        {/* Current Positions */}
        <Card className="mb-12 md:mb-16 bg-primary/5 border-primary/20">
          <CardContent className="p-6 md:p-10">
            <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
              <Shield className="w-7 h-7 text-primary" />
              Текущие должности
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="font-medium text-foreground">Руководитель Городского центра охраны репродуктивного здоровья детей и подростков</p>
                <p className="text-sm text-muted-foreground mt-1">Морозовская ДГКБ — единственный в России (с 2018 года)</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="font-medium text-foreground">Заместитель директора по науке</p>
                <p className="text-sm text-muted-foreground mt-1">Международный центр андрологии, Москва</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="font-medium text-foreground">Консультант</p>
                <p className="text-sm text-muted-foreground mt-1">Семейная клиника доктора Матара</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="font-medium text-foreground">Сопредседатель Всероссийской школы по детской урологии-андрологии</p>
                <p className="text-sm text-muted-foreground mt-1">С 2012 года</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border md:col-span-2">
                <p className="font-medium text-foreground">Автор и ведущий проекта «Лабиринты детской урологии»</p>
                <p className="text-sm text-muted-foreground mt-1">С 2024 года — образовательный проект для врачей</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio Card */}
        <Card className="mb-12 md:mb-16 bg-card border-border shadow-lg">
          <CardContent className="p-6 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  Мой подход к лечению
                </h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    За более чем 32 года практики я помог тысячам пациентов — от новорождённых 
                    до взрослых мужчин. Каждый случай уникален, и я убеждён, что успешное 
                    лечение начинается с внимательного отношения к пациенту.
                  </p>
                  <p>
                    Мои операции выполняются с деликатностью, сопоставимой с офтальмологической хирургией. 
                    Использую современные микрохирургические методы при крипторхизме, водянке, 
                    варикоцеле и сперматоцеле.
                  </p>
                  <p>
                    Признанный в мире эксперт в ультразвуковой диагностике органов репродуктивной 
                    системы у детей и подростков.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {achievements.map((item, index) => (
                  <div key={index} className="bg-secondary rounded-xl p-6 text-center">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{item.value}</div>
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specializations */}
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Мои специализации и сертификаты
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Действующие сертификаты по 10+ направлениям медицины
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {specializations.map((spec, index) => (
            <Card 
              key={index} 
              className="group bg-card border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <spec.icon className="w-7 h-7 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2 text-sm">{spec.title}</h4>
                <p className="text-xs text-muted-foreground">{spec.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fun Fact */}
        <Card className="mt-12 bg-accent/10 border-accent/20">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              🦔 <span className="font-medium text-foreground">Интересный факт:</span> Коллекционирую фигурки ежей — 
              вторая по величине коллекция в мире (более 5800 экземпляров)!
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AboutSection;
