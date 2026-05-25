import type { RouteRecord } from "vite-react-ssg";
import RootLayout from "./RootLayout";
import LangBoundary from "./components/LangBoundary";
import Index from "./pages/Index";
import DiseaseDetailPage from "./pages/DiseaseDetailPage";
import ForParents from "./pages/ForParents";
import ForDoctors from "./pages/ForDoctors";
import Media from "./pages/Media";
import Reviews from "./pages/Reviews";
import Contacts from "./pages/Contacts";
import Videos from "./pages/Videos";
import VideoCasesPage from "./pages/VideoCases";
import Publications from "./pages/Publications";
import Methodologies from "./pages/Methodologies";
import TravelNotes from "./pages/TravelNotes";
import Masterclasses from "./pages/Masterclasses";
import ClinicalCases from "./pages/ClinicalCases";
import Blog from "./pages/Blog";
import Team from "./pages/Team";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminRequests from "./pages/AdminRequests";
import AdminCertificates from "./pages/AdminCertificates";
import AdminPrescriptions from "./pages/AdminPrescriptions";
import AdminQuestions from "./pages/AdminQuestions";
import AdminOperationsJournal from "./pages/AdminOperationsJournal";
import AdminDiseaseArticles from "./pages/AdminDiseaseArticles";
import QA from "./pages/QA";
import Research from "./pages/Research";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Consent from "./pages/Consent";
import Results from "./pages/Results";
import PatientPortal from "./pages/PatientPortal";
import AdminPatientCards from "./pages/AdminPatientCards";
import AdminConsultations from "./pages/AdminConsultations";
import NotFound from "./pages/NotFound";
import SelfCheck from "./pages/SelfCheck";
import SelfCheckDetail from "./pages/SelfCheckDetail";
import AdminSelfCheck from "./pages/AdminSelfCheck";
import TreatmentPlans from "./pages/TreatmentPlans";
import TreatmentPlanEditor from "./pages/TreatmentPlanEditor";
import TreatmentPlanPrint from "./pages/TreatmentPlanPrint";
import TreatmentPlanMemo from "./pages/TreatmentPlanMemo";
import TreatmentCatalog from "./pages/TreatmentCatalog";
import TreatmentTemplates from "./pages/TreatmentTemplates";
import TreatmentTemplateEditor from "./pages/TreatmentTemplateEditor";
import AdminLabTestsCatalog from "./pages/AdminLabTestsCatalog";
import AdminSystemSettings from "./pages/AdminSystemSettings";
import AdminAnalytics from "./pages/AdminAnalytics";
import PublicTreatmentPlan from "./pages/PublicTreatmentPlan";
import { diseaseLoader, diseaseStaticPaths } from "./loaders/diseaseLoader";
import { parentsLoader } from "./loaders/parentsLoader";

// Обёртки для синхронной установки языка до рендера контента.
const RuRoot = () => (
  <LangBoundary lang="ru">
    <RootLayout />
  </LangBoundary>
);
const EnRoot = () => (
  <LangBoundary lang="en">
    <RootLayout />
  </LangBoundary>
);

// Русские публичные роуты — пре-рендерятся для SEO.
const ruPublicChildren = [
  { index: true, Component: Index },
  { path: "for-parents", Component: ForParents, loader: parentsLoader as any },
  {
    path: "for-parents/:slug",
    Component: DiseaseDetailPage,
    loader: diseaseLoader as any,
    getStaticPaths: diseaseStaticPaths,
  },
  { path: "for-doctors", Component: ForDoctors },
  { path: "media", Component: Media },
  { path: "videos", Component: Videos },
  { path: "reviews", Component: Reviews },
  { path: "contacts", Component: Contacts },
  { path: "publications", Component: Publications },
  { path: "methodologies", Component: Methodologies },
  { path: "travel-notes", Component: TravelNotes },
  { path: "masterclasses", Component: Masterclasses },
  { path: "clinical-cases", Component: ClinicalCases },
  { path: "blog", Component: Blog },
  { path: "video-cases", Component: VideoCasesPage },
  { path: "team", Component: Team },
  { path: "qa", Component: QA },
  { path: "research", Component: Research },
  { path: "privacy-policy", Component: PrivacyPolicy },
  { path: "consent", Component: Consent },
  { path: "results", Component: Results },
  { path: "self-check", Component: SelfCheck },
  { path: "self-check/:slug", Component: SelfCheckDetail },
];

// Английские роуты — обслуживаются как SPA (без SSG-пре-рендеринга),
// чтобы не дублировать 70+ страниц. Поэтому каждый помечен `entry`.
const enPublicChildren = [
  { index: true, Component: Index, entry: "src/pages/Index.tsx" },
  { path: "for-parents", Component: ForParents, entry: "src/pages/ForParents.tsx" },
  { path: "for-parents/:slug", Component: DiseaseDetailPage, entry: "src/pages/DiseaseDetailPage.tsx" },
  { path: "for-doctors", Component: ForDoctors, entry: "src/pages/ForDoctors.tsx" },
  { path: "media", Component: Media, entry: "src/pages/Media.tsx" },
  { path: "videos", Component: Videos, entry: "src/pages/Videos.tsx" },
  { path: "reviews", Component: Reviews, entry: "src/pages/Reviews.tsx" },
  { path: "contacts", Component: Contacts, entry: "src/pages/Contacts.tsx" },
  { path: "publications", Component: Publications, entry: "src/pages/Publications.tsx" },
  { path: "methodologies", Component: Methodologies, entry: "src/pages/Methodologies.tsx" },
  { path: "travel-notes", Component: TravelNotes, entry: "src/pages/TravelNotes.tsx" },
  { path: "masterclasses", Component: Masterclasses, entry: "src/pages/Masterclasses.tsx" },
  { path: "clinical-cases", Component: ClinicalCases, entry: "src/pages/ClinicalCases.tsx" },
  { path: "blog", Component: Blog, entry: "src/pages/Blog.tsx" },
  { path: "video-cases", Component: VideoCasesPage, entry: "src/pages/VideoCases.tsx" },
  { path: "team", Component: Team, entry: "src/pages/Team.tsx" },
  { path: "qa", Component: QA, entry: "src/pages/QA.tsx" },
  { path: "research", Component: Research, entry: "src/pages/Research.tsx" },
  { path: "privacy-policy", Component: PrivacyPolicy, entry: "src/pages/PrivacyPolicy.tsx" },
  { path: "consent", Component: Consent, entry: "src/pages/Consent.tsx" },
  { path: "results", Component: Results, entry: "src/pages/Results.tsx" },
  { path: "self-check", Component: SelfCheck, entry: "src/pages/SelfCheck.tsx" },
  { path: "self-check/:slug", Component: SelfCheckDetail, entry: "src/pages/SelfCheckDetail.tsx" },
];

export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <RuRoot />,
    children: [
      ...ruPublicChildren,

      // --- Приватные / служебные роуты: исключены из SSG ---
      { path: "auth", Component: Auth, entry: "src/pages/Auth.tsx" },
      { path: "portal", Component: PatientPortal, entry: "src/pages/PatientPortal.tsx" },
      { path: "admin", Component: Admin, entry: "src/pages/Admin.tsx" },
      { path: "admin/requests", Component: AdminRequests, entry: "src/pages/AdminRequests.tsx" },
      { path: "admin/certificates", Component: AdminCertificates, entry: "src/pages/AdminCertificates.tsx" },
      { path: "admin/prescriptions", Component: AdminPrescriptions, entry: "src/pages/AdminPrescriptions.tsx" },
      { path: "admin/questions", Component: AdminQuestions, entry: "src/pages/AdminQuestions.tsx" },
      { path: "admin/operations-journal", Component: AdminOperationsJournal, entry: "src/pages/AdminOperationsJournal.tsx" },
      { path: "admin/disease-articles", Component: AdminDiseaseArticles, entry: "src/pages/AdminDiseaseArticles.tsx" },
      { path: "admin/patient-cards", Component: AdminPatientCards, entry: "src/pages/AdminPatientCards.tsx" },
      { path: "admin/consultations", Component: AdminConsultations, entry: "src/pages/AdminConsultations.tsx" },
      { path: "admin/self-check", Component: AdminSelfCheck, entry: "src/pages/AdminSelfCheck.tsx" },
      { path: "admin/treatment-plans", Component: TreatmentPlans, entry: "src/pages/TreatmentPlans.tsx" },
      { path: "admin/treatment-plans/new", Component: TreatmentPlanEditor, entry: "src/pages/TreatmentPlanEditor.tsx" },
      { path: "admin/treatment-plans/:id", Component: TreatmentPlanEditor, entry: "src/pages/TreatmentPlanEditor.tsx" },
      { path: "admin/treatment-plans/:id/print", Component: TreatmentPlanPrint, entry: "src/pages/TreatmentPlanPrint.tsx" },
      { path: "admin/treatment-plans/:id/memo", Component: TreatmentPlanMemo, entry: "src/pages/TreatmentPlanMemo.tsx" },
      { path: "admin/treatment-catalog", Component: TreatmentCatalog, entry: "src/pages/TreatmentCatalog.tsx" },
      { path: "admin/lab-tests-catalog", Component: AdminLabTestsCatalog, entry: "src/pages/AdminLabTestsCatalog.tsx" },
      { path: "admin/treatment-templates", Component: TreatmentTemplates, entry: "src/pages/TreatmentTemplates.tsx" },
      { path: "admin/treatment-templates/new", Component: TreatmentTemplateEditor, entry: "src/pages/TreatmentTemplateEditor.tsx" },
      { path: "admin/treatment-templates/:id", Component: TreatmentTemplateEditor, entry: "src/pages/TreatmentTemplateEditor.tsx" },
      { path: "admin/system-settings", Component: AdminSystemSettings, entry: "src/pages/AdminSystemSettings.tsx" },
      { path: "admin/analytics", Component: AdminAnalytics, entry: "src/pages/AdminAnalytics.tsx" },
      { path: "p/:hash", Component: PublicTreatmentPlan, entry: "src/pages/PublicTreatmentPlan.tsx" },

      { path: "*", Component: NotFound },
    ],
  },
  {
    path: "/en",
    element: <EnRoot />,
    children: [
      ...enPublicChildren,
      { path: "*", Component: NotFound, entry: "src/pages/NotFound.tsx" },
    ],
  },
];

export default routes;
