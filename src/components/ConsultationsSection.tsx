import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  FileText, 
  Stethoscope,
  Calendar
} from "lucide-react";

const childSymptoms = [
  "Проблемы с мочеиспусканием",
  "Боли в области паха или яичек",
  "Крипторхизм (неопущение яичка)",
  "Фимоз и парафимоз",
  "Варикоцеле",
  "Водянка яичка (гидроцеле)",
  "Паховые грыжи",
  "Нарушения полового развития",
  "Сперматоцеле",
  "Гинекомастия",
];

const adultSymptoms = [
  "Мужское бесплодие",
  "Нарушение потенции",
  "Угасание либидо",
  "Хроническая усталость",
  "Дефицит тестостерона",
  "Ожирение",
  "Нарушение обмена веществ",
  "Сексология",
  "Хроническая боль",
  "Эректильная дисфункция",
  "Реконструктивные операции",
  "Варикоцеле",
  "Дисгармоничный секс",
  "Искривления полового члена",
  "Болезнь Пейрони",
];

const preparations = [
  "Определите цели и ожидания от Вашего визита",
  "Вспомните историю своего заболевания и сопутствующих болезней",
  "Историю посещений врачей и лечение",
  "Возьмите с собой все имеющиеся медицинские документы",
  "Подготовьте список принимаемых препаратов",
  "Запишите вопросы, которые хотите обсудить",
  "При УЗИ мочевого пузыря — наполненный мочевой пузырь",
];

const ConsultationsSection = () => {
  const scrollToContact = () => {
    const element = document.querySelector("#contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="consultations" className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Консультации и приём
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Индивидуальный подход к каждому пациенту с применением 
            современных методов диагностики и лечения
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* How consultation works */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Stethoscope className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Путь пациента</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">Сбор анамнеза</p>
                  <p className="text-sm text-muted-foreground">Подробная беседа о жалобах и истории болезни</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">Осмотр</p>
                  <p className="text-sm text-muted-foreground">Физикальное обследование пациента</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">УЗИ-диагностика</p>
                  <p className="text-sm text-muted-foreground">При необходимости — ультразвуковое исследование</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <p className="font-medium text-foreground">Оценка результатов</p>
                  <p className="text-sm text-muted-foreground">Оценка результатов обследований и назначение дообследований при необходимости</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  5
                </div>
                <div>
                  <p className="font-medium text-foreground">План лечения</p>
                  <p className="text-sm text-muted-foreground">Индивидуальные рекомендации и назначения</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  6
                </div>
                <div>
                  <p className="font-medium text-foreground">Подготовка к операции</p>
                  <p className="text-sm text-muted-foreground">Обследования и рекомендации перед вмешательством</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  7
                </div>
                <div>
                  <p className="font-medium text-foreground">Операция</p>
                  <p className="text-sm text-muted-foreground">Хирургическое лечение с применением современных методик</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  8
                </div>
                <div>
                  <p className="font-medium text-foreground">Реабилитация</p>
                  <p className="text-sm text-muted-foreground">Послеоперационное наблюдение и восстановление</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  9
                </div>
                <div>
                  <p className="font-medium text-foreground">Пожизненное наблюдение</p>
                  <p className="text-sm text-muted-foreground">Наблюдение по мужским функциям и болезням</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What problems */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">С чем обращаются</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Children Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                    <span className="text-sm font-semibold text-primary">Дети</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {childSymptoms.map((symptom, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{symptom}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Adults Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                    <span className="text-sm font-semibold text-primary">Мужчины</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {adultSymptoms.map((symptom, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{symptom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preparation and Contact */}
          <div className="space-y-6">
            <Card className="bg-card border-border shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Как подготовиться</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {preparations.map((prep, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{prep}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground shadow-lg">
              <CardContent className="p-6 space-y-4">
                <h4 className="font-semibold text-lg">Контактная информация</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm">с. Немчиновка, 3-я Запрудная ул. дом 16, AVE-CLINIC</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" />
                    <span className="text-sm">+7 (495) 374-81-81 (для справок)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" />
                    <span className="text-sm">+7 (926) 600-555-0 (WhatsApp для записи)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" />
                    <span className="text-sm">+7 (977) 807-55-44 (для срочных вопросов)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm">Только по предварительной записи</span>
                  </div>
                </div>
                <Button 
                  onClick={scrollToContact}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4"
                >
                  Записаться на приём
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConsultationsSection;
