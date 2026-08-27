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
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import {
  PROFESSOR_NOTE_ICONS,
  DEFAULT_PROFESSOR_NOTE_ICON,
  type ProfessorNoteIconKey,
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
}: NodeViewProps) => {
  const editable = editor.isEditable;
  const icon: ProfessorNoteIconKey =
    node.attrs.icon || DEFAULT_PROFESSOR_NOTE_ICON;
  const title: string = node.attrs.title || "";
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
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { icon: DEFAULT_PROFESSOR_NOTE_ICON, title: "" },
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "" }],
              },
            ],
          });
        },
    };
  },
});

export default ProfessorNote;
