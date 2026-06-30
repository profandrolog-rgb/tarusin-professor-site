import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ContentEntityType = "blog_post" | "disease_article" | "research_article";

export interface ContentTranslation {
  id: string;
  entity_type: ContentEntityType;
  entity_id: string;
  locale: string;
  title: string | null;
  slug: string | null;
  description: string | null;
  content: string | null;
  card_annotation: string | null;
  keywords: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  status: "draft" | "published";
  auto_generated: boolean;
}

/**
 * Returns the published English translation for a given content row, or null
 * when none exists. `enabled=false` short-circuits the request (e.g. when the
 * current locale is Russian).
 */
export function useContentTranslation(
  entity_type: ContentEntityType,
  entity_id: string | null | undefined,
  enabled: boolean = true,
) {
  const [data, setData] = useState<ContentTranslation | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled && !!entity_id);

  useEffect(() => {
    if (!enabled || !entity_id) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: row } = await supabase
        .from("content_translations")
        .select("*")
        .eq("entity_type", entity_type)
        .eq("entity_id", entity_id)
        .eq("locale", "en")
        .eq("status", "published")
        .maybeSingle();
      if (cancelled) return;
      setData((row as ContentTranslation) ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [entity_type, entity_id, enabled]);

  return { translation: data, loading };
}
