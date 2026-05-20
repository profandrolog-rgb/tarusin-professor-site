import type { RouteRecord } from "vite-react-ssg";
import RootLayout from "./RootLayout";
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
import { diseaseLoader, diseaseStaticPaths } from "./loaders/diseaseLoader";
import { parentsLoader } from "./loaders/parentsLoader";

// Публичные роуты, которые НЕ требуют динамических данных, попадают в SSG автоматически.
// Админка перечислена в include: false (ниже) — pre-render их не трогает.
export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, Component: Index },
      { path: "for-parents", Component: ForParents },
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

      // --- Приватные / служебные роуты: исключены из SSG ---
      { path: "auth", Component: Auth, entry: "src/pages/Auth.tsx" },
      { path: "portal", Component: PatientPortal, entry: "src/pages/PatientPortal.tsx" },
      { path: "admin", Component: Admin, entry: "src/pages/Admin.tsx" },
      { path: "admin/requests", Component: AdminRequests },
      { path: "admin/certificates", Component: AdminCertificates },
      { path: "admin/prescriptions", Component: AdminPrescriptions },
      { path: "admin/questions", Component: AdminQuestions },
      { path: "admin/operations-journal", Component: AdminOperationsJournal },
      { path: "admin/disease-articles", Component: AdminDiseaseArticles },
      { path: "admin/patient-cards", Component: AdminPatientCards },
      { path: "admin/consultations", Component: AdminConsultations },
      { path: "admin/self-check", Component: AdminSelfCheck },

      { path: "*", Component: NotFound },
    ],
  },
];

export default routes;
