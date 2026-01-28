import { Link, useLocation } from "react-router-dom";
import {
  Home,
  User,
  Stethoscope,
  Users,
  GraduationCap,
  Tv,
  Video,
  Star,
  Phone,
  ChevronLeft,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { title: "Главная", url: "/", icon: Home },
  { title: "Обо мне", url: "/#about", icon: User },
  { title: "Консультации", url: "/#consultations", icon: Stethoscope },
];

const pageNavItems = [
  { title: "Для родителей", url: "/for-parents", icon: Users },
  { title: "Для врачей", url: "/for-doctors", icon: GraduationCap },
  { title: "СМИ и ТВ", url: "/media", icon: Tv },
  { title: "Видео", url: "/videos", icon: Video },
  { title: "Отзывы", url: "/reviews", icon: Star },
  { title: "Контакты", url: "/contacts", icon: Phone },
];

export function AppSidebar() {
  const location = useLocation();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (url: string) => {
    if (url === "/") {
      return location.pathname === "/";
    }
    if (url.startsWith("/#")) {
      return location.pathname === "/" && location.hash === url.replace("/", "");
    }
    return location.pathname === url;
  };

  const handleNavClick = (url: string) => {
    if (url.startsWith("/#")) {
      const hash = url.replace("/", "");
      if (location.pathname === "/") {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border z-50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0">
            ТД
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="font-semibold text-foreground text-sm truncate">Профессор Тарусин</p>
              <p className="text-xs text-muted-foreground truncate">Андролог, хирург</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link
                      to={item.url}
                      onClick={() => handleNavClick(item.url)}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Разделы</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pageNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={toggleSidebar}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
          {!isCollapsed && <span>Свернуть</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
