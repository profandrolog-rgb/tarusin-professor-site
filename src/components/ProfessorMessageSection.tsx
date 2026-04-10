import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const ProfessorMessageSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-primary/5 border-primary/20 overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-8">
                <Quote className="w-8 h-8 text-primary" />
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Обращение профессора
                </h2>
              </div>

              <div className="space-y-5 text-muted-foreground leading-relaxed">
                <p className="text-lg">
                  Дорогие родители и пациенты,
                </p>
                <p>
                  За более чем 42 года в медицине я видел тысячи семей, которые приходили ко мне 
                  с тревогой и уходили с надеждой. Каждый ребёнок, каждый пациент — это отдельная 
                  история, требующая индивидуального подхода, терпения и глубокого понимания проблемы.
                </p>
                <p>
                  Детская урология-андрология — это специальность, которую я создавал в России 
                  с нуля. Когда в 2003 году мы с профессором Казанской И.В. формировали это направление, 
                  многие коллеги были настроены скептически. Но сегодня тысячи мальчиков и юношей 
                  получают квалифицированную помощь благодаря тому, что мы не сдались.
                </p>
                <p>
                  Я убеждён: хороший врач — это не тот, кто больше всех оперирует, а тот, 
                  кто точно знает, когда операция нужна, а когда — нет. Мой принцип — минимальная 
                  инвазивность при максимальном результате. Каждая операция выполняется с деликатностью, 
                  сопоставимой с офтальмологической хирургией.
                </p>
                <p>
                  Когда вы пишете мне или приходите на приём — знайте: я буду относиться к вашему 
                  ребёнку так, как если бы это был мой собственный. Это не просто слова, 
                  это моё профессиональное кредо.
                </p>
                <p className="text-foreground font-medium italic">
                  Искренне ваш, профессор Д.И. Тарусин
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProfessorMessageSection;
