import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { Image as ImageIcon, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import GalleryEditorDialog, {
  type GalleryImage,
} from "@/components/gallery/GalleryEditorDialog";
import {
  parseGalleryFileEntries,
  buildGalleryMarkerFromEntries,
} from "@/lib/markdown/galleryMarkers";
import type { GalleryKind } from "@/components/gallery/galleryKinds";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    galleryPlaceholder: {
      insertGalleryPlaceholder: (caption: string) => ReturnType;
    };
  }
  interface NodeConfig<Options, Storage> {}
}

export interface GalleryPlaceholderOptions {
  bucket: string;
  folder: string;
  ownerSlug: string;
  /**
   * Разрешать ли редактирование галереи прямо из плашки в редакторе.
   * false — метка отображается «read-only», заполнение делается на публичной странице.
   */
  allowUpload: boolean;
}

const detectKindFromFilename = (filename: string): GalleryKind => {
  const m = filename.match(
    /-(surgery|ultrasound|patient-full|patient|urology-closeup|urology|infographic|anatomy|normal|default)-/i,
  );
  return ((m?.[1]?.toLowerCase() || "default") as GalleryKind);
};

function useThumbUrl(bucket: string, folder: string) {
  const base = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}`;
  return (filename: string) => {
    const safe = filename.split("/").map(encodeURIComponent).join("/");
    return `${base}/${folder}/${safe}`;
  };
}

const GalleryView = ({ node, updateAttributes, editor, extension }: NodeViewProps) => {
  const [open, setOpen] = useState(false);
  const editable = editor.isEditable;
  const caption: string = node.attrs.caption || "Без подписи";
  const filesRaw: string = node.attrs.files || "";
  const opts = (extension.options || {}) as GalleryPlaceholderOptions;
  const bucket = opts.bucket || "disease-media";
  const folder = opts.folder || "article-images";
  const ownerSlug = opts.ownerSlug || "gallery";
  const publicUrl = useThumbUrl(bucket, folder);

  const entries = useMemo(() => parseGalleryFileEntries(filesRaw), [filesRaw]);
  const initialImages: GalleryImage[] = useMemo(
    () => entries.map((e) => ({
      id: crypto.randomUUID(),
      filename: e.filename,
      caption: e.caption || "",
      kind: detectKindFromFilename(e.filename),
    })),
    [entries],
  );

  const thumbs = entries.slice(0, 4);
  const extra = Math.max(0, entries.length - thumbs.length);

  return (
    <NodeViewWrapper
      as="div"
      contentEditable={false}
      className="my-4 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-3 select-none"
      data-gallery-placeholder=""
      data-caption={node.attrs.caption || ""}
      data-files={node.attrs.files || ""}
    >
      <div className="flex items-start gap-3">
        <ImageIcon className="w-5 h-5 shrink-0 text-slate-500 mt-1" />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">
            Галерея · {entries.length} фото
          </div>
          <div className="text-sm font-bold text-slate-800 truncate">{caption}</div>
          {thumbs.length > 0 ? (
            <div className="mt-2 flex gap-2 flex-wrap">
              {thumbs.map((t, i) => (
                <div key={i} className="relative">
                  <img
                    src={publicUrl(t.filename)}
                    alt={t.caption || ""}
                    className="w-16 h-16 object-cover rounded border border-slate-200 bg-white"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.25"; }}
                    draggable={false}
                  />
                  {i === thumbs.length - 1 && extra > 0 && (
                    <div className="absolute inset-0 rounded flex items-center justify-center bg-black/55 text-white text-xs font-semibold">
                      +{extra}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-500 italic">Изображения ещё не добавлены</div>
          )}
        </div>
        {editable && (opts.allowUpload ?? true) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0 bg-white"
            onClick={() => setOpen(true)}
          >
            <Pencil className="w-3.5 h-3.5" />
            Редактировать галерею
          </Button>
        )}
      </div>

      <GalleryEditorDialog
        open={open}
        onOpenChange={setOpen}
        bucket={bucket}
        folder={folder}
        ownerSlug={ownerSlug}
        initialCaption={node.attrs.caption || ""}
        initialImages={initialImages}
        onSave={({ caption: cap, images }) => {
          const marker = buildGalleryMarkerFromEntries(
            cap,
            images.map((i) => ({ filename: i.filename, caption: i.caption })),
          );
          // Синхронизируем атрибуты плашки: подпись + отформатированный список файлов.
          const files = images
            .map((i) => `${i.filename}${i.caption ? ` "${i.caption.replace(/"/g, "'")}"` : ""}`)
            .join("|");
          updateAttributes({ caption: cap, files });
          // Уведомляем внешний слушатель (например, редактор обзоров) для синхронизации маркеров.
          editor.emit("galleryPlaceholderUpdated" as any, { marker, caption: cap, images });
        }}
      />
    </NodeViewWrapper>
  );
};

export const GalleryPlaceholder = Node.create<GalleryPlaceholderOptions>({
  name: "galleryPlaceholder",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      bucket: "disease-media",
      folder: "article-images",
      ownerSlug: "gallery",
    };
  },

  addAttributes() {
    return {
      caption: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-caption") || "",
        renderHTML: (attrs) => ({ "data-caption": attrs.caption || "" }),
      },
      files: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-files") || "",
        renderHTML: (attrs) => ({ "data-files": attrs.files ?? "" }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: "div[data-gallery-placeholder]" },
      { tag: 'div[data-type="galleryPlaceholder"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-gallery-placeholder": "",
        "data-type": "galleryPlaceholder",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryView);
  },

  addCommands() {
    return {
      insertGalleryPlaceholder:
        (caption: string) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { caption },
          }),
    };
  },
});

export default GalleryPlaceholder;
