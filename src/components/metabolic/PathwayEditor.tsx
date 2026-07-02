import { lazy, Suspense, useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { SceneJson } from "./PathwaySceneSVG";

// Ленивая загрузка тяжёлого редактора Excalidraw
const ExcalidrawLazy: any = lazy(async () => {
  const mod: any = await import("@excalidraw/excalidraw");
  try { await import("@excalidraw/excalidraw/index.css"); } catch {}
  return { default: mod.Excalidraw };
});

function EditorInner({
  initialScene,
  onApi,
}: {
  initialScene: SceneJson | null | undefined;
  onApi: (api: any) => void;
}) {
  return (
    <ExcalidrawLazy
      initialData={{
        elements: (initialScene?.elements as any) || [],
        appState: {
          ...(initialScene?.appState || {}),
          viewBackgroundColor: "#ffffff",
        } as any,
        files: initialScene?.files || null,
        scrollToContent: true,
      }}
      excalidrawAPI={onApi}
      UIOptions={{
        canvasActions: {
          loadScene: false,
          saveToActiveFile: false,
          export: false,
        },
      }}
    />
  );
}

export function PathwayEditor({
  open,
  onOpenChange,
  pathwayId,
  pathwayName,
  initialScene,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pathwayId: string;
  pathwayName: string;
  initialScene: SceneJson | null | undefined;
  onSaved?: (scene: SceneJson) => void;
}) {
  const apiRef = useRef<any>(null);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => { if (!open) { apiRef.current = null; setReady(false); } }, [open]);

  const handleSave = async () => {
    if (!apiRef.current) return;
    setSaving(true);
    try {
      const elements = apiRef.current.getSceneElements();
      const appState = apiRef.current.getAppState();
      const files = apiRef.current.getFiles();
      const cleanAppState = {
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize,
      };
      const scene: SceneJson = {
        elements: JSON.parse(JSON.stringify(elements)),
        appState: cleanAppState,
        files: files || {},
      };
      const { error } = await (supabase as any)
        .from("pathways")
        .update({ svg_scene: scene })
        .eq("id", pathwayId);
      if (error) throw error;
      toast({ title: "Схема сохранена", description: pathwayName });
      onSaved?.(scene);
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Ошибка сохранения", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle>Редактирование схемы: {pathwayName}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            У ключевых узлов задавайте <code>customData.nodeId</code> — по нему приложение подсвечивает узлы по тяжести отклонений.
          </p>
        </DialogHeader>
        <div className="flex-1 min-h-0 relative">
          <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
            {open && (
              <EditorInner
                initialScene={initialScene}
                onApi={(api) => { apiRef.current = api; setReady(true); }}
              />
            )}
          </Suspense>
        </div>
        <DialogFooter className="p-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Отмена</Button>
          <Button onClick={handleSave} disabled={saving || !ready} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Сохранить схему
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
