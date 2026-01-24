import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, BookOpen, GraduationCap } from "lucide-react";

const courses = [
  {
    title: "Основы детской андрологии",
    description: "Курс для педиатров и детских хирургов. Диагностика и лечение урологических заболеваний у мальчиков.",
    duration: "16 часов",
    format: "Очно",
    audience: "Для врачей",
    price: "25 000 ₽",
    badge: "Популярный",
  },
  {
    title: "Микрохирургические техники",
    description: "Мастер-класс по современным микрохирургическим методикам в андрологии и урологии.",
    duration: "8 часов",
    format: "Очно",
    audience: "Для хирургов",
    price: "35 000 ₽",
    badge: null,
  },
  {
    title: "Здоровье мальчика",
    description: "Лекция для родителей о развитии и профилактике урологических проблем у мальчиков разного возраста.",
    duration: "2 часа",
    format: "Онлайн",
    audience: "Для родителей",
    price: "Бесплатно",
    badge: "Бесплатно",
  },
  {
    title: "УЗИ в андрологии",
    description: "Практический курс по ультразвуковой диагностике в детской и взрослой андрологии.",
    duration: "12 часов",
    format: "Очно",
    audience: "Для врачей",
    price: "20 000 ₽",
    badge: null,
  },
];

const CoursesSection = () => {
  const scrollToContact = () => {
    const element = document.querySelector("#contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="courses" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <GraduationCap size={16} />
            <span>Образовательные программы</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Курсы и обучение
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Делюсь многолетним опытом с коллегами и помогаю родителям 
            лучше понимать здоровье своих детей
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course, index) => (
            <Card 
              key={index} 
              className="bg-card border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <CardHeader className="pb-4">
                {course.badge && (
                  <Badge 
                    className={`w-fit mb-2 ${
                      course.badge === "Бесплатно" 
                        ? "bg-green-100 text-green-700 hover:bg-green-100" 
                        : "bg-accent/10 text-accent hover:bg-accent/10"
                    }`}
                  >
                    {course.badge}
                  </Badge>
                )}
                <CardTitle className="text-lg leading-tight">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{course.format}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{course.audience}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pt-4 border-t border-border">
                <div className="text-2xl font-bold text-foreground w-full">{course.price}</div>
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Узнать подробнее
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Не нашли подходящий курс? Свяжитесь со мной для организации индивидуального обучения
          </p>
          <Button 
            variant="outline" 
            size="lg"
            onClick={scrollToContact}
          >
            Связаться для консультации
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
