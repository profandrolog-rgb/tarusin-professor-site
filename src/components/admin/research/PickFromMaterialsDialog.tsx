import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getDownloadUrl } from "@/lib/research/uploadToYc";
import type { Material } from "./MaterialsPanel";
import type { GalleryImage, GalleryImageKind } from "./GalleryPanel";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  materials: Material[];
  slug: string;
  onPicked: (items: GalleryImage[]) => void;
}

function isImageMaterial(m: Material): boolean {
  if (m.kind !== "file") return false;
  const mime = (m.mime || "").toLowerCase();
  const name = (m.name || "").toLowerCase();
  return mime.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(name);
}

export default function PickFromMaterialsDialog({ open, onOpenChange, materials, slug, onPicked }: Props) {
  const imageMats = materials.filter(isImageMaterial);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    (async () => {
      const next: Record<string, string> = {};
      for (const m of imageMats) {
        if (!m.objectKey || previews[m.id]) continue;
        try { next[m.id] = await getDownloadUrl(m.objectKey); } catch { /* ignore */ }
      }
      if (Object.keys(next).length) setPreviews((p) => ({ ...p, ...next }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function confirm() {
    const list = imageMats.filter((m) => selected.has(m.id));
    if (!list.length) { onOpenChange(false); return; }
    setBusy(true);
    const added: GalleryImage[] = [];
    for (const m of list) {
      try {
        const { data, error } = await supabase.functions.invoke("research-image-publish", {
          body: {
            objectKey: m.objectKey,
            slug,
            kind: "normal" as GalleryImageKind,
            name: m.name,
            mime: m.mime,
          },
        });
        if (error) throw error;
        if (!data?.filename) throw new Error("нет filename в ответе");
        added.push({ id: crypto.randomUUID(), filename: data.filename, caption: "", kind: "normal" });
      } catch (e: any) {
        toast.error(`${m.name}: ${e?.message || "ошибка публикации"}`);
      }
    }
    setBusy(false);
    if (added.length) onPicked(added);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Изображения из материалов обзора</DialogTitle>
        </DialogHeader>
        {imageMats.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            В материалах обзора нет изображений. Загрузите файлы в панель «Материалы для обзора».
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
            {imageMats.map((m) => {
              const url = previews[m.id];
              const active = selected.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className={`relative rounded border-2 overflow-hidden text-left ${active ? "border-primary" : "border-transparent"}`}
                >
                  {url
                    ? <img src={url} alt={m.name} className="w-full h-32 object-cover" />
                    : <div className="w-full h-32 bg-muted animate-pulse" />}
                  <div className="text-[11px] p-1 truncate">{m.name}</div>
                  {active && <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] px-1 rounded">✓</div>}
                </button>
              );
            })}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Отмена</Button>
          <Button onClick={confirm} disabled={busy || selected.size === 0}>
            {busy && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Добавить в галерею ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
