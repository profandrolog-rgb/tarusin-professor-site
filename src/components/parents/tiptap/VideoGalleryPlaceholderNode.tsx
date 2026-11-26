import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ArrowDown, ArrowUp, Pencil, Play, Trash2 } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { VideoGalleryItem } from "@/components/gallery/VideoGalleryEditorDialog";
import {
  DEFAULT_VIDEO_OPTIONS,
  buildVideoGalleryMarker,
  extractVideoGalleryOptions,
  formatVideoGalleryBody,
  parseVideoGalleryEntries,
  withVideoGalleryOptions,
  type VideoGalleryOptions,
} from "@/lib/markdown/videoGalleryMarkers";

const VideoGalleryEditorDialog = lazy(() => import("@/components/gallery/VideoGalleryEditorDialog"));

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoGalleryPlaceholder: {
      insertVideoGalleryPlaceholder: (caption: string) => ReturnType;
    };
  }
}

export interface VideoGalleryPlaceholderOptions {
  ownerSlug: string;
  /**
   * Разрешать ли редактирование галереи прямо из плашки в редакторе.
   * false — метка отображается «read-only», заполнение делается на публичной странице.
   */
  allowUpload: boolean;
}

const VideoGalleryView = ({ node, updateAttributes, editor, extension, getPos, deleteNode }: NodeViewProps) => {
  const [open, setOpen] = useState(false);
  const editable = editor.isEditable;
  const caption: string = node.attrs.caption || "Без подписи";
  const filesRaw: string = node.attrs.files || "";
  const opts = (extension.options || {}) as VideoGalleryPlaceholderOptions;
  const ownerSlug = opts.ownerSlug || "video-gallery";

  const parsed = useMemo(() => {
    const raw = parseVideoGalleryEntries(filesRaw);
    return raw.length ? extractVideoGalleryOptions(raw) : { options: DEFAULT_VIDEO_OPTIONS, entries: [] };
  }, [filesRaw]);
  const entries = parsed.entries;
  const options = parsed.options;

  const initialEntries: VideoGalleryItem[] = useMemo(
    () => entries.map((e) => ({
      id: crypto.randomUUID(),
      cloud: e.cloud,
      key: e.key,
      caption: e.caption || "",
      poster: e.poster || "",
      name: e.key.split("/").pop() || e.key,
      size: 0,
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
      data-video-gallery-placeholder=""
      data-caption={node.attrs.caption || ""}
      data-files={node.attrs.files || ""}
    >
      <div className="flex items-start gap-3">
        <Play className="w-5 h-5 shrink-0 text-slate-500 mt-1" />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">
            Видеогалерея · {entries.length} видео
          </div>
          <div className="text-sm font-bold text-slate-800 truncate">{caption}</div>
          {thumbs.length > 0 ? (
            <div className="mt-2 flex gap-2 flex-wrap">
              {thumbs.map((t, i) => (
                <div key={i} className="relative">
                  {t.poster ? (
                    <img
                      src={t.poster}
                      alt={t.caption || ""}
                      loading="lazy"
                      decoding="async"
                      className="w-16 h-16 object-cover rounded border border-slate-200 bg-white"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.25"; }}
                      draggable={false}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded border border-slate-200 bg-white flex items-center justify-center">
                      <Play className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  {i === thumbs.length - 1 && extra > 0 && (
                    <div className="absolute inset-0 rounded flex items-center justify-center bg-black/55 text-white text-xs font-semibold">
                      +{extra}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-500 italic">Видео ещё не добавлены</div>
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 bg-white px-2 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
              title="Удалить галерею из черновика"
              onClick={() => {
                const message = entries.length
                  ? `Удалить галерею «${caption}» (${entries.length} видео) из черновика? Загруженные видео останутся в хранилище.`
                  : `Удалить пустую галерею «${caption}» из черновика?`;
                if (!window.confirm(message)) return;
                deleteNode();
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Удалить
            </Button>
          </div>
        )}
      </div>

      {open && (
        <Suspense fallback={null}>
          <VideoGalleryEditorDialog
            open
            onOpenChange={setOpen}
            ownerSlug={ownerSlug}
            initialCaption={node.attrs.caption || ""}
            initialEntries={initialEntries}
            initialOptions={options}
            onSave={({ caption: cap, entries: nextEntries, options: nextOptions }) => {
              const withService = withVideoGalleryOptions(nextEntries, nextOptions);
              const marker = buildVideoGalleryMarker(cap, nextEntries, nextOptions);
              const files = formatVideoGalleryBody(nextEntries, nextOptions);
              updateAttributes({ caption: cap, files });
              editor.emit("videoGalleryPlaceholderUpdated" as any, {
                marker,
                caption: cap,
                entries: withService,
                options: nextOptions,
              });
            }}
          />
        </Suspense>
      )}
    </NodeViewWrapper>
  );
};

export const VideoGalleryPlaceholder = Node.create<VideoGalleryPlaceholderOptions>({
  name: "videoGalleryPlaceholder",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      ownerSlug: "video-gallery",
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
      { tag: "div[data-video-gallery-placeholder]" },
      { tag: 'div[data-type="videoGalleryPlaceholder"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-video-gallery-placeholder": "",
        "data-type": "videoGalleryPlaceholder",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoGalleryView);
  },

  addCommands() {
    return {
      insertVideoGalleryPlaceholder:
        (caption: string) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { caption, files: formatVideoGalleryBody([], DEFAULT_VIDEO_OPTIONS as VideoGalleryOptions) },
          }),
    };
  },
});

export default VideoGalleryPlaceholder;
