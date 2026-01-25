import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Главная", href: "#hero" },
  { label: "Обо мне", href: "#about" },
  { label: "Консультации", href: "#consultations" },
  { label: "Курсы", href: "#courses" },
  { label: "Отзывы", href: "#reviews" },
  { label: "Контакты", href: "#contact" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              ТД
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-foreground">Проф. Тарусин Д.И.</p>
              <p className="text-xs text-muted-foreground">Основатель детской андрологии в России</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => scrollToSection("#contact")}
              className="hidden sm:flex bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Записаться
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-foreground"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <Button
                onClick={() => scrollToSection("#contact")}
                className="mt-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Записаться на приём
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
