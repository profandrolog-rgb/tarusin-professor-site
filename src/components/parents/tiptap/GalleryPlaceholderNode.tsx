import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { Image as ImageIcon, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    galleryPlaceholder: {
      insertGalleryPlaceholder: (caption: string) => ReturnType;
    };
  }
}

const GalleryView = ({ node, updateAttributes, editor }: NodeViewProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string>(node.attrs.caption || "");
  const editable = editor.isEditable;
  const caption = node.attrs.caption || "Без подписи";

  return (
    <NodeViewWrapper
      as="div"
      contentEditable={false}
      className="my-4 flex items-center gap-3 px-4 bg-slate-50 select-none"
      style={{
        height: 80,
        border: "2px dashed #E2EBF5",
        borderRadius: 8,
      }}
      data-gallery-placeholder=""
      data-caption={node.attrs.caption || ""}
      data-files={node.attrs.files || ""}
    >
      <ImageIcon className="w-6 h-6 shrink-0 text-slate-500" />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">Галерея</div>
        <div className="text-sm font-bold text-slate-800 truncate">{caption}</div>
      </div>
      {editable && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0 bg-white"
          onClick={() => {
            setDraft(node.attrs.caption || "");
            setOpen(true);
          }}
        >
          <Pencil className="w-3.5 h-3.5" />
          Изменить подпись
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подпись к галерее</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Подпись</Label>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  updateAttributes({ caption: draft.trim() });
                  setOpen(false);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => {
                updateAttributes({ caption: draft.trim() });
                setOpen(false);
              }}
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NodeViewWrapper>
  );
};

export const GalleryPlaceholder = Node.create({
  name: "galleryPlaceholder",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

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
        // ВАЖНО: всегда отдаём data-files, даже пустой — иначе TipTap может выкинуть
        // атрибут при сериализации и список файлов потеряется.
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
