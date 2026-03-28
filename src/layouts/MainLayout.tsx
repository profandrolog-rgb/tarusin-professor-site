import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      {/* Sidebar as overlay - doesn't affect main content */}
      <AppSidebar />
      
      {/* Floating trigger button */}
      <SidebarTrigger className="fixed bottom-20 left-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 md:bottom-24 md:left-8">
        <Menu className="h-5 w-5" />
      </SidebarTrigger>
      
      {/* Main content takes full width */}
      <main className="w-full min-h-screen">
        {children}
      </main>
    </SidebarProvider>
  );
}
