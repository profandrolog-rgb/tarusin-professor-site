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
import Publications from "./pages/Publications";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
              <Route path="/auth" element={<Auth />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
