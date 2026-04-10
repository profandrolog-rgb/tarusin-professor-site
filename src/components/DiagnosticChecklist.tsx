import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Info, ArrowRight, RotateCcw } from "lucide-react";

interface CheckItem {
  id: string;
  text: string;
  weight: number;
  ageGroup?: string;
}

const checkItems: CheckItem[] = [
  { id: "1", text: "Одно или оба яичка не прощупываются в мошонке", weight: 3 },
  { id: "2", text: "Асимметрия или припухлость мошонки", weight: 2 },
  { id: "3", text: "Болезненность в области паха или мошонки", weight: 3 },
  { id: "4", text: "Невозможность обнажить головку полового члена", weight: 2 },
  { id: "5", text: "Покраснение или выделения из крайней плоти", weight: 2 },
  { id: "6", text: "Отверстие мочеиспускательного канала расположено не на верхушке головки", weight: 3 },
  { id: "7", text: "Ребёнок жалуется на боль при мочеиспускании", weight: 2 },
  { id: "8", text: "Струя мочи слабая, прерывистая или направлена в сторону", weight: 2 },
  { id: "9", text: "Энурез (ночное недержание) после 5 лет", weight: 1 },
  { id: "10", text: "Задержка или раннее начало полового развития", weight: 2 },
  { id: "11", text: "Увеличение грудных желёз у мальчика-подростка", weight: 1 },
  { id: "12", text: "Расширенные вены мошонки (видимые или прощупываемые)", weight: 2 },
];

const DiagnosticChecklist = () => {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setShowResult(false);
  };

  const totalWeight = Array.from(checked).reduce((sum, id) => {
    const item = checkItems.find(i => i.id === id);
    return sum + (item?.weight || 0);
  }, 0);

  const getResult = () => {
    if (totalWeight === 0) return null;
    if (totalWeight <= 2) return {
      level: "low" as const,
      title: "Низкая вероятность",
      text: "Вероятнее всего, срочной консультации не требуется. Однако профилактический осмотр андролога рекомендован всем мальчикам в возрасте 0, 1, 3, 6, 10, 14 и 17 лет.",
      color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      icon: <Info className="w-5 h-5" />,
    };
    if (totalWeight <= 5) return {
      level: "medium" as const,
      title: "Рекомендуется консультация",
      text: "Выявлены симптомы, которые желательно показать специалисту в плановом порядке. Запишитесь на приём в удобное время.",
      color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      icon: <AlertTriangle className="w-5 h-5" />,
    };
    return {
      level: "high" as const,
      title: "Настоятельно рекомендуем обратиться",
      text: "Выявлены симптомы, требующие осмотра детского андролога. Рекомендуем записаться на ближайшее доступное время.",
      color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      icon: <AlertTriangle className="w-5 h-5" />,
    };
  };

  const result = getResult();

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Нужна ли консультация андролога?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Пройдите простой чек-лист, чтобы понять, стоит ли обратиться к специалисту
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Отметьте наблюдаемые симптомы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {checkItems.map(item => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked.has(item.id) ? "bg-primary/5 border-primary/30" : "bg-card border-border hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    checked={checked.has(item.id)}
                    onCheckedChange={() => toggle(item.id)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-foreground leading-snug">{item.text}</span>
                </label>
              ))}

              <div className="pt-4 flex gap-3">
                <Button onClick={() => setShowResult(true)} disabled={checked.size === 0} className="flex-1">
                  Узнать результат <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                {checked.size > 0 && (
                  <Button variant="outline" onClick={() => { setChecked(new Set()); setShowResult(false); }}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {showResult && result && (
                <div className={`mt-4 p-4 rounded-xl border ${result.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.icon}
                    <h3 className="font-semibold">{result.title}</h3>
                  </div>
                  <p className="text-sm mb-3">{result.text}</p>
                  {result.level !== "low" && (
                    <Button asChild size="sm" className="mt-1">
                      <a href="#contact">Записаться на приём <ArrowRight className="w-3 h-3 ml-1" /></a>
                    </Button>
                  )}
                </div>
              )}

              <p className="text-[11px] text-muted-foreground text-center pt-2">
                Данный чек-лист носит информационный характер и не заменяет консультацию врача.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DiagnosticChecklist;
