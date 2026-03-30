import { MapPin, Phone } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FOOTER_SOCIAL_LINKS, WhatsAppIcon } from "./SocialLinks";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();
  const handleNavClick = (href: string) => {
    if (location.pathname === "/") {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/" + href);
    }
  };

  return (
    <footer className="bg-foreground text-background py-12 md:py-16">
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
            <p className="text-background/70 text-sm mb-4">
              Член-корреспондент РАЕН, профессор, доктор медицинских наук, врач высшей категории. Основатель детской андрологии в России. Headliner (НД), Opinion Leader (OL)
              Более 42 лет на страже мужского здоровья
            </p>
            {/* Social Links */}
            <div className="flex flex-wrap gap-2">
              {FOOTER_SOCIAL_LINKS.map((social, i) => (
                <a
                  key={`${social.label}-${i}`}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-background/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
                  aria-label={social.title || social.label}
                  title={social.title || social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
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
                { label: "Наши исследования", href: "/research", type: "link" },
                { label: "Размышлизмы", href: "/blog", type: "link" },
                { label: "Отзывы", href: "/reviews", type: "link" },
                { label: "Вопросы и ответы", href: "/qa", type: "link" },
                { label: "Контакты", href: "/contacts", type: "link" },
              ].map((item) =>
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
              <li>Реабилитация</li>
              <li>Сексология</li>
              <li>Репродуктивная психология</li>
              <li>Репродуктивная эндокринология</li>
              <li>Функциональная ортопедия</li>
              <li>Детская хирургия</li>
              <li>Хирургия</li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="font-semibold mb-4">Контакты</h4>
            <div className="space-y-4">
              {/* Клиника доктора Матара */}
              <div>
                <p className="font-medium text-background/90 text-sm mb-2">Клиника доктора Матара</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 flex-shrink-0 text-background/70" />
                    <a href="tel:+74953030000" className="text-background/70 hover:text-background transition-colors">+7 (495) 303-00-00</a>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 flex-shrink-0 text-background/70" />
                    <a href="tel:+79263030111" className="text-background/70 hover:text-background transition-colors">+7 (926) 303-01-11</a>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 flex-shrink-0 text-background/70" />
                    <a href="tel:+79160303031" className="text-background/70 hover:text-background transition-colors">+7 (916) 030-30-31</a>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-background/70" />
                    <span className="text-background/70">Москва, Коровинское шоссе, 9 к2</span>
                  </li>
                </ul>
              </div>

              {/* AVE-CLINIC */}
              <div>
                <p className="font-medium text-background/90 text-sm mb-2">AVE-CLINIC</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 flex-shrink-0 text-background/70" />
                    <div>
                      <a href="tel:+74953748181" className="text-background/70 hover:text-background transition-colors">+7 (495) 374-81-81</a>
                      <span className="text-background/50 ml-1">(для справок)</span>
                    </div>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <WhatsAppIcon className="w-4 h-4 flex-shrink-0 text-background/70" />
                    <div>
                      <a href="https://wa.me/79266005550" target="_blank" rel="noopener noreferrer" className="text-background/70 hover:text-background transition-colors">+7 (926) 600-555-0</a>
                      <span className="text-background/50 ml-1">(WhatsApp)</span>
                    </div>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 flex-shrink-0 text-background/70" />
                    <div>
                      <a href="tel:+79778075544" className="text-background/70 hover:text-background transition-colors">+7 (977) 807-55-44</a>
                      <span className="text-background/50 ml-1">(срочные)</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-background/70" />
                    <span className="text-background/70">с. Немчиновка, 3-я Запрудная ул. дом 16</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-background/60">© {currentYear} Профессор Тарусин Дмитрий Игоревич. Все права защищены.</p>
            <div className="flex gap-6">
              <Link to="/privacy-policy" className="text-sm text-background/60 hover:text-background transition-colors">Политика конфиденциальности</Link>
              <Link to="/consent" className="text-sm text-background/60 hover:text-background transition-colors">Согласие на обработку данных</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
