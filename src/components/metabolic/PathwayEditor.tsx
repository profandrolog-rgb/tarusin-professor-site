import { lazy, Suspense, useRef, useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Save, RotateCcw } from "lucide-react";
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
  const initialData = {
    elements: Array.isArray(initialScene?.elements) ? initialScene!.elements : [],
    appState: {
      ...(initialScene?.appState || {}),
      viewBackgroundColor: initialScene?.appState?.viewBackgroundColor ?? "#ffffff",
    },
    files: initialScene?.files || null,
    scrollToContent: true,
  };
  return (
    <ExcalidrawLazy
      initialData={initialData}
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
  mapId,
  pathwayCode,
  pathwayName,
  patientScene,
  templateScene,
  backgroundNode,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Метаболическая карта конкретного пациента. Обязательна для сохранения. */
  mapId: string | null;
  /** Стабильный код пути (совпадает с pathways.slug). */
  pathwayCode: string;
  pathwayName: string;
  /** Персональная рабочая копия пациента (если уже была сохранена). */
  patientScene: SceneJson | null | undefined;
  /** Шаблон пути — используется при первом открытии и по кнопке «Сбросить». */
  templateScene: SceneJson | null | undefined;
  /** Опциональная подложка (например, статический SVG-шаблон), рисуется под холстом Excalidraw. */
  backgroundNode?: React.ReactNode;
  onSaved?: (scene: SceneJson | null) => void;
}) {
  const apiRef = useRef<any>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [ready, setReady] = useState(false);
  // Ключ для перемонтирования Excalidraw при сбросе к шаблону.
  const [instanceKey, setInstanceKey] = useState(0);

  // При первом открытии подставляем рабочую копию пациента, либо шаблон.
  const initialScene = useMemo<SceneJson | null | undefined>(
    () => patientScene ?? templateScene ?? null,
    // При каждом открытии редактора берём актуальную сцену пациента.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, instanceKey],
  );

  useEffect(() => { if (!open) { apiRef.current = null; setReady(false); } }, [open]);

  const collectScene = (): SceneJson => {
    const elements = apiRef.current.getSceneElements();
    const appState = apiRef.current.getAppState();
    const files = apiRef.current.getFiles();
    return {
      elements: JSON.parse(JSON.stringify(elements)),
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize,
      },
      files: files || {},
    };
  };

  const handleSave = async () => {
    if (!apiRef.current) return;
    if (!mapId) {
      toast({
        title: "Нет карты пациента",
        description: "Сначала нажмите «Пересчитать отклонения», чтобы создать карту.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const scene = collectScene();
      // Пишем в персональную копию пациента: (map_id, pathway_code) → scene.
      // Шаблон pathway_schemas не трогаем — он остаётся общим для всех.
      const { error } = await (supabase as any)
        .from("map_schemas")
        .upsert(
          { map_id: mapId, pathway_code: pathwayCode, scene, updated_at: new Date().toISOString() },
          { onConflict: "map_id,pathway_code" },
        );
      if (error) throw error;
      toast({ title: "Схема сохранена", description: `${pathwayName} — только для этого пациента` });
      onSaved?.(scene);
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Ошибка сохранения", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!mapId) return;
    if (!confirm("Сбросить дорисовки этого пациента и вернуть шаблон схемы?")) return;
    setResetting(true);
    try {
      const { error } = await (supabase as any)
        .from("map_schemas")
        .delete()
        .eq("map_id", mapId)
        .eq("pathway_code", pathwayCode);
      if (error) throw error;
      toast({ title: "Сброшено к шаблону", description: pathwayName });
      onSaved?.(null);
      // Перемонтируем Excalidraw с шаблонной сценой.
      setInstanceKey((k) => k + 1);
    } catch (e: any) {
      toast({ title: "Ошибка сброса", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle>Схема пациента: {pathwayName}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Правки сохраняются только для этого пациента и попадают в его протокол.
            У ключевых узлов задавайте <code>customData.nodeId</code>, у стрелок — <code>customData.edge</code>,
            чтобы работала подсветка по тяжести. Ручные пометки без nodeId не перекрашиваются.
          </p>
        </DialogHeader>
        <div className="flex-1 min-h-0 relative">
          {backgroundNode && (
            <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center bg-white">
              {backgroundNode}
            </div>
          )}
          <div className="absolute inset-0 z-10">
            <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
              {open && (
                <EditorInner
                  key={instanceKey}
                  initialScene={initialScene}
                  onApi={(api) => { apiRef.current = api; setReady(true); }}
                />
              )}
            </Suspense>
          </div>
        </div>
        <DialogFooter className="p-3 border-t gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={resetting || saving || !mapId || !patientScene}
            className="gap-2 mr-auto"
            title={patientScene ? "Удалить рабочую копию пациента" : "У пациента ещё нет ручных правок"}
          >
            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Сбросить к шаблону
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Отмена</Button>
          <Button onClick={handleSave} disabled={saving || !ready || !mapId} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Сохранить у пациента
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
