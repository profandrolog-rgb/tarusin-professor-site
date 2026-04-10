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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://tarusin-professor-site.lovable.app/#person",
      "name": "Тарусин Дмитрий Игоревич",
      "jobTitle": "Профессор, доктор медицинских наук",
      "description": "Основатель детской урологии-андрологии в России. Член-корреспондент РАЕН, врач высшей категории.",
      "url": "https://tarusin-professor-site.lovable.app",
      "telephone": ["+74953748181", "+74953030000"],
      "medicalSpecialty": ["Андрология", "Детская урология-андрология", "Микрохирургия", "УЗИ-диагностика"],
      "knowsAbout": ["Варикоцеле", "Крипторхизм", "Гипоспадия", "Фимоз", "Детская андрология"],
      "sameAs": [
        "https://t.me/Professor_DI",
        "https://www.instagram.com/androlog_di",
        "https://www.facebook.com/tarusindi",
        "https://dzen.ru/boymanblog"
      ]
    },
    {
      "@type": "MedicalClinic",
      "name": "AVE-CLINIC",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "3-я Запрудная ул. дом 16",
        "addressLocality": "с. Немчиновка",
        "addressCountry": "RU"
      },
      "telephone": "+74953748181",
      "medicalSpecialty": "Андрология"
    },
    {
      "@type": "MedicalClinic",
      "name": "Клиника доктора Матара",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Коровинское шоссе д. 9 к. 2",
        "addressLocality": "Москва",
        "addressCountry": "RU"
      },
      "telephone": "+74953030000",
      "medicalSpecialty": "Андрология"
    },
    {
      "@type": "AggregateRating",
      "itemReviewed": {
        "@type": "Physician",
        "name": "Тарусин Дмитрий Игоревич"
      },
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
        title="Профессор Тарусин Д.И. — Андролог, детский уролог-андролог, Москва"
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
    </div>
  );
};

export default Index;
