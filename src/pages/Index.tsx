import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import PioneersSection from "@/components/PioneersSection";
import ProfessorMessageSection from "@/components/ProfessorMessageSection";
import InternationalSection from "@/components/InternationalSection";
import ConsultationsSection from "@/components/ConsultationsSection";
import CoursesSection from "@/components/CoursesSection";
import ReviewsSection from "@/components/ReviewsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import QASection from "@/components/QASection";
import StickyBottomPanel from "@/components/StickyBottomPanel";
import PageMeta from "@/components/PageMeta";
import SchemaOrg from "@/components/SchemaOrg";
import { Helmet } from "react-helmet-async";
import DiagnosticChecklist from "@/components/DiagnosticChecklist";
import ResultsCTA from "@/components/ResultsCTA";
import PatientJourney from "@/components/PatientJourney";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import SmartSearch from "@/components/SmartSearch";
// JSON-LD: Physician + worksFor MedicalClinics + AggregateRating
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Physician",
      "@id": "https://tarusin.pro/#person",
      "name": "Профессор Тарусин Дмитрий Игоревич",
      "alternateName": "Tarusin Dmitry Igorevich",
      "image": "https://tarusin.pro/assets/professor-photo-DpatXHVQ.png",
      "url": "https://tarusin.pro/",
      "telephone": "+7-495-303-00-00",
      "medicalSpecialty": [
        "PediatricUrology",
        "Andrology",
        "PediatricSurgery",
        "Microsurgery",
        "Ultrasound",
        "Sexology"
      ],
      "description": "Профессор, доктор медицинских наук, основатель детской урологии-андрологии в России. 42 года клинического опыта.",
      "knowsLanguage": ["ru", "en"],
      "memberOf": {
        "@type": "Organization",
        "name": "Российская академия естественных наук (РАЕН)"
      },
      "alumniOf": {
        "@type": "Organization",
        "name": "РМАПО"
      },
      "worksFor": [
        {
          "@type": "MedicalClinic",
          "name": "Клиника доктора Матара",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Коровинское шоссе, 9, корп. 2",
            "addressLocality": "Москва",
            "addressCountry": "RU"
          },
          "telephone": "+7-495-303-00-00"
        }
      ],
      "sameAs": [
        "https://www.instagram.com/androlog_di",
        "https://t.me/+tMWpYqcllzo3NmYy",
        "https://vk.com/androlog_di",
        "https://dzen.ru/androlog_di",
        "https://www.youtube.com/@androlog_di"
      ]
    },
    {
      "@type": "AggregateRating",
      "itemReviewed": { "@id": "https://tarusin.pro/#person" },
      "ratingValue": "4.9",
      "bestRating": "5",
      "ratingCount": "85",
      "reviewCount": "85"
    }
  ]
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-14">
      <PageMeta
        title="Проф. Тарусин Д.И. — детский уролог-андролог | Москва"
        description="Профессор Тарусин Дмитрий Игоревич — основатель детской урологии-андрологии в России. Доктор медицинских наук, 42 года опыта. Запись на приём."
        path="/"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <SchemaOrg />
      <Header />
      <main>
        <HeroSection />
        <SmartSearch />
        <AboutSection />
        <PioneersSection />
        <ProfessorMessageSection />
        {/* <InternationalSection /> — hidden for redesign */}
        <DiagnosticChecklist />
        <ResultsCTA />
        <PatientJourney />
        <ConsultationsSection />
        <CoursesSection />
        <ReviewsSection />
        <QASection />
        <ContactSection />
      </main>
      <Footer />
      <StickyBottomPanel />
      <ExitIntentPopup />
    </div>
  );
};

export default Index;
