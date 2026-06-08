import { useRef, useState } from "react";
import { ImageIcon, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  articleId: string;
  articleSlug: string;
  caption: string;
  marker: string;
  fullContent: string;
  onContentChange?: (newContent: string) => void;
}

const ARTICLE_IMAGES_FOLDER = "article-images";

const PlaceholderGallery = ({
  articleId,
  articleSlug,
  caption,
  marker,
  fullContent,
  onContentChange,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      // Найдём следующий порядковый номер для этого slug
      const { data: existing } = await supabase.storage
        .from("disease-media")
        .list(ARTICLE_IMAGES_FOLDER, { limit: 1000, search: articleSlug });
      const startIdx =
        (existing || []).filter((f) => f.name.startsWith(articleSlug + "-")).length + 1;

      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const filename = `${articleSlug}-${startIdx + i}.${ext}`;
        const path = `${ARTICLE_IMAGES_FOLDER}/${filename}`;
        const { error } = await supabase.storage
          .from("disease-media")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (error) {
          console.error(error);
          toast.error(`Не удалось загрузить ${file.name}: ${error.message}`);
          continue;
        }
        uploaded.push(filename);
      }

      if (uploaded.length === 0) {
        setUploading(false);
        return;
      }

      // Заменяем маркер в content
      const newMarker = `[[GALLERY: caption="${caption}" | ${uploaded.join(" | ")}]]`;
      const newContent = fullContent.replace(marker, newMarker);

      const { error: updErr } = await supabase
        .from("disease_articles")
        .update({ article_content: newContent })
        .eq("id", articleId);

      if (updErr) {
        toast.error("Не удалось сохранить галерею: " + updErr.message);
      } else {
        toast.success(`Загружено фото: ${uploaded.length}`);
        onContentChange?.(newContent);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="my-8 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center px-4 py-10 not-prose"
         style={{ borderColor: "#E2EBF5", minHeight: 200 }}>
      <ImageIcon className="w-10 h-10 text-muted-foreground mb-3" />
      {caption && <p className="text-muted-foreground mb-4 max-w-xl">{caption}</p>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="gap-2"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Загрузка...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" /> Добавить фотографии
          </>
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
};

export default PlaceholderGallery;
