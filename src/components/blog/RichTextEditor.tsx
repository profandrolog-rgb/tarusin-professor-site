import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { Bold, Italic, Underline as UnderlineIcon, ImagePlus, Loader2, List, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  storageBucket?: string;
  storageFolder?: string;
}

const RichTextEditor = ({ content, onChange, placeholder, storageBucket = "disease-media", storageFolder = "article-images" }: RichTextEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isToolbarFixed, setIsToolbarFixed] = useState(false);
  const [toolbarWidth, setToolbarWidth] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, codeBlock: false }),
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] p-3 text-sm text-foreground focus:outline-none prose prose-sm max-w-none",
      },
      handleKeyDown: (view, event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          const { state, dispatch } = view;
          const { from } = state.selection;
          const indent = "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0";
          dispatch(state.tr.insertText(indent, from));
          return true;
        }
        return false;
      },
    },
  });

  // Sticky toolbar logic using scroll listener
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerBottom = containerRect.bottom;
    const toolbarHeight = 42;
    
    // Fix toolbar when container top goes above viewport, but container bottom is still visible
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
    // Sync external content changes (e.g. when arriving from Orchestrator)
    // without disrupting user typing — only update if the HTML differs.
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content || "", false);
    }
  }, [content, editor]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

  const toolbarContent = (
    <>
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("bold") ? "default" : "ghost"}
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("italic") ? "default" : "ghost"}
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("underline") ? "default" : "ghost"}
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        size="icon"
        variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
        className="h-8 w-8 text-xs font-bold"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </Button>
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
        className="h-8 w-8 text-xs font-bold"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        size="icon"
        variant={editor.isActive("bulletList") ? "default" : "ghost"}
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Маркированный список"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("orderedList") ? "default" : "ghost"}
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Нумерованный список"
      >
        <ListOrdered className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        title="Вставить изображение"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </>
  );

  return (
    <div ref={containerRef} className="border border-input rounded-md bg-background relative">
      {/* Spacer when toolbar is fixed */}
      {isToolbarFixed && <div className="h-[42px]" />}
      
      {/* Toolbar */}
      <div
        ref={toolbarRef}
        className={`flex items-center gap-1 p-1 border-b border-input bg-muted/80 backdrop-blur-sm flex-wrap rounded-t-md z-50 ${
          isToolbarFixed ? "fixed top-0 shadow-md" : ""
        }`}
        style={isToolbarFixed ? { width: toolbarWidth } : undefined}
      >
        {toolbarContent}
      </div>
      
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
