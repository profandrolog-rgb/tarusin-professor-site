import { Trophy, Star, Lightbulb, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const pioneerItems = [
  {
    icon: Trophy,
    year: "2003",
    title: "Создание специальности «Детская урология-андрология»",
    description: "Совместно с профессором И.В. Казанской впервые в России организована и утверждена новая медицинская специальность",
  },
  {
    icon: Lightbulb,
    year: "2001",
    title: "Первый Центр детской и подростковой андрологии",
    description: "Создан и возглавлен первый в России городской Центр детской и подростковой андрологии г. Москвы",
  },
  {
    icon: Globe,
    year: "2018",
    title: "Единственный в России Центр охраны репродуктивного здоровья",
    description: "Городской центр охраны репродуктивного здоровья детей и подростков на базе Морозовской ДГКБ — единственный в стране",
  },
  {
    icon: Star,
    year: "2012",
    title: "Всероссийская школа по детской урологии-андрологии",
    description: "Сопредседатель ежегодной Всероссийской школы — образовательная платформа для врачей по всей стране",
  },
  {
    icon: Lightbulb,
    year: "2005",
    title: "Докторская диссертация — фундамент специальности",
    description: "Защищена первая в России докторская диссертация по детской андрологии, определившая стандарты диагностики и лечения",
  },
  {
    icon: Globe,
    year: "2024",
    title: "Проект «Лабиринты детской урологии»",
    description: "Авторский образовательный проект для врачей — систематизация знаний и обмен опытом в детской урологии-андрологии",
  },
];

const PioneersSection = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <Trophy size={16} />
            <span>Впервые в России</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Пионер детской андрологии
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Уникальные достижения профессора Тарусина, определившие развитие целого направления медицины в России
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {pioneerItems.map((item, index) => (
            <Card
              key={index}
              className="group bg-card border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-primary mb-1">{item.year}</div>
                    <h3 className="font-semibold text-foreground mb-2 text-sm leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PioneersSection;
