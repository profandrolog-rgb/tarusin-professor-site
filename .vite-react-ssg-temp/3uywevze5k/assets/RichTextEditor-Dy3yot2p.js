import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { Bold, Italic, Underline as Underline$1, List, ListOrdered, Quote, Loader2, ImagePlus } from "lucide-react";
import { B as Button, s as supabase } from "../main.mjs";
import { useRef, useState, useCallback, useEffect } from "react";
const RichTextEditor = ({ content, onChange, placeholder, storageBucket = "disease-media", storageFolder = "article-images" }) => {
  const fileInputRef = useRef(null);
  const toolbarRef = useRef(null);
  const containerRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [isToolbarFixed, setIsToolbarFixed] = useState(false);
  const [toolbarWidth, setToolbarWidth] = useState(0);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, codeBlock: false }),
      Underline,
      Image.configure({ inline: false, allowBase64: false })
    ],
    content,
    onUpdate: ({ editor: editor2 }) => {
      onChange(editor2.getHTML());
    },
    editorProps: {
      attributes: {
        class: "min-h-[200px] p-3 text-sm text-foreground focus:outline-none prose prose-sm max-w-none"
      },
      handleKeyDown: (view, event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          const { state, dispatch } = view;
          const { from } = state.selection;
          const indent = "        ";
          dispatch(state.tr.insertText(indent, from));
          return true;
        }
        return false;
      }
    }
  });
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerBottom = containerRect.bottom;
    const toolbarHeight = 42;
    if (containerRect.top < 0 && containerBottom > toolbarHeight + 50) {
      if (!isToolbarFixed) {
        setToolbarWidth(containerRect.width);
        setIsToolbarFixed(true);
      }
    } else {
      if (isToolbarFixed) {
        setIsToolbarFixed(false);
      }
    }
  }, [isToolbarFixed]);
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [handleScroll]);
  useEffect(() => {
    if (!editor) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);
  const handleImageUpload = async (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
    if (!file || !editor) return;
    if (!file.type.startsWith("image/")) {
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${storageFolder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(storageBucket).upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
      editor.chain().focus().setImage({ src: data.publicUrl, alt: file.name }).run();
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  if (!editor) return null;
  const toolbarContent = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        size: "icon",
        variant: editor.isActive("bold") ? "default" : "ghost",
        className: "h-8 w-8",
        onClick: () => editor.chain().focus().toggleBold().run(),
        children: /* @__PURE__ */ jsx(Bold, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        size: "icon",
        variant: editor.isActive("italic") ? "default" : "ghost",
        className: "h-8 w-8",
        onClick: () => editor.chain().focus().toggleItalic().run(),
        children: /* @__PURE__ */ jsx(Italic, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        size: "icon",
        variant: editor.isActive("underline") ? "default" : "ghost",
        className: "h-8 w-8",
        onClick: () => editor.chain().focus().toggleUnderline().run(),
        children: /* @__PURE__ */ jsx(Underline$1, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "w-px h-6 bg-border mx-1" }),
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        size: "icon",
        variant: editor.isActive("heading", { level: 2 }) ? "default" : "ghost",
        className: "h-8 w-8 text-xs font-bold",
        onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        children: "H2"
      }
    ),
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        size: "icon",
        variant: editor.isActive("heading", { level: 3 }) ? "default" : "ghost",
        className: "h-8 w-8 text-xs font-bold",
        onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        children: "H3"
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "w-px h-6 bg-border mx-1" }),
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        size: "icon",
        variant: editor.isActive("bulletList") ? "default" : "ghost",
        className: "h-8 w-8",
        onClick: () => editor.chain().focus().toggleBulletList().run(),
        title: "Маркированный список",
        children: /* @__PURE__ */ jsx(List, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        size: "icon",
        variant: editor.isActive("orderedList") ? "default" : "ghost",
        className: "h-8 w-8",
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
        title: "Нумерованный список",
        children: /* @__PURE__ */ jsx(ListOrdered, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        size: "icon",
        variant: editor.isActive("blockquote") ? "default" : "ghost",
        className: "h-8 w-8",
        onClick: () => editor.chain().focus().toggleBlockquote().run(),
        title: "Цитата",
        children: /* @__PURE__ */ jsx(Quote, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "w-px h-6 bg-border mx-1" }),
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        size: "icon",
        variant: "ghost",
        className: "h-8 w-8",
        onClick: () => {
          var _a;
          return (_a = fileInputRef.current) == null ? void 0 : _a.click();
        },
        disabled: uploading,
        title: "Вставить изображение",
        children: uploading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(ImagePlus, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        accept: "image/*",
        className: "hidden",
        onChange: handleImageUpload
      }
    )
  ] });
  return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: "border border-input rounded-md bg-background relative", children: [
    isToolbarFixed && /* @__PURE__ */ jsx("div", { className: "h-[42px]" }),
    /* @__PURE__ */ jsx(
      "div",
      {
        ref: toolbarRef,
        className: `flex items-center gap-1 p-1 border-b border-input bg-muted/80 backdrop-blur-sm flex-wrap rounded-t-md z-50 ${isToolbarFixed ? "fixed top-0 shadow-md" : ""}`,
        style: isToolbarFixed ? { width: toolbarWidth } : void 0,
        children: toolbarContent
      }
    ),
    /* @__PURE__ */ jsx(EditorContent, { editor })
  ] });
};
export {
  RichTextEditor as R
};
