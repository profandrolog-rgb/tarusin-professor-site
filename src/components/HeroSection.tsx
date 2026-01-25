import { Button } from "@/components/ui/button";
import { Award, Syringe, Stethoscope, Users } from "lucide-react";
const HeroSection = () => {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
  };
  return <section id="hero" className="pt-20 md:pt-24 pb-16 md:pb-24 bg-gradient-to-b from-secondary/50 to-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Syringe size={16} />
              <span>Член-корреспондент РАЕН, доктор медицинских наук, профессор,
врач вышей категории</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Тарусин<br />
              <span className="text-primary">Дмитрий Игоревич</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-4">
              Андролог (детский и взрослый) • Детский уролог • Детский хирург
            </p>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Специалист УЗИ
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" onClick={() => scrollToSection("#contact")} className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8">
                Записаться на приём
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollToSection("#about")} className="text-lg px-8">
                Узнать больше
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-border">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 text-primary mb-1">
                  <Award size={20} />
                  <span className="text-2xl md:text-3xl font-bold">32</span>
                </div>
                <p className="text-sm text-muted-foreground">года опыта</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 text-primary mb-1">
                  <Users size={20} />
                  <span className="text-2xl md:text-3xl font-bold">10 000+</span>
                </div>
                <p className="text-sm text-muted-foreground">пациентов</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 text-primary mb-1">
                  <Stethoscope size={20} />
                  <span className="text-2xl md:text-3xl font-bold">200</span>
                </div>
                <p className="text-sm text-muted-foreground">операций в год</p>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl">
                <div className="w-56 h-56 md:w-72 md:h-72 lg:w-88 lg:h-88 rounded-full bg-card flex items-center justify-center border-4 border-background">
                  <span className="text-6xl md:text-7xl lg:text-8xl font-bold text-primary">ТД</span>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-accent/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/20 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;