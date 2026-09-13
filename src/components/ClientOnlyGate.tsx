import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * Приватные разделы зависят от сессии, поэтому пре-рендер (SSG) и первый кадр
 * в браузере неизбежно расходятся: сервер не знает про вход пользователя.
 * В production сборке vite-react-ssg ВСЕГДА «оживляет» готовую разметку
 * (hydrate), и расхождение превращается в React #418/#423 — вместо страницы
 * показывается экран ошибки.
 *
 * Гейт выдаёт для таких маршрутов один и тот же placeholder на сервере и в
 * первом кадре клиента, а настоящее содержимое рендерит уже после монтирования.
 * Публичные SEO-страницы через гейт не проходят и пре-рендерятся как раньше.
 */
const isSessionDependentPath = (pathName: string) =>
  /^\/(auth|portal|admin|cabinet|p)(\/|$)/.test(pathName) ||
  pathName.startsWith("/.lovable/");

export function ClientOnlyGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted && isSessionDependentPath(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

export default ClientOnlyGate;
