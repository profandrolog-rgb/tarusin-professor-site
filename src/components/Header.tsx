import { useState } from "react";
import { Menu, X, ChevronDown, LogIn, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

const mainNavItems = [
  { label: "Главная", href: "#hero", isAnchor: true },
  { label: "Обо мне", href: "#about", isAnchor: true },
  { label: "Консультации", href: "#consultations", isAnchor: true },
];

const moreNavItems = [
  { label: "Для родителей", href: "/for-parents" },
  { label: "Для врачей", href: "/for-doctors" },
  { label: "СМИ и ТВ", href: "/media" },
  { label: "Видео", href: "/videos" },
  { label: "Отзывы", href: "/reviews" },
  { label: "Контакты", href: "/contacts" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const scrollToSection = (href: string) => {
    if (!isHomePage) {
      window.location.href = "/" + href;
      return;
    }
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
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              ТД
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-foreground">Профессор Тарусин Д.И.</p>
              <p className="text-xs text-muted-foreground">Основатель детской андрологии в России</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {mainNavItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary"
              >
                {item.label}
              </button>
            ))}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary inline-flex items-center gap-1">
                  Ещё
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {moreNavItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link to={item.href} className="w-full">
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {user ? (
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Выйти
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/auth" className="w-full flex items-center">
                      <LogIn className="w-4 h-4 mr-2" />
                      Войти
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/contacts">
              <Button className="hidden sm:flex bg-accent hover:bg-accent/90 text-accent-foreground">
                Записаться
              </Button>
            </Link>

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
              {mainNavItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                >
                  {item.label}
                </button>
              ))}
              
              <div className="border-t border-border my-2" />
              
              {moreNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              
              <Link to="/contacts" onClick={() => setIsMenuOpen(false)}>
                <Button className="mt-2 w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  Записаться на приём
                </Button>
              </Link>
              
              <div className="border-t border-border my-2" />
              
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="px-4 py-3 text-left text-sm font-medium text-destructive hover:bg-secondary rounded-lg transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Войти
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
