import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface CertificateLightboxProps {
  images: { id: string; title: string; url: string }[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CertificateLightbox = ({ images, initialIndex, open, onOpenChange }: CertificateLightboxProps) => {
  const [index, setIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
      if (e.key === "ArrowRight") setIndex((i) => (i < images.length - 1 ? i + 1 : 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, images.length]);

  if (!images.length) return null;
  const current = images[index];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 bg-black/95 border-none overflow-hidden">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 z-50 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative flex items-center justify-center min-h-[60vh]">
          {images.length > 1 && (
            <button
              onClick={() => setIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
              className="absolute left-2 z-40 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <img
            src={current.url}
            alt={current.title}
            className="max-h-[80vh] max-w-full object-contain select-none"
            draggable={false}
          />

          {images.length > 1 && (
            <button
              onClick={() => setIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
              className="absolute right-2 z-40 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="px-4 py-3 text-center">
          <p className="text-white/80 text-sm">{current.title}</p>
          <p className="text-white/50 text-xs mt-1">{index + 1} / {images.length}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateLightbox;
