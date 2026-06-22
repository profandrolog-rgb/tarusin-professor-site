import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  popQueuedFragments,
  subscribeFragments,
  type FragmentMessage,
  type ProtocolKind,
} from "@/lib/protocolBridge";

type Editable = HTMLTextAreaElement | HTMLInputElement | HTMLElement;

function insertAtCursor(el: Editable, text: string) {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const sep = before && !before.endsWith("\n") && !before.endsWith(" ") ? "\n\n" : "";
    const newValue = before + sep + text + after;
    // Use native setter to play nicely with React controlled inputs
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    setter?.call(el, newValue);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    const caret = (before + sep + text).length;
    el.setSelectionRange(caret, caret);
    el.focus();
    return true;
  }
  if (el.isContentEditable) {
    el.focus();
    document.execCommand("insertText", false, text);
    return true;
  }
  return false;
}

export function useProtocolFragmentReceiver(filter?: { patientId?: string; kind?: ProtocolKind }) {
  const lastFocusedRef = useRef<Editable | null>(null);

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLInputElement ||
        (t instanceof HTMLElement && t.isContentEditable)
      ) {
        lastFocusedRef.current = t as Editable;
      }
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);

  useEffect(() => {
    const tryInsert = (msg: FragmentMessage) => {
      const active = document.activeElement as HTMLElement | null;
      const target =
        active &&
        (active instanceof HTMLTextAreaElement ||
          active instanceof HTMLInputElement ||
          (active instanceof HTMLElement && active.isContentEditable))
          ? (active as Editable)
          : lastFocusedRef.current;

      if (target && insertAtCursor(target, msg.text)) {
        toast.success("Фрагмент вставлен из ИИ-ассистента", {
          description: msg.text.slice(0, 80) + (msg.text.length > 80 ? "…" : ""),
        });
      } else {
        toast.info("Получен фрагмент из ИИ — кликните в нужное поле", {
          duration: 15000,
          action: {
            label: "Скопировать",
            onClick: () => navigator.clipboard?.writeText(msg.text),
          },
          description: msg.text.slice(0, 120) + (msg.text.length > 120 ? "…" : ""),
        });
        // Wait for next focus then auto-insert
        const onceFocus = (e: FocusEvent) => {
          const t = e.target as HTMLElement | null;
          if (
            t instanceof HTMLTextAreaElement ||
            t instanceof HTMLInputElement ||
            (t instanceof HTMLElement && t.isContentEditable)
          ) {
            if (insertAtCursor(t as Editable, msg.text)) {
              toast.success("Фрагмент вставлен");
              document.removeEventListener("focusin", onceFocus);
            }
          }
        };
        document.addEventListener("focusin", onceFocus, { once: false });
        setTimeout(() => document.removeEventListener("focusin", onceFocus), 60000);
      }
    };

    const unsub = subscribeFragments(tryInsert, filter);

    // Drain queue on mount
    const queued = popQueuedFragments(filter);
    if (queued.length > 0) {
      // delay slightly so the page renders fields first
      setTimeout(() => queued.forEach(tryInsert), 300);
    }

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter?.patientId, filter?.kind]);
}
