import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { Bold, Italic, Underline as UnderlineIcon, ImagePlus, Loader2, List, ListOrdered, Quote, Images, SpellCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GalleryPlaceholder } from "@/components/parents/tiptap/GalleryPlaceholderNode";
import SpellCheckPanel, { type SpellIssue } from "@/components/blog/SpellCheckPanel";
import { toast } from "sonner";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  storageBucket?: string;
  storageFolder?: string;
  /** Даёт родителю доступ к экземпляру редактора для вставки в позицию курсора. */
  onEditorReady?: (editor: Editor | null) => void;
  /** Показывать кнопку «Галерея» и обрабатывать вставку блока-заполнителя. */
  onInsertGalleryClick?: () => void;
}

const RichTextEditor = ({ content, onChange, placeholder, storageBucket = "disease-media", storageFolder = "article-images", onEditorReady, onInsertGalleryClick }: RichTextEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isToolbarFixed, setIsToolbarFixed] = useState(false);
  const [toolbarWidth, setToolbarWidth] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const uploadAndInsertImage = useCallback(async (file: File, editorInstance: ReturnType<typeof useEditor>) => {
    if (!editorInstance) return;
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || file.type.split("/").pop() || "png").toLowerCase();
      const path = `${storageFolder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(storageBucket).upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
      editorInstance.chain().focus().setImage({ src: data.publicUrl, alt: file.name || "image" }).run();
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploading(false);
    }
  }, [storageBucket, storageFolder]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, codeBlock: false }),
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      GalleryPlaceholder,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] p-3 text-sm text-foreground focus:outline-none prose prose-sm max-w-none",
        spellcheck: "false",
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
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          if (it.kind === "file" && it.type.startsWith("image/")) {
            const file = it.getAsFile();
            if (file) {
              event.preventDefault();
              void uploadAndInsertImage(file, editor);
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = (event as DragEvent).dataTransfer?.files;
        if (!files || !files.length) return false;
        const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (!imgs.length) return false;
        event.preventDefault();
        for (const f of imgs) void uploadAndInsertImage(f, editor);
        return true;
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
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  useEffect(() => {
    if (!onEditorReady) return;
    onEditorReady(editor ?? null);
    return () => onEditorReady(null);
  }, [editor, onEditorReady]);

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

      <Button
        type="button"
        size="icon"
        variant={editor.isActive("blockquote") ? "default" : "ghost"}
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Цитата"
      >
        <Quote className="w-4 h-4" />
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

      {onInsertGalleryClick && (
        <>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onInsertGalleryClick}
            title="Вставить галерею в позицию курсора"
          >
            <Images className="w-4 h-4" />
          </Button>
        </>
      )}
    </>
  );


  return (
    <div
      ref={containerRef}
      className={`border rounded-md bg-background relative transition-colors ${
        dragOver ? "border-primary ring-2 ring-primary/40 bg-primary/5" : "border-input"
      }`}
      onDragOver={(e) => {
        if (e.dataTransfer?.types?.includes("Files")) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragOver(false);
      }}
      onDrop={(e) => {
        setDragOver(false);
        // Если событие уже обработано Tiptap (editorProps.handleDrop → preventDefault),
        // не запускаем повторную загрузку — иначе одна картинка окажется в статье дважды.
        if (e.defaultPrevented) return;
        const files = e.dataTransfer?.files;
        if (!files || !files.length) return;
        const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (!imgs.length) return;
        e.preventDefault();
        for (const f of imgs) void uploadAndInsertImage(f, editor);
      }}


    >
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

      {dragOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-[1px] rounded-md">
          <div className="text-sm font-medium text-primary bg-background/90 border border-primary/40 rounded-md px-3 py-1.5 shadow">
            Отпустите — изображение загрузится в статью
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
