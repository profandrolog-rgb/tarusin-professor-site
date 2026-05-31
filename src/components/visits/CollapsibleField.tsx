import { useState, ReactNode } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  hasValue: boolean;
  label: ReactNode;
  children: ReactNode;
  /** Если true — всегда показывать развёрнутым, игнорируя hasValue. */
  alwaysExpanded?: boolean;
}

/**
 * Сворачивает пустые необязательные поля до строки с заголовком и кнопкой "+".
 * Разворачивается одним кликом, после ввода значения остаётся развёрнутым.
 */
export function CollapsibleField({ hasValue, label, children, alwaysExpanded }: Props) {
  const [expanded, setExpanded] = useState(false);
  const open = alwaysExpanded || hasValue || expanded;

  if (open) {
    return <div className="space-y-1">{children}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => setExpanded(true)}
      className="group flex w-full items-center justify-between rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2 text-left text-sm text-muted-foreground transition hover:border-primary/50 hover:bg-muted/40 hover:text-foreground"
    >
      <span className="flex items-center gap-2">
        <Plus className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
        <span>{label}</span>
      </span>
      <ChevronDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-80" />
    </button>
  );
}
