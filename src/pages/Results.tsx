import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert, Lock, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";

const COOKIE_NAME = "age_confirmed_18";
const COOKIE_DAYS = 365;

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, days: number) {
  const d = new Date();
  d.setTime(d.getTime() + days * 86400000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

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

const Results = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [confirmed, setConfirmed] = useState(true);
  const [denied, setDenied] = useState(false);
  const [activeCategory, setActiveCategory] = useState(t("gallery.all"));

  useEffect(() => {
    setConfirmed(getCookie(COOKIE_NAME) === "true");
  }, []);

  const handleConfirm = () => {
    setCookie(COOKIE_NAME, "true", COOKIE_DAYS);
    setConfirmed(true);
  };

  const handleDeny = () => {
    setDenied(true);
  };

  const allCategories = [t("gallery.all"), ...Array.from(new Set(cases.map(c => isEn ? c.categoryEn : c.categoryRu)))];
  const filtered = activeCategory === t("gallery.all") ? cases : cases.filter(c => (isEn ? c.categoryEn : c.categoryRu) === activeCategory);

  if (denied) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <ShieldAlert className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isEn ? "Access Denied" : "Доступ ограничен"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isEn ? "This section is only available for adults (18+)." : "Данный раздел доступен только для лиц старше 18 лет."}
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isEn ? "Back to Home" : "На главную"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={isEn ? "Surgical Results — Professor Tarusin" : "Результаты операций — Профессор Тарусин"}
        description={isEn ? "Before and after surgical results by Professor Tarusin. Adult content (18+)." : "Результаты операций до и после. Контент 18+."}
        path="/results"
      />

      {/* Age Gate Modal */}
      <Dialog open={!confirmed} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-destructive" />
              </div>
              <DialogTitle className="text-xl">
                {isEn ? "Age Restriction 18+" : "Возрастное ограничение 18+"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {isEn
                ? "This section contains medical images and clinical photographs of a scientific and educational nature. They are not intended to arouse sexual interest. All materials are published with informed consent for scientific and educational purposes. View at your own discretion."
                : "Материалы данного раздела носят научно-образовательный характер и содержат медицинские изображения и фотографии клинических случаев. Они не предназначены для возбуждения сексуального интереса. Все материалы опубликованы на основании информированного согласия для научных и образовательных целей. Просмотр осуществляется на ваш страх и риск."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleConfirm} className="flex-1" size="lg">
              {isEn ? "I am 18+, continue" : "Мне есть 18 лет, продолжить"}
            </Button>
            <Button onClick={handleDeny} variant="outline" className="flex-1" size="lg">
              {isEn ? "Go back" : "Назад"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {confirmed && (
        <>
          <Header />
          <main className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              <div className="mb-6">
                <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  {isEn ? "Back to Home" : "На главную"}
                </Link>
              </div>

              <div className="text-center mb-12">
                <Badge variant="destructive" className="mb-4">18+</Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("gallery.title")}</h1>
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
                  <Link to="/contacts" className="text-primary hover:underline">{t("gallery.bookLink")}</Link>
                </p>
              </div>
            </div>
          </main>
          <Footer />
        </>
      )}
    </div>
  );
};

export default Results;
