import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { ImagePlus, Pencil, Trash2 } from "lucide-react";
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

const GalleryView = ({ node, updateAttributes, deleteNode, editor }: NodeViewProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string>(node.attrs.caption || "");
  const editable = editor.isEditable;

  return (
    <NodeViewWrapper
      as="div"
      className="my-4 rounded-lg border-2 border-dashed border-muted-foreground/40 bg-muted/40 p-5 flex items-center gap-3 text-muted-foreground"
      data-gallery-placeholder=""
      data-caption={node.attrs.caption || ""}
    >
      <ImagePlus className="w-6 h-6 shrink-0 text-primary/70" />
      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground/80">Галерея</div>
        <div className="text-sm font-medium text-foreground truncate">
          {node.attrs.caption || "Без подписи"}
        </div>
        <div className="text-xs text-muted-foreground/70 mt-0.5">
          Фото добавляются на странице статьи
        </div>
      </div>
      {editable && (
        <div className="flex gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              setDraft(node.attrs.caption || "");
              setOpen(true);
            }}
            title="Редактировать подпись"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => deleteNode()}
            title="Удалить блок"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
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
    };
  },

  parseHTML() {
    return [{ tag: "div[data-gallery-placeholder]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-gallery-placeholder": "" }),
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
