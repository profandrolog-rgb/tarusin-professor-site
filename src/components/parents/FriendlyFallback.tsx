import { AlertCircle, BookOpen, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type Variant = "loading" | "empty" | "error" | "notFound";

interface FriendlyFallbackProps {
  variant: Variant;
  title?: string;
  description?: string;
  onRetry?: () => void;
  /** Доп. кнопка-ссылка, например «К каталогу». */
  primaryHref?: string;
  primaryLabel?: string;
  className?: string;
}

const ICONS: Record<Variant, JSX.Element> = {
  loading: <RefreshCw className="w-8 h-8 text-primary animate-spin" />,
  empty: <BookOpen className="w-8 h-8 text-muted-foreground" />,
  error: <WifiOff className="w-8 h-8 text-destructive" />,
  notFound: <AlertCircle className="w-8 h-8 text-muted-foreground" />,
};

const DEFAULT_COPY: Record<Variant, { title: string; description: string }> = {
  loading: {
    title: "Загружаем материалы…",
    description: "Подключаемся к базе знаний. Это займёт пару секунд.",
  },
  empty: {
    title: "Материалы скоро появятся",
    description:
      "Этот раздел сейчас пополняется. Загляните позже — или посмотрите другие материалы профессора.",
  },
  error: {
    title: "Не удалось загрузить материалы",
    description:
      "Похоже, временные перебои со связью. Проверьте интернет и попробуйте ещё раз — данные не потеряны.",
  },
  notFound: {
    title: "Материал не найден",
    description: "Возможно, страница была удалена или ещё не опубликована.",
  },
};

/**
 * Универсальный дружелюбный fallback вместо пустых экранов и серого «Загрузка…».
 * Используем в каталогах болезней и на странице конкретной статьи.
 */
export function FriendlyFallback({
  variant,
  title,
  description,
  onRetry,
  primaryHref,
  primaryLabel,
  className = "",
}: FriendlyFallbackProps) {
  const copy = DEFAULT_COPY[variant];
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-4 py-16 ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        {ICONS[variant]}
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        {title ?? copy.title}
      </h2>
      <p className="text-muted-foreground max-w-md mb-6">
        {description ?? copy.description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="default" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Попробовать снова
          </Button>
        )}
        {primaryHref && (
          <Link to={primaryHref}>
            <Button variant="outline" size="sm">
              {primaryLabel ?? "Перейти в каталог"}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

/** Скелетон карточек для состояния загрузки. */
export function DiseaseCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-5 animate-pulse"
        >
          <div className="h-5 w-2/3 bg-muted rounded mb-3" />
          <div className="h-4 w-full bg-muted rounded mb-2" />
          <div className="h-4 w-5/6 bg-muted rounded mb-4" />
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-muted rounded-full" />
            <div className="h-6 w-16 bg-muted rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default FriendlyFallback;
