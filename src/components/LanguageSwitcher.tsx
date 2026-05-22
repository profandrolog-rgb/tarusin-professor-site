import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Globe } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { stripLangPrefix } from "@/lib/i18nUrls";

const languages = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const current = languages.find(l => l.code === i18n.language) || languages[0];

  const switchTo = (code: string) => {
    // Сохраняем ручной выбор для будущих визитов.
    try {
      window.localStorage.setItem("i18nextLng", code);
    } catch {
      /* ignore */
    }
    const bare = stripLangPrefix(location.pathname);
    const target =
      code === "en"
        ? bare === "/"
          ? "/en/"
          : `/en${bare}`
        : bare;
    if (target !== location.pathname) {
      navigate(target + location.search + location.hash);
    } else {
      i18n.changeLanguage(code);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary" aria-label="Change language">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{current.flag}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {languages.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => switchTo(lang.code)}
            className={i18n.language === lang.code ? "bg-secondary" : ""}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
