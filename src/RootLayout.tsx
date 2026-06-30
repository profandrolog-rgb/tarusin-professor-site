import { Outlet, useNavigation } from "react-router-dom";
import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "@/layouts/MainLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { AppErrorBoundary } from "@/components/RouteErrorBoundary";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Тонкая полоска прогресса вверху + центрированный спиннер для Suspense.
 *  Показывает пользователю, что клик принят и страница грузится, а не «зависла». */
const RouteLoader = () => (
  <>
    <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 overflow-hidden pointer-events-none">
      <div className="h-full w-1/3 bg-primary animate-[loader_1.2s_ease-in-out_infinite]" />
    </div>
    <div className="min-h-[40vh] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
    <style>{`@keyframes loader{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
  </>
);

/** Полоска при навигации между уже загруженными маршрутами (data-router). */
const NavigationBar = () => {
  const nav = useNavigation();
  if (nav.state === "idle") return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 overflow-hidden pointer-events-none">
      <div className="h-full w-1/3 bg-primary animate-[loader_1.2s_ease-in-out_infinite]" />
    </div>
  );
};

const RootLayout = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <MainLayout>
          <AppErrorBoundary>
            <NavigationBar />
            <Suspense fallback={<RouteLoader />}>
              <Outlet />
            </Suspense>
          </AppErrorBoundary>
        </MainLayout>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default RootLayout;

