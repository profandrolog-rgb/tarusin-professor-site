import { Button } from "@/components/ui/button";
import { Award, Syringe, Stethoscope, Users, Phone } from "lucide-react";
import professorPhoto from "@/assets/professor-photo.png";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const POSITION_KEY = "hero-photo-position";

const HeroSection = () => {
  const savedPos = localStorage.getItem(POSITION_KEY);
  const [objectPosition, setObjectPosition] = useState(savedPos || "center top");
  const [editing, setEditing] = useState(false);
  const { t } = useTranslation();

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="pt-20 md:pt-24 pb-16 md:pb-24 bg-gradient-to-b from-secondary/50 to-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Syringe size={16} />
              <span>{t("hero.badge")}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              {t("hero.firstName")}<br />
              <span className="text-primary">{t("hero.lastName")}</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-2">{t("hero.subtitle")}</p>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">{t("hero.specialties")}</p>

            <div className="flex flex-col gap-3 justify-center lg:justify-start">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => window.open("tel:+74953030000")} className="bg-accent hover:bg-accent/90 text-accent-foreground text-base px-6">
                  <Phone className="w-5 h-5 mr-2" />
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-xs opacity-80">{t("hero.mataraClinic")}</span>
                    <span>+7 (495) 303-00-00</span>
                  </span>
                </Button>
                <Button size="lg" onClick={() => window.open("tel:+74953748181")} className="bg-accent hover:bg-accent/90 text-accent-foreground text-base px-6">
                  <Phone className="w-5 h-5 mr-2" />
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-xs opacity-80">{t("hero.aveClinic")}</span>
                    <span>+7 (495) 374-81-81</span>
                  </span>
                </Button>
              </div>
              <div className="flex justify-center lg:justify-start">
                <Button size="lg" variant="outline" onClick={() => scrollToSection("#about")} className="text-lg px-8">
                  {t("hero.learnMore")}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-border">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 text-primary mb-1">
                  <Award size={20} />
                  <span className="text-2xl md:text-3xl font-bold">42</span>
                </div>
                <p className="text-sm text-muted-foreground">{t("hero.yearsExp")}</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 text-primary mb-1">
                  <Users size={20} />
                  <span className="text-2xl md:text-3xl font-bold">860+</span>
                </div>
                <p className="text-sm text-muted-foreground">{t("hero.presentations")}</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 text-primary mb-1">
                  <Stethoscope size={20} />
                  <span className="text-2xl md:text-3xl font-bold">126+</span>
                </div>
                <p className="text-sm text-muted-foreground">{t("hero.publicationsCount")}</p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative group">
              <div className="w-72 md:w-96 lg:w-[28rem] rounded-2xl bg-gradient-to-br from-primary to-primary/60 p-1 shadow-2xl">
                <img
                  src={professorPhoto}
                  alt={`${t("hero.firstName")} ${t("hero.lastName")}`}
                  className="w-full h-auto rounded-2xl border-4 border-background"
                />
              </div>
              <button
                onClick={() => setEditing(!editing)}
                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur rounded-full p-2 text-xs text-foreground shadow"
                title="Позиционировать фото"
              >
                ✥
              </button>
              {editing && (
                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 z-20 bg-background border border-border rounded-lg shadow-lg p-3 flex flex-col gap-2 items-center min-w-[200px]">
                  <label className="text-xs text-muted-foreground">Позиция фото (например: center top, 50% 20%)</label>
                  <input
                    type="text"
                    value={objectPosition}
                    onChange={(e) => {
                      setObjectPosition(e.target.value);
                      localStorage.setItem(POSITION_KEY, e.target.value);
                    }}
                    className="border border-input rounded px-2 py-1 text-sm w-full bg-background text-foreground"
                  />
                  <div className="flex gap-1 flex-wrap justify-center">
                    {["center top", "center center", "center 20%", "center 30%", "center 40%"].map((pos) => (
                      <button
                        key={pos}
                        onClick={() => { setObjectPosition(pos); localStorage.setItem(POSITION_KEY, pos); }}
                        className={`text-xs px-2 py-1 rounded border ${objectPosition === pos ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-accent/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/20 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
