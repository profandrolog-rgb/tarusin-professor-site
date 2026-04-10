import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

interface BeforeAfterCase {
  id: string;
  category: string;
  title: string;
  description: string;
  beforeLabel?: string;
  afterLabel?: string;
}

const cases: BeforeAfterCase[] = [
  {
    id: "1",
    category: "Гипоспадия",
    title: "Коррекция дистальной гипоспадии",
    description: "Одноэтапная коррекция у ребёнка 2 лет. Отличный косметический результат.",
  },
  {
    id: "2",
    category: "Варикоцеле",
    title: "Микрохирургическая варикоцелэктомия",
    description: "Операция методом Мармара у подростка 15 лет. Полное восстановление кровотока.",
  },
  {
    id: "3",
    category: "Крипторхизм",
    title: "Орхипексия при паховом крипторхизме",
    description: "Низведение яичка у ребёнка 1.5 лет. Успешная фиксация в мошонке.",
  },
  {
    id: "4",
    category: "Фимоз",
    title: "Пластика крайней плоти",
    description: "Органосохраняющая операция у ребёнка 5 лет без циркумцизии.",
  },
];

const categories = ["Все", ...Array.from(new Set(cases.map(c => c.category)))];

const SliderPlaceholder = ({ label }: { label: string }) => (
  <div className="relative w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 flex">
      <div className="w-1/2 bg-muted-foreground/5 flex items-center justify-center border-r border-border">
        <span className="text-xs text-muted-foreground font-medium">До</span>
      </div>
      <div className="w-1/2 bg-primary/5 flex items-center justify-center">
        <span className="text-xs text-muted-foreground font-medium">После</span>
      </div>
    </div>
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="text-center p-4">
        <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">Фотографии доступны на приёме</p>
        <p className="text-xs text-muted-foreground mt-1">В целях конфиденциальности пациентов</p>
      </div>
    </div>
  </div>
);

const BeforeAfterGallery = () => {
  const [activeCategory, setActiveCategory] = useState("Все");

  const filtered = activeCategory === "Все" ? cases : cases.filter(c => c.category === activeCategory);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Результаты операций
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Примеры хирургических вмешательств с описанием методики и результатов
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Cases grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {filtered.map(c => (
            <Card key={c.id} className="overflow-hidden border-border">
              <SliderPlaceholder label={c.title} />
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">{c.category}</Badge>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-sm text-muted-foreground">
            Полная фотодокументация результатов доступна на очной консультации.{" "}
            <a href="#contact" className="text-primary hover:underline">Записаться на приём →</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterGallery;
