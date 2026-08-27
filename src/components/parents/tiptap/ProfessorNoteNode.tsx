import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
  NodeViewProps,
} from "@tiptap/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDown, ArrowUp, Save, Trash2 } from "lucide-react";
import {
  PROFESSOR_NOTE_ICONS,
  DEFAULT_PROFESSOR_NOTE_ICON,
  PROFESSOR_NOTE_WIDTHS,
  PROFESSOR_NOTE_SIDES,
  DEFAULT_PROFESSOR_NOTE_WIDTH,
  DEFAULT_PROFESSOR_NOTE_SIDE,
  normalizeNoteWidth,
  normalizeNoteSide,
  type ProfessorNoteIconKey,
  type ProfessorNoteWidthKey,
  type ProfessorNoteSideKey,
} from "@/lib/professorNote";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    professorNote: {
      insertProfessorNote: () => ReturnType;
    };
  }
}

const ProfessorNoteView = ({
  node,
  updateAttributes,
  editor,
  getPos,
  deleteNode,
  extension,
}: NodeViewProps) => {
  const { onSave } = extension.options as {
    onSave?: () => void;
  };
  const editable = editor.isEditable;
  const icon: ProfessorNoteIconKey =
    node.attrs.icon || DEFAULT_PROFESSOR_NOTE_ICON;
  const title: string = node.attrs.title || "";
  const width: ProfessorNoteWidthKey = normalizeNoteWidth(node.attrs.width);
  const side: ProfessorNoteSideKey = normalizeNoteSide(node.attrs.side);
  const [draftTitle, setDraftTitle] = useState(title);

  const setIcon = (key: ProfessorNoteIconKey) => {
    updateAttributes({ icon: key });
  };

  const setTitle = (val: string) => {
    setDraftTitle(val);
    updateAttributes({ title: val });
  };

  const move = (direction: "up" | "down") => {
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
    const insertAt =
      direction === "up" ? pos - sibling.nodeSize : pos + sibling.nodeSize;
    const tr = state.tr.delete(from, to).insert(insertAt, node);
    view.dispatch(tr.scrollIntoView());
    view.focus();
  };

  const { Icon } =
    PROFESSOR_NOTE_ICONS.find((i) => i.key === icon) ??
    PROFESSOR_NOTE_ICONS[0];

  return (
    <NodeViewWrapper
      as="aside"
      className="professor-note"
      data-note=""
      data-icon={icon}
      data-title={title}
      data-width={width}
      data-side={side}
    >
      {editable && (
        <div
          className="professor-note-toolbar font-sans"
          contentEditable={false}
        >
          <Select
            value={icon}
            onValueChange={(v) => setIcon(v as ProfessorNoteIconKey)}
          >
            <SelectTrigger className="w-10 h-8 px-1">
              <Icon className="w-4 h-4" />
            </SelectTrigger>
            <SelectContent>
              {PROFESSOR_NOTE_ICONS.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  <div className="flex items-center gap-2">
                    <item.Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={draftTitle}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок блока"
            className="h-8 text-sm flex-1"
          />
          <Select
            value={width}
            onValueChange={(v) =>
              updateAttributes({ width: v as ProfessorNoteWidthKey })
            }
          >
            <SelectTrigger className="h-8 w-[190px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROFESSOR_NOTE_WIDTHS.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={side}
            onValueChange={(v) =>
              updateAttributes({ side: v as ProfessorNoteSideKey })
            }
          >
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROFESSOR_NOTE_SIDES.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => move("up")}
            disabled={!editor.isEditable}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => move("down")}
            disabled={!editor.isEditable}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </Button>
          {onSave && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 px-2 gap-1"
              onClick={() => onSave()}
              title="Сохранить изменения страницы"
            >
              <Save className="w-3.5 h-3.5" />
              Сохранить
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2 text-destructive hover:text-destructive"
            onClick={() => deleteNode()}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
      <NodeViewContent className="professor-note-body" />
    </NodeViewWrapper>
  );
};

export const ProfessorNote = Node.create({
  name: "professorNote",

  addOptions() {
    return {
      /** Сохранение страницы прямо из блока заметки. */
      onSave: undefined as undefined | (() => void),
    };
  },
  group: "block",
  content: "block+",
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      icon: {
        default: DEFAULT_PROFESSOR_NOTE_ICON,
        parseHTML: (el) =>
          (el.getAttribute("data-icon") as ProfessorNoteIconKey) ||
          DEFAULT_PROFESSOR_NOTE_ICON,
        renderHTML: (attrs) => ({
          "data-icon": attrs.icon || DEFAULT_PROFESSOR_NOTE_ICON,
        }),
      },
      width: {
        default: DEFAULT_PROFESSOR_NOTE_WIDTH,
        parseHTML: (el) => normalizeNoteWidth(el.getAttribute("data-width")),
        renderHTML: (attrs) => ({
          "data-width": normalizeNoteWidth(attrs.width),
        }),
      },
      side: {
        default: DEFAULT_PROFESSOR_NOTE_SIDE,
        parseHTML: (el) => normalizeNoteSide(el.getAttribute("data-side")),
        renderHTML: (attrs) => ({
          "data-side": normalizeNoteSide(attrs.side),
        }),
      },
      title: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-title") || "",
        renderHTML: (attrs) => ({
          "data-title": attrs.title || "",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "aside[data-note]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "aside",
      mergeAttributes(HTMLAttributes, {
        class: "professor-note",
        "data-note": "",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProfessorNoteView);
  },

  addCommands() {
    return {
      insertProfessorNote:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              icon: DEFAULT_PROFESSOR_NOTE_ICON,
              title: "",
              width: DEFAULT_PROFESSOR_NOTE_WIDTH,
              side: DEFAULT_PROFESSOR_NOTE_SIDE,
            },
            content: [{ type: "paragraph" }],
          }),
    };
  },
});

export default ProfessorNote;
