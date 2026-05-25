import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? "⌘" : "Ctrl";

const SHORTCUTS: Array<[string, string]> = [
  [`${mod} + S`, "Сохранить лист"],
  [`${mod} + P`, "Превью печати (новая вкладка)"],
  [`${mod} + K`, "Командная палитра: добавить позицию"],
  [`${mod} + E`, "Меню экспорта (Печать / DOCX / Памятка)"],
  [`${mod} + H`, "История версий (для выписанных)"],
  [`${mod} + D`, "Дублировать активную позицию"],
  [`${mod} + Z`, "Отменить последнее действие (до 10 шагов)"],
  ["Tab / Shift+Tab", "Навигация между полями"],
  ["Esc", "Закрыть открытое окно"],
  ["?", "Показать эту справку"],
];

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export function HotkeysHelpDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">⌨ Горячие клавиши</DialogTitle>
          <DialogDescription>Ускорьте работу с листом назначений.</DialogDescription>
        </DialogHeader>
        <div className="divide-y">
          {SHORTCUTS.map(([k, label]) => (
            <div key={k} className="flex items-center justify-between py-2 gap-3 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <kbd className="px-2 py-1 rounded border bg-muted font-mono text-xs whitespace-nowrap">{k}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
