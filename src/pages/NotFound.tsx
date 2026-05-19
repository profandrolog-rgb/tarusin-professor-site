import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import PageMeta from "@/components/PageMeta";

const NotFound = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <PageMeta
        title={isEn ? "404 — Page Not Found | Prof. Tarusin D.I." : "404 — страница не найдена | проф. Тарусин Д.И."}
        description={isEn ? "The page you are looking for does not exist or has been moved. Return to the home page of Prof. Tarusin D.I.'s official site." : "Запрошенная страница не существует или была перемещена. Вернитесь на главную страницу официального сайта профессора Тарусина Д.И."}
        path={location.pathname}
      />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          {isEn ? "Oops! Page not found" : "Страница не найдена"}
        </p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {isEn ? "Return to Home" : "На главную"}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
