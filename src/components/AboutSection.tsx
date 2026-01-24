import { Card, CardContent } from "@/components/ui/card";
import { 
  Stethoscope, 
  Baby, 
  Heart, 
  Scissors, 
  Microscope, 
  Sparkles, 
  Brain, 
  MonitorCheck 
} from "lucide-react";

const specializations = [
  { icon: Heart, title: "Детская андрология", description: "Диагностика и лечение урологических заболеваний у мальчиков" },
  { icon: Stethoscope, title: "Взрослая андрология", description: "Мужское здоровье и репродуктивная функция" },
  { icon: Baby, title: "Педиатрия", description: "Комплексное наблюдение и лечение детей" },
  { icon: Scissors, title: "Детская хирургия", description: "Хирургическое лечение врождённых и приобретённых патологий" },
  { icon: Microscope, title: "Микрохирургия", description: "Высокоточные операции с использованием микроскопа" },
  { icon: Sparkles, title: "Пластическая хирургия", description: "Реконструктивные и эстетические операции" },
  { icon: Brain, title: "Сексология", description: "Консультации по вопросам интимного здоровья" },
  { icon: MonitorCheck, title: "УЗИ-диагностика", description: "Ультразвуковое исследование органов" },
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
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Доктор медицинских наук, профессор, член-корреспондент РАЕН. 
            Создатель отделения урологии и андрологии в Морозовской детской больнице. 
            Более 32 лет помогаю пациентам от новорождённых до взрослых.
          </p>
        </div>

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
                    За более чем 25 лет практики я помог тысячам пациентов — от новорождённых 
                    до взрослых мужчин. Каждый случай уникален, и я убеждён, что успешное 
                    лечение начинается с внимательного отношения к пациенту.
                  </p>
                  <p>
                    Сочетание глубоких знаний в различных областях медицины позволяет мне 
                    находить оптимальные решения даже в сложных клинических ситуациях. 
                    Использую современные методы диагностики и лечения, постоянно совершенствую 
                    свои навыки и слежу за мировыми достижениями в медицине.
                  </p>
                  <p>
                    Моя цель — не просто устранить симптомы, а помочь пациенту вернуться 
                    к полноценной здоровой жизни.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-xl p-6 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">32</div>
                  <div className="text-sm text-muted-foreground">Года опыта</div>
                </div>
                <div className="bg-secondary rounded-xl p-6 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">д.м.н.</div>
                  <div className="text-sm text-muted-foreground">Доктор наук</div>
                </div>
                <div className="bg-secondary rounded-xl p-6 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">200</div>
                  <div className="text-sm text-muted-foreground">Операций в год</div>
                </div>
                <div className="bg-secondary rounded-xl p-6 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">22+</div>
                  <div className="text-sm text-muted-foreground">Отзывов 5.0★</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specializations */}
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Мои специализации
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Комплексный подход к здоровью пациентов благодаря экспертизе в 8 направлениях медицины
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {specializations.map((spec, index) => (
            <Card 
              key={index} 
              className="group bg-card border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <spec.icon className="w-7 h-7 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">{spec.title}</h4>
                <p className="text-sm text-muted-foreground">{spec.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
