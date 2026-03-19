import { Button } from "@/components/ui/button";
import { Award, Syringe, Stethoscope, Users, Phone } from "lucide-react";
import professorPhoto from "@/assets/professor-photo.png";

const HeroSection = () => {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
  };

  return (
    <section id="hero" className="pt-20 md:pt-24 pb-16 md:pb-24 bg-gradient-to-b from-secondary/50 to-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Syringe size={16} />
              <span>Член-корреспондент РАЕН, доктор медицинских наук, профессор, врач высшей категории</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Тарусин<br />
              <span className="text-primary">Дмитрий Игоревич</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-2">
              Основатель детской урологии-андрологии в России
            </p>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Андролог (детский и взрослый) • Детский уролог • Детский хирург • Эксперт УЗИ диагностики • Микрохирург • Пластический хирург • Ортопед • Сексолог
            </p>

            <div className="flex flex-col gap-3 justify-center lg:justify-start">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  size="lg" 
                  onClick={() => window.open("tel:+74953030000")} 
                  className="bg-accent hover:bg-accent/90 text-accent-foreground text-base px-6"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-xs opacity-80">Клиника доктора Матара</span>
                    <span>+7 (495) 303-00-00</span>
                  </span>
                </Button>
                <Button 
                  size="lg" 
                  onClick={() => window.open("tel:+74953748181")} 
                  className="bg-accent hover:bg-accent/90 text-accent-foreground text-base px-6"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-xs opacity-80">AVE-CLINIC</span>
                    <span>+7 (495) 374-81-81</span>
                  </span>
                </Button>
              </div>
              <div className="flex justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => scrollToSection("#about")} 
                  className="text-lg px-8"
                >
                  Узнать больше
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-border">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 text-primary mb-1">
                  <Award size={20} />
                  <span className="text-2xl md:text-3xl font-bold">42</span>
                </div>
                <p className="text-sm text-muted-foreground">года опыта</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 text-primary mb-1">
                  <Users size={20} />
                  <span className="text-2xl md:text-3xl font-bold">860+</span>
                </div>
                <p className="text-sm text-muted-foreground">выступлений</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 text-primary mb-1">
                  <Stethoscope size={20} />
                  <span className="text-2xl md:text-3xl font-bold">126+</span>
                </div>
                <p className="text-sm text-muted-foreground">публикаций</p>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative">
              <div className="w-72 h-72 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] rounded-full bg-gradient-to-br from-primary to-primary/60 p-1 shadow-2xl">
                <img 
                  src={professorPhoto} 
                  alt="Профессор Тарусин Дмитрий Игоревич" 
                  className="w-full h-full rounded-full object-cover border-4 border-background"
                />
              </div>
              {/* Decorative elements */}
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
