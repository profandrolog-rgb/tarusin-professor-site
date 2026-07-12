import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import BentoImageCell, { type BentoImageData } from "./BentoImageCell";

interface Props {
  article: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    thumbnail_path?: string | null;
    category: string;
    bento_image_1?: BentoImageData | null;
    bento_image_2?: BentoImageData | null;
    bento_image_3?: BentoImageData | null;
  };
  featured?: boolean;
  categoryLabel?: string;
}

const DiseaseBentoCard = ({ article, featured, categoryLabel }: Props) => {
  const thumb = article.thumbnail_path
    ? supabase.storage.from("disease-media").getPublicUrl(article.thumbnail_path).data.publicUrl
    : null;

  const cells = [article.bento_image_1, article.bento_image_2, article.bento_image_3];
  const hasCells = featured && cells.some((c) => c?.path);

  return (
    <Link
      to={`/for-parents/${article.slug}/`}
      className={`group relative block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_4px_14px_-4px_rgba(0,0,0,0.25),0_0_0_1px_rgba(59,130,246,0.12)] ring-1 ring-blue-500/15 transition-all duration-300 ease-out will-change-transform hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_12px_28px_-8px_rgba(37,99,235,0.25),0_0_0_1px_rgba(59,130,246,0.35)] hover:ring-blue-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        featured ? "md:col-span-2 md:row-span-2 min-h-[280px]" : "min-h-[160px]"
      }`}
    >
      {thumb && (
        <img
          src={thumb}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-25 transition-opacity duration-300 group-hover:opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/75 to-background/30" />

      <div className={`relative flex h-full flex-col gap-3 p-5 ${featured ? "md:p-6" : ""}`}>
        {categoryLabel && (
          <Badge variant="secondary" className="w-fit text-xs shadow-sm">
            {categoryLabel}
          </Badge>
        )}

        {hasCells && (
          <div className="grid grid-cols-3 gap-2 mt-1">
            {cells.map((cell, i) => (
              <BentoImageCell
                key={i}
                image={cell}
                className="aspect-square shadow-md ring-1 ring-border/70"
                rounded="rounded-xl"
              />
            ))}
          </div>
        )}

        <div className="mt-auto">
          <h3
            className={`font-semibold text-foreground group-hover:text-primary transition-colors ${
              featured ? "text-xl md:text-2xl" : "text-base"
            }`}
          >
            {article.title}
          </h3>
          {featured && article.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{article.description}</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default DiseaseBentoCard;
