import { ReactNode, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { ClientOnly } from "vite-react-ssg";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu } from "lucide-react";
import SmartSearchTrail from "@/components/SmartSearchTrail";
import SmartSearchEndCTA from "@/components/SmartSearchEndCTA";

const PatientChatbot = lazy(() => import("@/components/PatientChatbot"));

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const isWorkspaceRoute =
    location.pathname === "/auth" ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/cabinet") ||
    location.pathname.startsWith("/portal");

  if (isWorkspaceRoute) {
    return <main className="w-full min-h-screen bg-background">{children}</main>;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />

      <SidebarTrigger className="fixed bottom-20 left-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 md:bottom-24 md:left-8">
        <Menu className="h-5 w-5" />
      </SidebarTrigger>

      <main className="w-full min-h-screen">
        {children}
        <ClientOnly>{() => <SmartSearchEndCTA />}</ClientOnly>
      </main>

      <ClientOnly>{() => <SmartSearchTrail />}</ClientOnly>


      {/* Chatbot — клиент-онли: использует fetch к edge function и DOM-рефы */}
      <ClientOnly>
        {() => (
          <Suspense fallback={null}>
            <PatientChatbot />
          </Suspense>
        )}
      </ClientOnly>
    </SidebarProvider>
  );
}
