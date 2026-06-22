import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Copy, Send, Pill, History, Users, ListPlus } from "lucide-react";
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
  sendPlanItemsToProtocol,
  pushPendingRxItems,
  subscribeActiveContext,
  type ActivePatientContext,
  type ParsedPlanItem,
  type ParsedRxItem,
} from "@/lib/protocolBridge";
import { supabase } from "@/integrations/supabase/client";
import { PlanItemsPreviewDialog, type EditableItem } from "./PlanItemsPreviewDialog";
import { RxItemsPreviewDialog, type EditableRxItem } from "./RxItemsPreviewDialog";

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

export function SelectionContextMenu({ children, fullText }: { children: ReactNode; fullText?: string }) {
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
    if (target) {
      if (result === "delivered") {
        toast.success(`Отправлено: ${target.patientName} (${KIND_LABEL[target.kind] || target.kind})`);
      } else {
        toast.info("Вкладка протокола не открыта — фрагмент будет вставлен при её открытии");
      }
    } else if (result === "delivered") {
      toast.success("Отправлено в открытую вкладку протокола");
    } else {
      toast.info("Открытых вкладок протокола не найдено — фрагмент в очереди");
    }
  };

  const [rxOpen, setRxOpen] = useState(false);
  const [rxParsing, setRxParsing] = useState(false);
  const [rxItems, setRxItems] = useState<EditableRxItem[]>([]);

  const formPrescription = async () => {
    const text = getFragment();
    if (!text) return toast.error("Сначала выделите фрагмент");
    setRxItems([]);
    setRxOpen(true);
    setRxParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-prescription-items", {
        body: { text },
      });
      if (error) throw error;
      const items: ParsedRxItem[] = data?.items || [];
      setRxItems(
        items.map((it, idx) => ({
          ...it,
          _id: `${Date.now()}-${idx}`,
          _selected: true,
        })),
      );
    } catch (e: any) {
      toast.error("Не удалось разобрать препараты", { description: e?.message });
      setRxOpen(false);
    } finally {
      setRxParsing(false);
    }
  };

  const confirmSendRxItems = (selected: ParsedRxItem[]) => {
    if (selected.length === 0) return;
    pushPendingRxItems(selected, active?.patientId);
    setRxOpen(false);
    const url = `/admin/prescriptions${active?.patientId ? `?patientId=${active.patientId}` : ""}`;
    window.open(url, "_blank", "noopener");
    toast.success(`В очереди ${selected.length} бланк(ов) — откроется форма рецептов`);
  };


  const [dialogOpen, setDialogOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [previewItems, setPreviewItems] = useState<EditableItem[]>([]);

  const distributeToPlan = async () => {
    const text = getFragment();
    if (!text) return toast.error("Сначала выделите фрагмент");
    setPreviewItems([]);
    setDialogOpen(true);
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-treatment-recommendations", {
        body: { text },
      });
      if (error) throw error;
      const items: ParsedPlanItem[] = data?.items || [];
      setPreviewItems(
        items.map((it, idx) => ({
          ...it,
          _id: `${Date.now()}-${idx}`,
          _selected: true,
        })),
      );
    } catch (e: any) {
      toast.error("Не удалось разобрать фрагмент", { description: e?.message });
      setDialogOpen(false);
    } finally {
      setParsing(false);
    }
  };

  const confirmSendPlanItems = (selected: ParsedPlanItem[]) => {
    if (selected.length === 0) return;
    const target = active?.kind === "treatment_plan" ? active : undefined;
    sendPlanItemsToProtocol(selected, target);
    setDialogOpen(false);
    toast.success(
      target
        ? `Отправлено ${selected.length} позиций в план: ${target.patientName}`
        : `${selected.length} позиций в очереди — откройте план лечения пациента`,
    );
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-72">
          <ContextMenuLabel className="text-xs text-muted-foreground font-normal">
            {active ? (
              <>Активный протокол: <span className="text-foreground font-medium">{active.patientName}</span> · {KIND_LABEL[active.kind] || active.kind}</>
            ) : (
              "Нет активного протокола"
            )}
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
                      {r.patientName} <span className="text-muted-foreground">· {KIND_LABEL[r.kind] || r.kind}</span>
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
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={distributeToPlan}>
            <ListPlus className="w-4 h-4 mr-2" /> Распределить по плану лечения
          </ContextMenuItem>
          <ContextMenuItem onSelect={formPrescription}>
            <Pill className="w-4 h-4 mr-2" /> Сформировать рецепт
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <PlanItemsPreviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        items={previewItems}
        onItemsChange={setPreviewItems}
        loading={parsing}
        patientName={active?.kind === "treatment_plan" ? active.patientName : null}
        onConfirm={confirmSendPlanItems}
      />

      <RxItemsPreviewDialog
        open={rxOpen}
        onOpenChange={setRxOpen}
        items={rxItems}
        onItemsChange={setRxItems}
        loading={rxParsing}
        patientName={active?.patientName ?? null}
        onConfirm={confirmSendRxItems}
      />
    </>
  );
}
