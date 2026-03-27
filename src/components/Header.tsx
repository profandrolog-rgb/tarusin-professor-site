import { useState } from "react";
import { Menu, X, ChevronDown, LogIn, LogOut, Settings, UserPlus } from "lucide-react";
import headerPhoto from "@/assets/header-photo.png";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
const mainNavItems = [{
  label: "Главная",
  href: "#hero",
  isAnchor: true
}, {
  label: "Обо мне",
  href: "#about",
  isAnchor: true
}, {
  label: "Консультации",
  href: "#consultations",
  isAnchor: true
}, {
  label: "Методики",
  href: "/methodologies",
  isAnchor: false
}];
const moreNavItems = [{
  label: "Команда профессора",
  href: "/team"
}, {
  label: "Для родителей",
  href: "/for-parents"
}, {
  label: "Для врачей",
  href: "/for-doctors"
}, {
  label: "СМИ и ТВ",
  href: "/media"
}, {
  label: "Видео",
  href: "/videos"
}, {
  label: "Видео-кейсы",
  href: "/video-cases"
}, {
  label: "Публикации",
  href: "/publications"
}, {
  label: "Наши исследования",
  href: "/research"
}, {
  label: "Клинические случаи",
  href: "/clinical-cases"
}, {
  label: "Путёвые заметки",
  href: "/travel-notes"
}, {
  label: "Размышлизмы",
  href: "/blog"
}, {
  label: "Отзывы",
  href: "/reviews"
}, {
  label: "Вопросы и ответы",
  href: "/qa"
}, {
  label: "Контакты",
  href: "/contacts"
}];
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const {
    user,
    isAdmin,
    signOut
  } = useAuth();
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
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
    setIsMenuOpen(false);
  };
  return <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-3">
            <img src={headerPhoto} alt="Профессор Тарусин Д.И." className="w-10 h-10 rounded-full object-cover" />
            <div className="hidden sm:block">
              <p className="font-semibold text-foreground">Профессор Тарусин Д.И.</p>
              <p className="text-xs text-muted-foreground">Основатель детской и подростковой андрологии в России</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {mainNavItems.map(item => item.isAnchor ? <button key={item.href} onClick={() => scrollToSection(item.href)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary">
                  {item.label}
                </button> : <Link key={item.href} to={item.href} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary">
                  {item.label}
                </Link>)}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary inline-flex items-center gap-1">
                  Ещё
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {moreNavItems.map(item => <DropdownMenuItem key={item.href} asChild>
                    <Link to={item.href} className="w-full">
                      {item.label}
                    </Link>
                  </DropdownMenuItem>)}
                <DropdownMenuSeparator />
                {isAdmin && <DropdownMenuItem asChild>
                    <Link to="/admin" className="w-full flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Админ-панель
                    </Link>
                  </DropdownMenuItem>}
                {user ? <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Выйти
                  </DropdownMenuItem> : <>
                    <DropdownMenuItem asChild>
                      <Link to="/auth" className="w-full flex items-center">
                        <LogIn className="w-4 h-4 mr-2" />
                        Войти
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/auth?tab=register" className="w-full flex items-center">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Регистрация
                      </Link>
                    </DropdownMenuItem>
                  </>}
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
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-foreground" aria-label="Toggle menu">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && <nav className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {mainNavItems.map(item => item.isAnchor ? <button key={item.href} onClick={() => scrollToSection(item.href)} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors">
                    {item.label}
                  </button> : <Link key={item.href} to={item.href} onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors">
                    {item.label}
                  </Link>)}
              
              <div className="border-t border-border my-2" />
              
              {moreNavItems.map(item => <Link key={item.href} to={item.href} onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors">
                  {item.label}
                </Link>)}
              
              <Link to="/contacts" onClick={() => setIsMenuOpen(false)}>
                <Button className="mt-2 w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  Записаться на приём
                </Button>
              </Link>
              
              <div className="border-t border-border my-2" />
              
              {isAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-left text-sm font-medium text-primary hover:bg-secondary rounded-lg transition-colors flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Админ-панель
                </Link>}
              
              {user ? <button onClick={handleSignOut} className="px-4 py-3 text-left text-sm font-medium text-destructive hover:bg-secondary rounded-lg transition-colors flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button> : <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Войти
                </Link>}
            </div>
          </nav>}
      </div>
    </header>;
};
export default Header;