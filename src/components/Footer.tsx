import { MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
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
            <p className="text-background/70 text-sm">
              Доктор медицинских наук, член-корр. РАЕН. Основатель детской урологии-андрологии в России. 
              Более 32 лет помогаю пациентам всех возрастов.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4">Навигация</h4>
            <ul className="space-y-2">
              {[
                { label: "Главная", href: "#hero" },
                { label: "Обо мне", href: "#about" },
                { label: "Консультации", href: "#consultations" },
                { label: "Курсы", href: "#courses" },
                { label: "Отзывы", href: "#reviews" },
                { label: "Контакты", href: "#contact" },
              ].map((item) => (
                <li key={item.href}>
                  <button
                    onClick={() => scrollToSection(item.href)}
                    className="text-background/70 hover:text-background transition-colors text-sm"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
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
                <a 
                  href="tel:+79778085544" 
                  className="text-background/70 hover:text-background transition-colors"
                >
                  +7 (977) 808-55-44
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 flex-shrink-0 text-background/70" />
                <a 
                  href="mailto:boy.doc@yandex.ru"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  boy.doc@yandex.ru
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-background/70" />
                <span className="text-background/70">
                  Морозовская ДГКБ, Международный центр андрологии
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
              <a href="#" className="text-sm text-background/60 hover:text-background transition-colors">
                Политика конфиденциальности
              </a>
              <a href="#" className="text-sm text-background/60 hover:text-background transition-colors">
                Согласие на обработку данных
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
