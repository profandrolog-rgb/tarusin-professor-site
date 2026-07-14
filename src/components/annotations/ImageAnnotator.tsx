import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Image as KImage, Arrow, Ellipse, Text as KText, Transformer } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowUpRight,
  Circle as CircleIcon,
  Type as TypeIcon,
  MousePointer2,
  Trash2,
  Undo2,
  Redo2,
  Save,
  Loader2,
  Eraser,
} from "lucide-react";
import {
  type AnnotationDoc,
  type AnnotationShape,
  type AnnotationTool,
  EMPTY_DOC,
  PRESET_COLORS,
  newId,
} from "./annotationTypes";

interface Props {
  imagePath: string;
  bucket?: string;
  initialLabel?: string;
  onSaved?: () => void;
  onClose?: () => void;
}

const MAX_STAGE_WIDTH = 900;
const MAX_STAGE_HEIGHT = 620;

const ImageAnnotator = ({ imagePath, bucket = "disease-media", initialLabel = "default", onSaved, onClose }: Props) => {
  const publicUrl = useMemo(
    () => supabase.storage.from(bucket).getPublicUrl(imagePath).data.publicUrl,
    [bucket, imagePath],
  );
  const [image] = useImage(publicUrl, "anonymous");

  const [label, setLabel] = useState(initialLabel);
  const [tool, setTool] = useState<AnnotationTool>("arrow");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [doc, setDoc] = useState<AnnotationDoc>(EMPTY_DOC);
  const [past, setPast] = useState<AnnotationDoc[]>([]);
  const [future, setFuture] = useState<AnnotationDoc[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const drawingRef = useRef<AnnotationShape | null>(null);
  const [, forceRepaint] = useState(0);

  // Fit stage to image but cap to MAX
  const { stageW, stageH, imgW, imgH } = useMemo(() => {
    const iw = image?.naturalWidth ?? 0;
    const ih = image?.naturalHeight ?? 0;
    if (!iw || !ih) return { stageW: 800, stageH: 500, imgW: 0, imgH: 0 };
    const scale = Math.min(MAX_STAGE_WIDTH / iw, MAX_STAGE_HEIGHT / ih, 1);
    return { stageW: Math.round(iw * scale), stageH: Math.round(ih * scale), imgW: iw, imgH: ih };
  }, [image]);

  // Load existing doc
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("image_annotations")
        .select("annotation_data")
        .eq("image_path", imagePath)
        .eq("bucket", bucket)
        .eq("label", label)
        .maybeSingle();
      if (cancelled) return;
      if (data?.annotation_data) {
        setDoc(data.annotation_data as unknown as AnnotationDoc);
      } else {
        setDoc(EMPTY_DOC);
      }
      setPast([]);
      setFuture([]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [imagePath, bucket, label]);

  const pushHistory = useCallback((next: AnnotationDoc) => {
    setPast((p) => [...p.slice(-49), doc]);
    setFuture([]);
    setDoc(next);
  }, [doc]);

  const undo = () => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [doc, ...f]);
      setDoc(prev);
      return p.slice(0, -1);
    });
  };
  const redo = () => {
    setFuture((f) => {
      if (!f.length) return f;
      const nxt = f[0];
      setPast((p) => [...p, doc]);
      setDoc(nxt);
      return f.slice(1);
    });
  };

  // Convert stage coords to normalized
  const toNorm = (x: number, y: number) => ({ nx: x / stageW, ny: y / stageH });

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (loading || !imgW) return;
    if (tool === "select") {
      // Deselect if clicked on empty
      if (e.target === e.target.getStage()) setSelectedId(null);
      return;
    }
    const stage = e.target.getStage();
    if (!stage) return;
    const p = stage.getPointerPosition();
    if (!p) return;
    const { nx, ny } = toNorm(p.x, p.y);
    if (tool === "arrow") {
      drawingRef.current = { id: newId(), type: "arrow", color, strokeWidth, x1: nx, y1: ny, x2: nx, y2: ny };
    } else if (tool === "ellipse") {
      drawingRef.current = { id: newId(), type: "ellipse", color, strokeWidth, cx: nx, cy: ny, rx: 0, ry: 0 };
    } else if (tool === "text") {
      const text = window.prompt("Текст подписи:", "");
      if (!text) return;
      const shape: AnnotationShape = {
        id: newId(),
        type: "text",
        color,
        strokeWidth,
        x: nx,
        y: ny,
        text,
        fontSize: 0.05,
      };
      pushHistory({ ...doc, shapes: [...doc.shapes, shape], imageWidth: imgW, imageHeight: imgH });
      setTool("select");
      setSelectedId(shape.id);
      return;
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const s = drawingRef.current;
    if (!s) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const p = stage.getPointerPosition();
    if (!p) return;
    const { nx, ny } = toNorm(p.x, p.y);
    if (s.type === "arrow") {
      s.x2 = nx;
      s.y2 = ny;
    } else if (s.type === "ellipse") {
      s.rx = Math.abs(nx - s.cx);
      s.ry = Math.abs(ny - s.cy);
    }
    forceRepaint((v) => v + 1);
  };

  const handleStageMouseUp = () => {
    const s = drawingRef.current;
    if (!s) return;
    drawingRef.current = null;
    // Discard zero-size shapes
    if (s.type === "arrow" && Math.hypot(s.x2 - s.x1, s.y2 - s.y1) < 0.005) return;
    if (s.type === "ellipse" && s.rx < 0.005 && s.ry < 0.005) return;
    pushHistory({ ...doc, shapes: [...doc.shapes, s], imageWidth: imgW, imageHeight: imgH });
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    pushHistory({ ...doc, shapes: doc.shapes.filter((s) => s.id !== selectedId), imageWidth: imgW, imageHeight: imgH });
    setSelectedId(null);
  };

  const clearAll = () => {
    if (!doc.shapes.length) return;
    if (!confirm("Удалить всю разметку?")) return;
    pushHistory({ shapes: [], imageWidth: imgW, imageHeight: imgH });
    setSelectedId(null);
  };

  const save = async () => {
    setSaving(true);
    const payload = { ...doc, imageWidth: imgW, imageHeight: imgH };
    const { error } = await supabase
      .from("image_annotations")
      .upsert(
        {
          image_path: imagePath,
          bucket,
          label,
          annotation_data: payload as unknown as Record<string, unknown>,
        },
        { onConflict: "image_path,label" },
      );
    setSaving(false);
    if (error) {
      toast({ title: "Не удалось сохранить", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Разметка сохранена", description: `Набор: ${label}` });
    onSaved?.();
  };

  // Render one shape as Konva node
  const renderShape = (s: AnnotationShape) => {
    const isSel = s.id === selectedId;
    const commonSel = tool === "select";
    if (s.type === "arrow") {
      return (
        <Arrow
          key={s.id}
          points={[s.x1 * stageW, s.y1 * stageH, s.x2 * stageW, s.y2 * stageH]}
          stroke={s.color}
          fill={s.color}
          strokeWidth={s.strokeWidth}
          pointerLength={10}
          pointerWidth={10}
          lineCap="round"
          onClick={() => commonSel && setSelectedId(s.id)}
          onTap={() => commonSel && setSelectedId(s.id)}
          shadowEnabled={isSel}
          shadowColor="#3b82f6"
          shadowBlur={6}
        />
      );
    }
    if (s.type === "ellipse") {
      return (
        <Ellipse
          key={s.id}
          x={s.cx * stageW}
          y={s.cy * stageH}
          radiusX={s.rx * stageW}
          radiusY={s.ry * stageH}
          stroke={s.color}
          strokeWidth={s.strokeWidth}
          onClick={() => commonSel && setSelectedId(s.id)}
          onTap={() => commonSel && setSelectedId(s.id)}
          shadowEnabled={isSel}
          shadowColor="#3b82f6"
          shadowBlur={6}
        />
      );
    }
    return (
      <KText
        key={s.id}
        x={s.x * stageW}
        y={s.y * stageH}
        text={s.text}
        fill={s.color}
        stroke="rgba(0,0,0,0.6)"
        strokeWidth={s.strokeWidth * 0.3}
        fontSize={s.fontSize * stageH}
        fontFamily="sans-serif"
        draggable={commonSel}
        onDragEnd={(e) => {
          const { nx, ny } = toNorm(e.target.x(), e.target.y());
          pushHistory({
            ...doc,
            shapes: doc.shapes.map((x) => (x.id === s.id ? { ...(x as typeof s), x: nx, y: ny } : x)),
            imageWidth: imgW,
            imageHeight: imgH,
          });
        }}
        onClick={() => commonSel && setSelectedId(s.id)}
        onTap={() => commonSel && setSelectedId(s.id)}
      />
    );
  };

  // Live-drawing shape
  const live = drawingRef.current;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2">
        <div className="flex items-center gap-1">
          <ToolBtn active={tool === "select"} onClick={() => setTool("select")} icon={<MousePointer2 className="w-4 h-4" />} title="Выделить" />
          <ToolBtn active={tool === "arrow"} onClick={() => setTool("arrow")} icon={<ArrowUpRight className="w-4 h-4" />} title="Стрелка" />
          <ToolBtn active={tool === "ellipse"} onClick={() => setTool("ellipse")} icon={<CircleIcon className="w-4 h-4" />} title="Овал" />
          <ToolBtn active={tool === "text"} onClick={() => setTool("text")} icon={<TypeIcon className="w-4 h-4" />} title="Текст" />
        </div>

        <div className="flex items-center gap-1 border-l pl-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Цвет ${c}`}
              className={`w-6 h-6 rounded-full border-2 ${color === c ? "border-primary scale-110" : "border-white/40"} transition`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 border-l pl-2 min-w-[140px]">
          <span className="text-xs text-muted-foreground">Толщина</span>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[strokeWidth]}
            onValueChange={(v) => setStrokeWidth(v[0])}
            className="w-24"
          />
          <span className="text-xs w-4 text-right">{strokeWidth}</span>
        </div>

        <div className="flex items-center gap-1 border-l pl-2">
          <Button type="button" variant="ghost" size="sm" onClick={undo} disabled={!past.length}>
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={redo} disabled={!future.length}>
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={deleteSelected} disabled={!selectedId}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={clearAll} disabled={!doc.shapes.length}>
            <Eraser className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 border-l pl-2">
          <Label className="text-xs whitespace-nowrap">Набор</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value.trim() || "default")}
            className="h-8 w-32"
            placeholder="atlas / site / book"
          />
        </div>

        <div className="ml-auto flex gap-2">
          {onClose && (
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Закрыть
            </Button>
          )}
          <Button type="button" size="sm" onClick={save} disabled={saving || loading}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Сохранить
          </Button>
        </div>
      </div>

      {/* Stage */}
      <div className="flex justify-center bg-black/5 rounded-md p-2">
        {loading || !image ? (
          <div className="flex items-center justify-center" style={{ width: stageW, height: stageH }}>
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Stage
            width={stageW}
            height={stageH}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onTouchStart={handleStageMouseDown}
            onTouchMove={handleStageMouseMove}
            onTouchEnd={handleStageMouseUp}
            style={{ background: "#000", cursor: tool === "select" ? "default" : "crosshair" }}
          >
            <Layer listening={false}>
              <KImage image={image} width={stageW} height={stageH} />
            </Layer>
            <Layer>
              {doc.shapes.map(renderShape)}
              {live && renderShape(live)}
            </Layer>
          </Stage>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Оригинал изображения не изменяется — сохраняется только слой разметки. Один снимок может иметь несколько наборов (например «atlas», «site», «book»).
      </p>
    </div>
  );
};

interface ToolBtnProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}
const ToolBtn = ({ active, onClick, icon, title }: ToolBtnProps) => (
  <Button
    type="button"
    variant={active ? "default" : "ghost"}
    size="sm"
    onClick={onClick}
    title={title}
    className="h-8 w-8 p-0"
  >
    {icon}
  </Button>
);

export default ImageAnnotator;
