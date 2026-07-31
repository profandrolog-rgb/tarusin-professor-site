import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Copy, Send, History, Users } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuLabel,
} from "@/components/ui/context-menu";
import {
  getActiveContext,
  getRecentContexts,
  sendFragmentToProtocol,
  subscribeActiveContext,
  type ActivePatientContext,
} from "@/lib/protocolBridge";

const KIND_LABEL: Record<string, string> = {
  visit: "осмотр",
  ultrasound: "УЗИ",
  consultation: "консультация",
  treatment_plan: "план лечения",
};

function getSelectedText(): string {
  const sel = window.getSelection?.();
  return sel ? sel.toString().trim() : "";
}

/**
 * Правый клик по любому ИИ-тексту (интерпретация индексов, механизмы путей и т.п.):
 * выделил фрагмент → отправил в открытый протокол. Вставка идёт ДОПОЛНЕНИЕМ
 * (в поле-получателе фрагменты дописываются, предыдущие не затираются),
 * поэтому цитаты можно отправлять по частям.
 */
export function QuoteContextMenu({
  children,
  fullText,
  className,
}: {
  children: ReactNode;
  /** Текст по умолчанию, если ничего не выделено. */
  fullText?: string;
  className?: string;
}) {
  const [active, setActive] = useState<ActivePatientContext | null>(() => getActiveContext());
  const [recent, setRecent] = useState<ActivePatientContext[]>(() => getRecentContexts());

  useEffect(() => {
    const unsub = subscribeActiveContext((ctx) => {
      setActive(ctx);
      setRecent(getRecentContexts());
    });
    const refresh = () => {
      setActive(getActiveContext());
      setRecent(getRecentContexts());
    };
    window.addEventListener("focus", refresh);
    return () => {
      unsub();
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const getFragment = () => getSelectedText() || fullText || "";

  const copyFragment = async () => {
    const text = getFragment();
    if (!text) return toast.error("Сначала выделите фрагмент");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Скопировано в буфер обмена");
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  const sendTo = (target: ActivePatientContext | null) => {
    const text = getFragment();
    if (!text) return toast.error("Сначала выделите фрагмент");
    const result = sendFragmentToProtocol(text, target ?? undefined);
    if (result === "delivered") {
      toast.success(
        target
          ? `Отправлено: ${target.patientName} (${KIND_LABEL[target.kind] || target.kind})`
          : "Отправлено в открытую вкладку протокола",
      );
    } else {
      toast.info("Вкладка протокола не открыта — фрагмент будет вставлен при её открытии");
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={className}>{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-72">
        <ContextMenuLabel className="text-xs text-muted-foreground font-normal">
          Выделите фрагмент и отправьте в протокол
        </ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={copyFragment}>
          <Copy className="w-4 h-4 mr-2" /> Копировать фрагмент
        </ContextMenuItem>
        {active ? (
          <ContextMenuItem onSelect={() => sendTo(active)}>
            <Send className="w-4 h-4 mr-2" />
            Вставить в активный протокол
          </ContextMenuItem>
        ) : recent.length > 0 ? (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <History className="w-4 h-4 mr-2" /> Вставить в недавний протокол
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-72">
              {recent.map((r, i) => (
                <ContextMenuItem key={i} onSelect={() => sendTo(r)}>
                  <Users className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <span className="truncate">
                    {r.patientName}{" "}
                    <span className="text-muted-foreground">· {KIND_LABEL[r.kind] || r.kind}</span>
                  </span>
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        ) : (
          <ContextMenuItem disabled>
            <Send className="w-4 h-4 mr-2" /> Откройте протокол в соседней вкладке
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default QuoteContextMenu;
