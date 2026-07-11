import { useRef, useEffect } from "react";
import { toast } from "sonner";
import { b as subscribeFragments, d as popQueuedFragments } from "./protocolBridge-4TuhSmsW.js";
function insertAtCursor(el, text) {
  var _a;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const sep = before && !before.endsWith("\n") && !before.endsWith(" ") ? "\n\n" : "";
    const newValue = before + sep + text + after;
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = (_a = Object.getOwnPropertyDescriptor(proto, "value")) == null ? void 0 : _a.set;
    setter == null ? void 0 : setter.call(el, newValue);
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
function useProtocolFragmentReceiver(filter) {
  const lastFocusedRef = useRef(null);
  useEffect(() => {
    const onFocusIn = (e) => {
      const t = e.target;
      if (!t) return;
      if (t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement || t instanceof HTMLElement && t.isContentEditable) {
        lastFocusedRef.current = t;
      }
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);
  useEffect(() => {
    const tryInsert = (msg) => {
      const active = document.activeElement;
      const target = active && (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement || active instanceof HTMLElement && active.isContentEditable) ? active : lastFocusedRef.current;
      if (target && insertAtCursor(target, msg.text)) {
        toast.success("Фрагмент вставлен из ИИ-ассистента", {
          description: msg.text.slice(0, 80) + (msg.text.length > 80 ? "…" : "")
        });
      } else {
        toast.info("Получен фрагмент из ИИ — кликните в нужное поле", {
          duration: 15e3,
          action: {
            label: "Скопировать",
            onClick: () => {
              var _a;
              return (_a = navigator.clipboard) == null ? void 0 : _a.writeText(msg.text);
            }
          },
          description: msg.text.slice(0, 120) + (msg.text.length > 120 ? "…" : "")
        });
        const onceFocus = (e) => {
          const t = e.target;
          if (t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement || t instanceof HTMLElement && t.isContentEditable) {
            if (insertAtCursor(t, msg.text)) {
              toast.success("Фрагмент вставлен");
              document.removeEventListener("focusin", onceFocus);
            }
          }
        };
        document.addEventListener("focusin", onceFocus, { once: false });
        setTimeout(() => document.removeEventListener("focusin", onceFocus), 6e4);
      }
    };
    const unsub = subscribeFragments(tryInsert, filter);
    const queued = popQueuedFragments(filter);
    if (queued.length > 0) {
      setTimeout(() => queued.forEach(tryInsert), 300);
    }
    return () => unsub();
  }, [filter == null ? void 0 : filter.patientId, filter == null ? void 0 : filter.kind]);
}
export {
  useProtocolFragmentReceiver as u
};
