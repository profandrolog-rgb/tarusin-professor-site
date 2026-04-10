import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BeforeAfterCase {
  id: string;
  categoryRu: string;
  categoryEn: string;
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
}

const cases: BeforeAfterCase[] = [
  { id: "1", categoryRu: "Гипоспадия", categoryEn: "Hypospadias", titleRu: "Коррекция дистальной гипоспадии", titleEn: "Distal Hypospadias Repair", descRu: "Одноэтапная коррекция у ребёнка 2 лет. Отличный косметический результат.", descEn: "Single-stage repair in a 2-year-old child. Excellent cosmetic outcome." },
  { id: "2", categoryRu: "Варикоцеле", categoryEn: "Varicocele", titleRu: "Микрохирургическая варикоцелэктомия", titleEn: "Microsurgical Varicocelectomy", descRu: "Операция методом Мармара у подростка 15 лет. Полное восстановление кровотока.", descEn: "Marmar technique in a 15-year-old adolescent. Full blood flow restoration." },
  { id: "3", categoryRu: "Крипторхизм", categoryEn: "Cryptorchidism", titleRu: "Орхипексия при паховом крипторхизме", titleEn: "Orchiopexy for Inguinal Cryptorchidism", descRu: "Низведение яичка у ребёнка 1.5 лет. Успешная фиксация в мошонке.", descEn: "Testicular descent in a 1.5-year-old. Successful fixation in the scrotum." },
  { id: "4", categoryRu: "Фимоз", categoryEn: "Phimosis", titleRu: "Пластика крайней плоти", titleEn: "Foreskin Plasty", descRu: "Органосохраняющая операция у ребёнка 5 лет без циркумцизии.", descEn: "Organ-preserving surgery in a 5-year-old without circumcision." },
];

const BeforeAfterGallery = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [activeCategory, setActiveCategory] = useState(t("gallery.all"));

  const allCategories = [t("gallery.all"), ...Array.from(new Set(cases.map(c => isEn ? c.categoryEn : c.categoryRu)))];
  const filtered = activeCategory === t("gallery.all") ? cases : cases.filter(c => (isEn ? c.categoryEn : c.categoryRu) === activeCategory);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("gallery.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("gallery.subtitle")}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {allCategories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {filtered.map(c => (
            <Card key={c.id} className="overflow-hidden border-border">
              <div className="relative w-full aspect-[4/3] bg-muted rounded-t-lg overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 bg-muted-foreground/5 flex items-center justify-center border-r border-border">
                    <span className="text-xs text-muted-foreground font-medium">{isEn ? "Before" : "До"}</span>
                  </div>
                  <div className="w-1/2 bg-primary/5 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground font-medium">{isEn ? "After" : "После"}</span>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="text-center p-4">
                    <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">{t("gallery.photosOnVisit")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("gallery.privacyNote")}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">{isEn ? c.categoryEn : c.categoryRu}</Badge>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{isEn ? c.titleEn : c.titleRu}</h3>
                <p className="text-sm text-muted-foreground">{isEn ? c.descEn : c.descRu}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-sm text-muted-foreground">
            {t("gallery.fullPhotos")}{" "}
            <a href="#contact" className="text-primary hover:underline">{t("gallery.bookLink")}</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterGallery;
