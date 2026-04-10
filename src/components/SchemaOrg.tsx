import { Helmet } from "react-helmet-async";

const SITE_URL = "https://tarusin-professor-site.lovable.app";

const physicianSchema = {
  "@context": "https://schema.org",
  "@type": "Physician",
  name: "Prof. Dmitry I. Tarusin",
  alternateName: "Проф. Тарусин Дмитрий Игоревич",
  url: SITE_URL,
  image: `${SITE_URL}/og-image.png`,
  description: "Professor, Doctor of Medical Sciences, pediatric urologist-andrologist and microsurgeon with 42+ years of experience.",
  medicalSpecialty: [
    { "@type": "MedicalSpecialty", name: "Pediatric Urology" },
    { "@type": "MedicalSpecialty", name: "Andrology" },
    { "@type": "MedicalSpecialty", name: "Microsurgery" },
  ],
  knowsAbout: [
    "Varicocele microsurgery",
    "Cryptorchidism treatment",
    "Hypospadias correction",
    "Hydrocele repair",
    "Phimosis treatment",
    "Pediatric andrology",
    "Testicular torsion",
    "Male infertility prevention",
  ],
  hasCredential: [
    { "@type": "EducationalOccupationalCredential", credentialCategory: "Doctor of Medical Sciences", dateCreated: "2005" },
    { "@type": "EducationalOccupationalCredential", credentialCategory: "Professor" },
  ],
  memberOf: {
    "@type": "Organization",
    name: "Russian Academy of Natural Sciences",
    alternateName: "RANS",
  },
  sameAs: [
    "https://www.youtube.com/@androlog_di",
    "https://uro.tv/speaker2021/tarusin_dmitriy_igorevich",
  ],
};

const medicalConditions = [
  { name: "Varicocele", desc: "Enlargement of veins within the scrotum, treated with microsurgical techniques.", url: "/results" },
  { name: "Cryptorchidism", desc: "Undescended testicle requiring surgical correction in childhood.", url: "/results" },
  { name: "Hypospadias", desc: "Congenital condition where the urethral opening is not at the tip of the penis.", url: "/results" },
  { name: "Hydrocele", desc: "Fluid accumulation around the testicle requiring surgical repair.", url: "/results" },
  { name: "Phimosis", desc: "Tight foreskin that cannot be retracted, often requiring treatment in children.", url: "/results" },
];

const conditionsSchema = medicalConditions.map((c) => ({
  "@context": "https://schema.org",
  "@type": "MedicalCondition",
  name: c.name,
  description: c.desc,
  url: `${SITE_URL}${c.url}`,
  possibleTreatment: {
    "@type": "MedicalTherapy",
    name: `${c.name} surgical treatment`,
    performer: { "@type": "Physician", name: "Prof. Dmitry I. Tarusin" },
  },
}));

const SchemaOrg = () => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify(physicianSchema)}</script>
    <script type="application/ld+json">{JSON.stringify(conditionsSchema)}</script>
  </Helmet>
);

export default SchemaOrg;
