import { useState } from "react";
import { MapPin, Phone } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FOOTER_SOCIAL_LINKS, WhatsAppIcon, MaxQrModal } from "./SocialLinks";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMaxQr, setShowMaxQr] = useState(false);
  const { t } = useTranslation();

  const handleNavClick = (href: string) => {
    if (location.pathname === "/") {
      const element = document.querySelector(href);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/" + href);
    }
  };

  const navItems = [
    { label: t("nav.home"), href: "#hero", type: "anchor" },
    { label: t("nav.about"), href: "#about", type: "anchor" },
    { label: t("nav.consultations"), href: "#consultations", type: "anchor" },
    { label: t("nav.methods"), href: "/methodologies", type: "link" },
    { label: t("nav.team"), href: "/team", type: "link" },
    { label: t("nav.forParents"), href: "/for-parents", type: "link" },
    { label: t("nav.forDoctors"), href: "/for-doctors", type: "link" },
    { label: t("nav.media"), href: "/media", type: "link" },
    { label: t("nav.videos"), href: "/videos", type: "link" },
    { label: t("nav.videoCases"), href: "/video-cases", type: "link" },
    { label: t("nav.publications"), href: "/publications", type: "link" },
    { label: t("nav.clinicalCases"), href: "/clinical-cases", type: "link" },
    { label: t("nav.travelNotes"), href: "/travel-notes", type: "link" },
    { label: t("nav.research"), href: "/research", type: "link" },
    { label: t("nav.blog"), href: "/blog", type: "link" },
    { label: t("nav.reviews"), href: "/reviews", type: "link" },
    { label: t("nav.qa"), href: "/qa", type: "link" },
    { label: t("nav.contacts"), href: "/contacts", type: "link" },
  ];

  return (
    <footer className="bg-foreground text-background py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {t("lang") === "en" ? "TD" : "ТД"}
              </div>
              <p className="font-semibold">{t("lang") === "en" ? "Professor Tarusin D.I." : "Профессор Тарусин Д.И."}</p>
            </div>
            <p className="text-background/70 text-sm mb-4">{t("footer.desc")}</p>
            <div className="flex flex-wrap gap-2">
              {FOOTER_SOCIAL_LINKS.map((social, i) => {
                if ((social as any).isQr) {
                  return (
                    <button key={`${social.label}-${i}`} onClick={() => setShowMaxQr(true)} className="w-9 h-9 rounded-full bg-background/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors" aria-label={social.title || social.label} title={social.title || social.label}>
                      <social.icon className="w-4 h-4" />
                    </button>
                  );
                }
                return (
                  <a key={`${social.label}-${i}`} href={social.href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-background/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors" aria-label={social.title || social.label} title={social.title || social.label}>
                    <social.icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
            <MaxQrModal isOpen={showMaxQr} onClose={() => setShowMaxQr(false)} />
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("footer.navigation")}</h4>
            <ul className="space-y-2">
              {navItems.map(item =>
                item.type === "anchor" ? (
                  <li key={item.href}>
                    <button onClick={() => handleNavClick(item.href)} className="text-background/70 hover:text-background transition-colors text-sm">{item.label}</button>
                  </li>
                ) : (
                  <li key={item.href}>
                    <Link to={item.href} className="text-background/70 hover:text-background transition-colors text-sm">{item.label}</Link>
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("footer.specializations")}</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li>{t("lang") === "en" ? "Pediatric Urology-Andrology" : "Детская урология-андрология"}</li>
              <li>{t("lang") === "en" ? "Adult Urology" : "Урология взрослых"}</li>
              <li>{t("lang") === "en" ? "Pediatrics" : "Педиатрия"}</li>
              <li>{t("lang") === "en" ? "Microsurgery" : "Микрохирургия"}</li>
              <li>{t("lang") === "en" ? "Plastic Surgery" : "Пластическая хирургия"}</li>
              <li>{t("lang") === "en" ? "Ultrasound Diagnostics" : "УЗИ-диагностика"}</li>
              <li>{t("lang") === "en" ? "Rehabilitation" : "Реабилитация"}</li>
              <li>{t("lang") === "en" ? "Sexology" : "Сексология"}</li>
              <li>{t("lang") === "en" ? "Reproductive Psychology" : "Репродуктивная психология"}</li>
              <li>{t("lang") === "en" ? "Reproductive Endocrinology" : "Репродуктивная эндокринология"}</li>
              <li>{t("lang") === "en" ? "Functional Orthopedics" : "Функциональная ортопедия"}</li>
              <li>{t("lang") === "en" ? "Pediatric Surgery" : "Детская хирургия"}</li>
              <li>{t("lang") === "en" ? "General Surgery" : "Хирургия"}</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("footer.contactsTitle")}</h4>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-background/90 text-sm mb-2">{t("hero.mataraClinic")}</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 text-sm"><Phone className="w-4 h-4 flex-shrink-0 text-background/70" /><a href="tel:+74953030000" className="text-background/70 hover:text-background transition-colors">+7 (495) 303-00-00</a></li>
                  <li className="flex items-center gap-3 text-sm"><Phone className="w-4 h-4 flex-shrink-0 text-background/70" /><a href="tel:+79263030111" className="text-background/70 hover:text-background transition-colors">+7 (926) 303-01-11</a></li>
                  <li className="flex items-center gap-3 text-sm"><Phone className="w-4 h-4 flex-shrink-0 text-background/70" /><a href="tel:+79160303031" className="text-background/70 hover:text-background transition-colors">+7 (916) 030-30-31</a></li>
                  <li className="flex items-start gap-3 text-sm"><MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-background/70" /><span className="text-background/70">{t("lang") === "en" ? "Moscow, Korovinskoye Hwy 9, Bldg 2" : "Москва, Коровинское шоссе, 9 к2"}</span></li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-background/90 text-sm mb-2">{t("hero.aveClinic")}</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 text-sm"><WhatsAppIcon className="w-4 h-4 flex-shrink-0 text-background/70" /><div><a href="https://wa.me/79266005550" target="_blank" rel="noopener noreferrer" className="text-background/70 hover:text-background transition-colors">+7 (926) 600-555-0</a><span className="text-background/50 ml-1">(WhatsApp, Telegram, MAX)</span></div></li>
                  <li className="flex items-start gap-3 text-sm"><MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-background/70" /><span className="text-background/70">{t("lang") === "en" ? "Nemchinovka, 3rd Zaprudnaya St. 16" : "с. Немчиновка, 3-я Запрудная ул. дом 16"}</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-background/60">{t("footer.copyright", { year: currentYear })}</p>
            <div className="flex gap-6">
              <Link to="/privacy-policy" className="text-sm text-background/60 hover:text-background transition-colors">{t("footer.privacyPolicy")}</Link>
              <Link to="/consent" className="text-sm text-background/60 hover:text-background transition-colors">{t("footer.dataConsent")}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
