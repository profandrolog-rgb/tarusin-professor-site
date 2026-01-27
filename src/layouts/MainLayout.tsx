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
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        {/* Floating trigger button */}
        <SidebarTrigger className="fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 md:bottom-8 md:left-8">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
        
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
