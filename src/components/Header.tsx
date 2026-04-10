import { useState } from "react";
import { Menu, X, ChevronDown, LogIn, LogOut, Settings, UserPlus } from "lucide-react";
import headerPhoto from "@/assets/header-photo.png";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { user, isAdmin, isSurgeon, signOut } = useAuth();
  const { t } = useTranslation();

  const mainNavItems = [
    { label: t("nav.home"), href: "#hero", isAnchor: true },
    { label: t("nav.about"), href: "#about", isAnchor: true },
    { label: t("nav.consultations"), href: "#consultations", isAnchor: true },
    { label: t("nav.methods"), href: "/methodologies", isAnchor: false },
  ];

  const moreNavItems = [
    { label: t("nav.team"), href: "/team" },
    { label: t("nav.forParents"), href: "/for-parents" },
    { label: t("nav.forDoctors"), href: "/for-doctors" },
    { label: t("nav.media"), href: "/media" },
    { label: t("nav.videos"), href: "/videos" },
    { label: t("nav.videoCases"), href: "/video-cases" },
    { label: t("nav.publications"), href: "/publications" },
    { label: t("nav.research"), href: "/research" },
    { label: t("nav.clinicalCases"), href: "/clinical-cases" },
    { label: t("nav.travelNotes"), href: "/travel-notes" },
    { label: t("nav.masterclasses"), href: "/masterclasses" },
    { label: t("nav.blog"), href: "/blog" },
    { label: t("nav.reviews"), href: "/reviews" },
    { label: t("nav.qa"), href: "/qa" },
    { label: t("nav.contacts"), href: "/contacts" },
  ];

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
    if (element) element.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-3">
            <img src={headerPhoto} alt="Professor Tarusin D.I." className="w-10 h-10 rounded-full object-cover" />
            <div className="hidden sm:block">
              <p className="font-semibold text-foreground">
                {t("lang") === "en" ? "Professor Tarusin D.I." : "Профессор Тарусин Д.И."}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("hero.subtitle")}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {mainNavItems.map(item =>
              item.isAnchor ? (
                <button key={item.href} onClick={() => scrollToSection(item.href)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary">
                  {item.label}
                </button>
              ) : (
                <Link key={item.href} to={item.href} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary">
                  {item.label}
                </Link>
              )
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary inline-flex items-center gap-1">
                  {t("nav.more")}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {moreNavItems.map(item => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link to={item.href} className="w-full">{item.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="w-full flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      {t("nav.adminPanel")}
                    </Link>
                  </DropdownMenuItem>
                )}
                {!isAdmin && isSurgeon && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin/operations-journal" className="w-full flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      {t("nav.opsJournal")}
                    </Link>
                  </DropdownMenuItem>
                )}
                {user ? (
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("nav.signOut")}
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/auth" className="w-full flex items-center">
                        <LogIn className="w-4 h-4 mr-2" />
                        {t("nav.signIn")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/auth?tab=register" className="w-full flex items-center">
                        <UserPlus className="w-4 h-4 mr-2" />
                        {t("nav.signUp")}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <LanguageSwitcher />
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/contacts">
              <Button className="hidden sm:flex bg-accent hover:bg-accent/90 text-accent-foreground">
                {t("nav.bookAppointment")}
              </Button>
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-foreground" aria-label="Toggle menu">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {mainNavItems.map(item =>
                item.isAnchor ? (
                  <button key={item.href} onClick={() => scrollToSection(item.href)} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors">
                    {item.label}
                  </button>
                ) : (
                  <Link key={item.href} to={item.href} onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors">
                    {item.label}
                  </Link>
                )
              )}
              <div className="border-t border-border my-2" />
              {moreNavItems.map(item => (
                <Link key={item.href} to={item.href} onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors">
                  {item.label}
                </Link>
              ))}
              <Link to="/contacts" onClick={() => setIsMenuOpen(false)}>
                <Button className="mt-2 w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  {t("nav.bookAppointmentFull")}
                </Button>
              </Link>
              <div className="border-t border-border my-2" />
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-left text-sm font-medium text-primary hover:bg-secondary rounded-lg transition-colors flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  {t("nav.adminPanel")}
                </Link>
              )}
              {!isAdmin && isSurgeon && (
                <Link to="/admin/operations-journal" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-left text-sm font-medium text-primary hover:bg-secondary rounded-lg transition-colors flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  {t("nav.opsJournal")}
                </Link>
              )}
              {user ? (
                <button onClick={handleSignOut} className="px-4 py-3 text-left text-sm font-medium text-destructive hover:bg-secondary rounded-lg transition-colors flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  {t("nav.signOut")}
                </button>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    {t("nav.signIn")}
                  </Link>
                  <Link to="/auth?tab=register" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-left text-sm font-medium text-primary hover:bg-secondary rounded-lg transition-colors flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    {t("nav.signUp")}
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
