import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { SceneJson } from "./PathwaySceneSVG";

// Модальный редактор сцены Excalidraw. Сохраняет JSON в pathways.svg_scene.
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
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ExcalidrawComp, setExcalidrawComp] = useState<any>(null);
  const [ReactDomClient, setReactDomClient] = useState<any>(null);
  const rootRef = useRef<any>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const [{ Excalidraw }, rdc] = await Promise.all([
        import("@excalidraw/excalidraw"),
        import("react-dom/client"),
      ]);
      // Подтягиваем стили один раз
      await import("@excalidraw/excalidraw/index.css").catch(() => {});
      if (cancelled) return;
      setExcalidrawComp(() => Excalidraw);
      setReactDomClient(() => rdc);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !ExcalidrawComp || !ReactDomClient || !hostRef.current) return;
    const React = require("react");
    const root = ReactDomClient.createRoot(hostRef.current);
    rootRef.current = root;
    root.render(
      React.createElement(ExcalidrawComp, {
        initialData: {
          elements: initialScene?.elements || [],
          appState: {
            ...(initialScene?.appState || {}),
            viewBackgroundColor: "#ffffff",
          },
          files: initialScene?.files || null,
          scrollToContent: true,
        },
        excalidrawAPI: (api: any) => {
          apiRef.current = api;
          setReady(true);
        },
        UIOptions: {
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
          },
        },
      })
    );
    return () => {
      try { root.unmount(); } catch {}
      rootRef.current = null;
      apiRef.current = null;
      setReady(false);
    };
  }, [open, ExcalidrawComp, ReactDomClient, initialScene]);

  const handleSave = async () => {
    if (!apiRef.current) return;
    setSaving(true);
    try {
      const elements = apiRef.current.getSceneElements();
      const appState = apiRef.current.getAppState();
      const files = apiRef.current.getFiles();
      // Убираем runtime-поля appState, оставляем только сериализуемое
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
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <div ref={hostRef} className="w-full h-full" />
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
