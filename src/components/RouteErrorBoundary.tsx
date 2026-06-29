import { Component, ErrorInfo, ReactNode } from "react";
import { useRouteError, isRouteErrorResponse, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Дружелюбный экран ошибки.
 * Используется и React Router (errorElement), и классическим Error Boundary.
 */
function FriendlyErrorScreen({
  title,
  description,
  details,
  onRetry,
}: {
  title: string;
  description: string;
  details?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">{title}</h1>
        <p className="text-muted-foreground mb-6">{description}</p>

        {details && (
          <details className="text-left bg-muted rounded-lg p-3 mb-6 text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">
              Технические подробности
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{details}</pre>
          </details>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={onRetry ?? (() => window.location.reload())} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" /> Перезагрузить страницу
          </Button>
          <Link to="/">
            <Button variant="outline">
              <Home className="w-4 h-4 mr-2" /> На главную
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Если ошибка повторяется — напишите нам, мы быстро починим.
        </p>
      </div>
    </div>
  );
}

/**
 * Router-уровневая граница ошибок. Перехватывает любые ошибки в loader-ах
 * (включая «Unexpected token '<' ... is not valid JSON»), рендеринге роутов
 * и ответы 4xx/5xx через `throw new Response(...)`.
 */
export function RouteErrorBoundary() {
  const error = useRouteError() as unknown;
  const navigate = useNavigate();

  // Подробности для свертки (не показываем в проде наружу как заголовок).
  let title = "Что-то пошло не так";
  let description =
    "Не удалось открыть страницу. Это временный сбой — данные не потеряны.";
  let details: string | undefined;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Страница не найдена";
      description = "Возможно, материал был удалён или перемещён.";
    } else {
      title = `Ошибка ${error.status}`;
      description = error.statusText || description;
    }
    details = typeof error.data === "string" ? error.data : undefined;
  } else if (error instanceof Error) {
    if (/JSON|Unexpected token/i.test(error.message)) {
      title = "Не удалось загрузить данные страницы";
      description =
        "Сервер вернул неожиданный ответ. Перезагрузите страницу — обычно помогает.";
    }
    details = error.message;
    // eslint-disable-next-line no-console
    console.error("[RouteErrorBoundary]", error);
  }

  return (
    <FriendlyErrorScreen
      title={title}
      description={description}
      details={details}
      onRetry={() => navigate(0)}
    />
  );
}

/**
 * Классический Error Boundary на случай ошибок вне data-router (например,
 * в провайдерах, портале/чатботе). Ловит ошибки рендера ниже по дереву.
 */
interface AppErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[AppErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <FriendlyErrorScreen
          title={this.props.fallbackTitle ?? "Что-то пошло не так"}
          description={
            this.props.fallbackDescription ??
            "Произошёл сбой при отображении страницы. Попробуйте перезагрузить."
          }
          details={this.state.error.message}
          onRetry={() => {
            this.reset();
            if (typeof window !== "undefined") window.location.reload();
          }}
        />
      );
    }
    return this.props.children;
  }
}

export default RouteErrorBoundary;
