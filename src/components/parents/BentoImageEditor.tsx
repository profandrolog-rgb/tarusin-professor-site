import { useRef, useState } from "react";
import { Upload, Trash2, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useFileDrop } from "@/hooks/useFileDrop";
import BentoImageCell, { type BentoImageData } from "./BentoImageCell";
import ImageAnnotator from "@/components/annotations/ImageAnnotator";

interface Props {
  value: BentoImageData | null;
  onChange: (v: BentoImageData | null) => void;
  label: string;
}

const BentoImageEditor = ({ value, onChange, label }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [annotatorOpen, setAnnotatorOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `bento/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("disease-media").upload(path, file);
      if (error) throw error;
      onChange({ path, x: 50, y: 50, zoom: 100 });
      toast({ title: "Изображение загружено" });
    } catch (e: any) {
      toast({ title: "Ошибка загрузки", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const { dragOver, handlers: dropHandlers } = useFileDrop({
    onFiles: (files) => { void handleFile(files[0]); },
    accept: "image/",
    disabled: uploading,
  });


  const updatePos = (clientX: number, clientY: number) => {
    if (!frameRef.current || !value) return;
    const rect = frameRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    onChange({ ...value, x, y });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          </Button>
          {value?.path && (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => setAnnotatorOpen(true)}
                title="Аннотировать (стрелки, овалы, подписи)"
              >
                <PenLine className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-destructive"
                onClick={() => onChange(null)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      <div
        ref={frameRef}
        tabIndex={0}
        className={`relative aspect-square rounded-lg overflow-hidden ring-2 shadow-sm cursor-crosshair select-none touch-none outline-none transition ${
          dragOver ? "ring-primary bg-primary/10" : "ring-primary/40"
        }`}
        onPointerDown={(e) => {
          if (!value?.path) return;
          dragging.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          updatePos(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (dragging.current) updatePos(e.clientX, e.clientY);
        }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
        {...dropHandlers}
      >
        <BentoImageCell image={value} rounded="" className="absolute inset-0" />
        {value?.path && (
          <div
            className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-primary bg-primary/60 pointer-events-none"
            style={{ left: `${value.x ?? 50}%`, top: `${value.y ?? 50}%` }}
          />
        )}
        {!value?.path && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground/70 pointer-events-none">
            {dragOver ? "Отпустите — загрузится" : "Перетащите картинку / Ctrl+V"}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 pointer-events-none">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      {value?.path && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-10">Zoom</span>
          <Slider
            min={100}
            max={250}
            step={5}
            value={[value.zoom ?? 100]}
            onValueChange={(v) => onChange({ ...value, zoom: v[0] })}
            className="flex-1"
          />
          <span className="text-[10px] text-muted-foreground w-8 text-right">{value.zoom ?? 100}%</span>
        </div>
      )}

      <Dialog open={annotatorOpen} onOpenChange={setAnnotatorOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Аннотировать изображение</DialogTitle>
          </DialogHeader>
          {value?.path && annotatorOpen && (
            <ImageAnnotator
              imagePath={value.path}
              bucket="disease-media"
              initialLabel="site"
              onClose={() => setAnnotatorOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BentoImageEditor;
