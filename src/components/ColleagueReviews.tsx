import { Card, CardContent } from "@/components/ui/card";
import { Quote, Award, GraduationCap, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";

const ColleagueReviews = () => {
  const { t } = useTranslation();

  const colleagueReviews = [
    {
      name: "Проф. И.В. Казанская",
      title: "Д.м.н., профессор, детский уролог",
      icon: Award,
      text: "Дмитрий Игоревич — один из немногих специалистов, кто по-настоящему понимает проблему мужского репродуктивного здоровья с детского возраста. Его вклад в создание специальности «детская урология-андрология» невозможно переоценить.",
    },
    {
      name: "К.м.н., врач высшей категории",
      title: "Детский хирург, стаж 25 лет",
      icon: Stethoscope,
      text: "Мастер-классы профессора Тарусина — это квинтэссенция десятилетий практического опыта. Его хирургическая техника поражает деликатностью и точностью. Многие методики, которые он разработал, стали стандартом в нашей практике.",
    },
    {
      name: "Участник Всероссийской школы ДУА",
      title: "Уролог-андролог, региональная больница",
      icon: GraduationCap,
      text: "Образовательные программы Дмитрия Игоревича кардинально изменили мой подход к диагностике и лечению. Его умение передать сложнейший материал доступным языком и практические навыки, полученные на мастер-классах, бесценны.",
    },
    {
      name: "Врач-хирург",
      title: "Детская городская больница, Москва",
      icon: Stethoscope,
      text: "Работая с профессором Тарусиным, я поражаюсь его преданности делу. Даже после десятков тысяч операций он подходит к каждому случаю как к уникальному. Для молодых врачей — это школа жизни, а не только хирургии.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{t("reviews.colleagueTitle")}</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">{t("reviews.colleagueSubtitle")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {colleagueReviews.map((review, index) => (
          <Card key={index} className="bg-card border-border hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <Quote className="w-6 h-6 text-primary/30 mb-3" />
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">«{review.text}»</p>
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <review.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ColleagueReviews;
