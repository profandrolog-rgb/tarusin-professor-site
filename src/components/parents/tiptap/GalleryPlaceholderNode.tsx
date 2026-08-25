import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { ArrowDown, ArrowUp, Image as ImageIcon, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import GalleryEditorDialog, {
  type GalleryImage,
} from "@/components/gallery/GalleryEditorDialog";
import {
  parseGalleryFileEntries,
  buildGalleryMarkerFromEntries,
  extractGalleryCols,
  withGalleryCols,
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

const GalleryView = ({ node, updateAttributes, editor, extension, getPos }: NodeViewProps) => {
  const [open, setOpen] = useState(false);
  const editable = editor.isEditable;
  const caption: string = node.attrs.caption || "Без подписи";
  const filesRaw: string = node.attrs.files || "";
  const opts = (extension.options || {}) as GalleryPlaceholderOptions;
  const bucket = opts.bucket || "disease-media";
  const folder = opts.folder || "article-images";
  const ownerSlug = opts.ownerSlug || "gallery";
  const publicUrl = useThumbUrl(bucket, folder);

  const parsed = useMemo(() => extractGalleryCols(parseGalleryFileEntries(filesRaw)), [filesRaw]);
  const entries = parsed.entries;
  const cols = parsed.cols;
  const restricted = parsed.restricted;
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
  const getMoveState = () => {
    try {
      const pos = typeof getPos === "function" ? getPos() : undefined;
      if (typeof pos !== "number") return { up: false, down: false };
      const resolved = editor.state.doc.resolve(pos);
      const index = resolved.index(resolved.depth);
      const count = resolved.parent.childCount;
      return { up: index > 0, down: index < count - 1 };
    } catch {
      return { up: false, down: false };
    }
  };
  const moveState = getMoveState();

  const moveGallery = (direction: "up" | "down") => {
    if (!editor.isEditable) return;
    const pos = typeof getPos === "function" ? getPos() : undefined;
    if (typeof pos !== "number") return;
    const { state, view } = editor;
    const resolved = state.doc.resolve(pos);
    const depth = resolved.depth;
    const index = resolved.index(depth);
    const parent = resolved.parent;
    const siblingIndex = direction === "up" ? index - 1 : index + 1;
    if (siblingIndex < 0 || siblingIndex >= parent.childCount) return;
    const sibling = parent.child(siblingIndex);
    const from = pos;
    const to = pos + node.nodeSize;
    const insertAt = direction === "up" ? pos - sibling.nodeSize : pos + sibling.nodeSize;
    const tr = state.tr.delete(from, to).insert(insertAt, node);
    view.dispatch(tr.scrollIntoView());
    view.focus();
  };

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
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 bg-white px-2"
              disabled={!moveState.up}
              title="Переместить галерею выше"
              onClick={() => moveGallery("up")}
            >
              <ArrowUp className="w-3.5 h-3.5" />
              Выше
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 bg-white px-2"
              disabled={!moveState.down}
              title="Переместить галерею ниже"
              onClick={() => moveGallery("down")}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              Ниже
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 bg-white px-2"
              onClick={() => setOpen(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Редактировать
            </Button>
          </div>
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
            withGalleryCols(
              images.map((i) => ({ filename: i.filename, caption: i.caption })),
              cols,
              restricted,
            ),
          );
          // Синхронизируем атрибуты плашки: подпись + отформатированный список файлов.
          const files = withGalleryCols(
            images.map((i) => ({ filename: i.filename, caption: i.caption })),
            cols,
            restricted,
          )
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
      allowUpload: true,
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
