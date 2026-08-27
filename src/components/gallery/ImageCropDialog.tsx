import { useEffect, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Move, RotateCcw } from "lucide-react";
import {
  CropSpec, DEFAULT_CROP, CROP_RATIO_OPTIONS, cropStyles,
} from "@/lib/gallery/cropSpec";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Публичный URL изображения. */
  src: string;
  /** Начальные параметры кадра. */
  value: CropSpec;
  onSave: (spec: CropSpec) => void;
}

/**
 * Визуальное кадрирование фото: пропорции кадра, масштаб и точка фокуса.
 * Файл в хранилище не меняется — параметры сохраняются в маркере галереи,
 * поэтому кадр можно перенастроить в любой момент без повторной загрузки.
 */
export default function ImageCropDialog({ open, onOpenChange, src, value, onSave }: Props) {
  const [spec, setSpec] = useState<CropSpec>(value);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (open) setSpec(value);
  }, [open, value]);

  const applyPointer = (clientX: number, clientY: number) => {
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100));
    setSpec((prev) => ({ ...prev, x, y }));
  };

  const styles = cropStyles(spec);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Кадрирование фото</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div
            ref={frameRef}
            className="relative w-full overflow-hidden rounded-lg border bg-muted cursor-move touch-none"
            style={{ ...styles.frame, maxHeight: "50vh" }}
            onPointerDown={(e) => {
              dragging.current = true;
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              applyPointer(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => { if (dragging.current) applyPointer(e.clientX, e.clientY); }}
            onPointerUp={() => { dragging.current = false; }}
            onPointerLeave={() => { dragging.current = false; }}
          >
            <img src={src} alt="" style={styles.image} draggable={false} />
            {spec.fit === "cover" && (
              <>
                <div className="pointer-events-none absolute inset-0 border border-white/40" />
                <div
                  className="pointer-events-none absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white bg-primary/40 shadow"
                  style={{ left: `${spec.x}%`, top: `${spec.y}%` }}
                />
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Move className="w-3 h-3" /> Тяните по кадру, чтобы выбрать, какая часть фото остаётся видимой.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Пропорции кадра</Label>
              <Select value={spec.ratio} onValueChange={(v) => setSpec((p) => ({ ...p, ratio: v }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CROP_RATIO_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Как показывать</Label>
              <Select
                value={spec.fit}
                onValueChange={(v) => setSpec((p) => ({ ...p, fit: v as CropSpec["fit"] }))}
              >
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Заполнить кадр (обрезать)</SelectItem>
                  <SelectItem value="contain">Вписать целиком (без обрезки)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {spec.fit === "cover" && (
            <div>
              <Label className="text-xs">Масштаб: {spec.zoom.toFixed(2)}×</Label>
              <Slider
                value={[spec.zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={([v]) => setSpec((p) => ({ ...p, zoom: v }))}
                className="mt-2"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSpec(DEFAULT_CROP)}>
            <RotateCcw className="w-4 h-4 mr-1" /> Сбросить
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={() => { onSave(spec); onOpenChange(false); }}>Применить кадр</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
