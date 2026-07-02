import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  article: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    thumbnail_path?: string | null;
    category: string;
  };
  featured?: boolean;
  categoryLabel?: string;
}

const DiseaseBentoCard = ({ article, featured, categoryLabel }: Props) => {
  const thumb = article.thumbnail_path
    ? supabase.storage.from("disease-media").getPublicUrl(article.thumbnail_path).data.publicUrl
    : null;

  return (
    <Link
      to={`/for-parents/${article.slug}/`}
      className={`group relative block overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 ease-out will-change-transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        featured ? "md:col-span-2 md:row-span-2 min-h-[260px]" : "min-h-[160px]"
      }`}
    >
      {thumb && (
        <img
          src={thumb}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity duration-300 group-hover:opacity-50"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/70 to-background/30" />
      <div className={`relative flex h-full flex-col justify-between gap-3 p-5 ${featured ? "md:p-7" : ""}`}>
        {categoryLabel && (
          <Badge variant="secondary" className="w-fit text-xs">
            {categoryLabel}
          </Badge>
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
