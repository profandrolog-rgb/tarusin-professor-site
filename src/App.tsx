import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/for-parents" element={<ForParents />} />
              <Route path="/for-doctors" element={<ForDoctors />} />
              <Route path="/media" element={<Media />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/publications" element={<Publications />} />
              <Route path="/methodologies" element={<Methodologies />} />
              <Route path="/travel-notes" element={<TravelNotes />} />
              <Route path="/masterclasses" element={<Masterclasses />} />
              <Route path="/clinical-cases" element={<ClinicalCases />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/video-cases" element={<VideoCasesPage />} />
              <Route path="/team" element={<Team />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/requests" element={<AdminRequests />} />
              <Route path="/admin/certificates" element={<AdminCertificates />} />
              <Route path="/admin/prescriptions" element={<AdminPrescriptions />} />
              <Route path="/admin/questions" element={<AdminQuestions />} />
              <Route path="/admin/operations-journal" element={<AdminOperationsJournal />} />
              <Route path="/admin/disease-articles" element={<AdminDiseaseArticles />} />
              <Route path="/qa" element={<QA />} />
              <Route path="/research" element={<Research />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/consent" element={<Consent />} />
              <Route path="/results" element={<Results />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
