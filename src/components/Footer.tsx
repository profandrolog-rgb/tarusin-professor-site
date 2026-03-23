import { MapPin, Phone } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";

// Custom SVG icons for social media
const TelegramIcon = ({
  className
}: {
  className?: string;
}) => <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>;
const InstagramIcon = ({
  className
}: {
  className?: string;
}) => <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>;
const FacebookIcon = ({
  className
}: {
  className?: string;
}) => <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>;
const DzenIcon = ({
  className
}: {
  className?: string;
}) => <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c2.903 0 5.503 1.425 7.088 3.612h-3.6c-.788-.9-1.912-1.512-3.188-1.612v-2zm-4.8 0v2c-1.275.1-2.4.712-3.187 1.612h-3.6C1.998 5.025 4.598 3.6 7.5 3.6h-.3zM3.6 12c0-.9.15-1.763.413-2.575h2.85c-.15.825-.263 1.687-.263 2.575s.113 1.75.263 2.575h-2.85A8.372 8.372 0 0 1 3.6 12zm3.9 7.2v-2c1.275-.1 2.4-.712 3.188-1.612h3.6c-1.585 2.187-4.185 3.612-7.088 3.612h.3zm9.6-4.625c.15-.825.263-1.687.263-2.575s-.113-1.75-.263-2.575h2.85c.263.812.413 1.675.413 2.575s-.15 1.763-.413 2.575h-2.85z" />
  </svg>;
const WhatsAppIcon = ({
  className
}: {
  className?: string;
}) => <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>;
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();
  const handleNavClick = (href: string) => {
    if (location.pathname === "/") {
      // Already on home page, just scroll
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth"
        });
      }
    } else {
      // Navigate to home page with hash
      navigate("/" + href);
    }
  };
  const socialLinks = [{
    icon: TelegramIcon,
    href: "https://t.me/Professor_DI",
    label: "Telegram"
  }, {
    icon: InstagramIcon,
    href: "https://www.instagram.com/androlog_di",
    label: "Instagram"
  }, {
    icon: FacebookIcon,
    href: "https://www.facebook.com/tarusindi",
    label: "Facebook"
  }, {
    icon: DzenIcon,
    href: "https://dzen.ru/boymanblog",
    label: "Дзен"
  }, {
    icon: WhatsAppIcon,
    href: "https://wa.me/79778075544",
    label: "WhatsApp"
  }];
  return <footer className="bg-foreground text-background py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                ТД
              </div>
              <div>
                <p className="font-semibold">Профессор Тарусин Д.И.</p>
              </div>
            </div>
            <p className="text-background/70 text-sm mb-4">Член-корреспондент РАЕН, профессор, доктор медицинских наук, врач высшей категории. Основатель детской андрологии в России. Headliner (НД), Opinion Leader (OL)
Более 42 лет на страже мужского здоровья      
           </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map(social => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-background/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors" aria-label={social.label}>
                  <social.icon className="w-4 h-4" />
                </a>)}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4">Навигация</h4>
            <ul className="space-y-2">
              {[
                { label: "Главная", href: "#hero", type: "anchor" },
                { label: "Обо мне", href: "#about", type: "anchor" },
                { label: "Консультации", href: "#consultations", type: "anchor" },
                { label: "Методики", href: "/methodologies", type: "link" },
                { label: "Команда", href: "/team", type: "link" },
                { label: "Для родителей", href: "/for-parents", type: "link" },
                { label: "Для врачей", href: "/for-doctors", type: "link" },
                { label: "СМИ и ТВ", href: "/media", type: "link" },
                { label: "Видео", href: "/videos", type: "link" },
                { label: "Видео-кейсы", href: "/video-cases", type: "link" },
                { label: "Публикации", href: "/publications", type: "link" },
                { label: "Клинические случаи", href: "/clinical-cases", type: "link" },
                { label: "Путёвые заметки", href: "/travel-notes", type: "link" },
                { label: "Размышлизмы", href: "/blog", type: "link" },
                { label: "Отзывы", href: "/reviews", type: "link" },
                { label: "Вопросы и ответы", href: "/qa", type: "link" },
                { label: "Контакты", href: "/contacts", type: "link" },
              ].map(item =>
                item.type === "anchor" ? (
                  <li key={item.href}>
                    <button onClick={() => handleNavClick(item.href)} className="text-background/70 hover:text-background transition-colors text-sm">
                      {item.label}
                    </button>
                  </li>
                ) : (
                  <li key={item.href}>
                    <Link to={item.href} className="text-background/70 hover:text-background transition-colors text-sm">
                      {item.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Specializations */}
          <div>
            <h4 className="font-semibold mb-4">Специализации</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li>Детская урология-андрология</li>
              <li>Урология взрослых</li>
              <li>Педиатрия</li>
              <li>Микрохирургия</li>
              <li>Пластическая хирургия</li>
              <li>УЗИ-диагностика</li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="font-semibold mb-4">Контакты</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 flex-shrink-0 text-background/70" />
                <div>
                  <a href="tel:+74953748181" className="text-background/70 hover:text-background transition-colors">
                    +7 (495) 374-81-81
                  </a>
                  <span className="text-background/50 ml-1">(для справок)</span>
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <WhatsAppIcon className="w-4 h-4 flex-shrink-0 text-background/70" />
                <div>
                  <a href="https://wa.me/79266005550" target="_blank" rel="noopener noreferrer" className="text-background/70 hover:text-background transition-colors">
                    +7 (926) 600-555-0
                  </a>
                  <span className="text-background/50 ml-1">(WhatsApp)</span>
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 flex-shrink-0 text-background/70" />
                <div>
                  <a href="tel:+79778075544" className="text-background/70 hover:text-background transition-colors">
                    +7 (977) 807-55-44
                  </a>
                  <span className="text-background/50 ml-1">(срочные)</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-background/70" />
                <span className="text-background/70">
                  <span className="font-medium text-background/90">AVE-CLINIC</span><br />
                  с. Немчиновка, 3-я Запрудная ул. дом 16
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-background/60">
              © {currentYear} Профессор Тарусин Дмитрий Игоревич. Все права защищены.
            </p>
            <div className="flex gap-6">
              <Link to="/privacy-policy" className="text-sm text-background/60 hover:text-background transition-colors">
                Политика конфиденциальности
              </Link>
              <Link to="/consent" className="text-sm text-background/60 hover:text-background transition-colors">
                Согласие на обработку данных
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;