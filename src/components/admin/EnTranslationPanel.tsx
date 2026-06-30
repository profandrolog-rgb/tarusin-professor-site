import { useEffect, useState } from "react";
import { Loader2, Languages, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  entity_type: "blog_post" | "disease_article" | "research_article";
  entity_id: string | null;
}

interface TrRow {
  id?: string;
  title: string;
  slug: string;
  description: string;
  card_annotation: string;
  content: string;
  keywords: string[];
  seo_title: string;
  seo_description: string;
  status: "draft" | "published";
}

const empty: TrRow = {
  title: "",
  slug: "",
  description: "",
  card_annotation: "",
  content: "",
  keywords: [],
  seo_title: "",
  seo_description: "",
  status: "draft",
};

/**
 * EN translation editor — pinned to a single source row. Lets the editor:
 *  - auto-translate the source via `translate-content` (one click);
 *  - hand-edit every field (SEO title, SEO description, keywords, annotation, body);
 *  - publish / unpublish the EN version.
 */
export default function EnTranslationPanel({ entity_type, entity_id }: Props) {
  const [row, setRow] = useState<TrRow>(empty);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (!entity_id) {
      setRow(empty);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("content_translations")
        .select("*")
        .eq("entity_type", entity_type)
        .eq("entity_id", entity_id)
        .eq("locale", "en")
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setRow({
          id: data.id,
          title: data.title || "",
          slug: data.slug || "",
          description: data.description || "",
          card_annotation: data.card_annotation || "",
          content: data.content || "",
          keywords: data.keywords || [],
          seo_title: data.seo_title || "",
          seo_description: data.seo_description || "",
          status: (data.status as any) || "draft",
        });
      } else {
        setRow(empty);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [entity_type, entity_id]);

  async function autoTranslate() {
    if (!entity_id) {
      toast.error("Сначала сохраните русскую версию статьи");
      return;
    }
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-content", {
        body: { entity_type, entity_id, publish: row.status === "published" },
      });
      if (error) throw error;
      const t = data?.translation;
      if (!t) throw new Error("Empty response");
      setRow({
        id: t.id,
        title: t.title || "",
        slug: t.slug || "",
        description: t.description || "",
        card_annotation: t.card_annotation || "",
        content: t.content || "",
        keywords: t.keywords || [],
        seo_title: t.seo_title || "",
        seo_description: t.seo_description || "",
        status: (t.status as any) || "draft",
      });
      toast.success("Перевод готов и сохранён как черновик");
    } catch (e: any) {
      toast.error("Не удалось перевести", { description: e?.message || String(e) });
    } finally {
      setTranslating(false);
    }
  }

  async function save(nextStatus?: "draft" | "published") {
    if (!entity_id) {
      toast.error("Сначала сохраните русскую версию статьи");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        entity_type,
        entity_id,
        locale: "en",
        title: row.title || null,
        slug: row.slug || null,
        description: row.description || null,
        card_annotation: row.card_annotation || null,
        content: row.content || null,
        keywords: row.keywords,
        seo_title: row.seo_title || null,
        seo_description: row.seo_description || null,
        status: nextStatus || row.status,
        auto_generated: false,
      };
      const { data, error } = await supabase
        .from("content_translations")
        .upsert(payload, { onConflict: "entity_type,entity_id,locale" })
        .select()
        .single();
      if (error) throw error;
      setRow((cur) => ({ ...cur, id: data.id, status: (data.status as any) }));
      toast.success(
        nextStatus === "published"
          ? "Английская версия опубликована"
          : nextStatus === "draft"
          ? "Снято с публикации"
          : "Сохранено",
      );
    } catch (e: any) {
      toast.error("Не удалось сохранить", { description: e?.message || String(e) });
    } finally {
      setSaving(false);
    }
  }

  if (!entity_id) {
    return (
      <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg">
        Сохраните русскую версию, чтобы добавить английский перевод.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-primary" />
          <span className="font-medium">English version</span>
          <Badge variant={row.status === "published" ? "default" : "outline"}>
            {row.status === "published" ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={autoTranslate} disabled={translating || loading}>
            {translating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Languages className="w-4 h-4 mr-2" />}
            Auto-translate
          </Button>
          <Button size="sm" variant="outline" onClick={() => save()} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save draft
          </Button>
          {row.status === "published" ? (
            <Button size="sm" variant="outline" onClick={() => save("draft")} disabled={saving}>
              <EyeOff className="w-4 h-4 mr-2" /> Unpublish
            </Button>
          ) : (
            <Button size="sm" onClick={() => save("published")} disabled={saving}>
              <Eye className="w-4 h-4 mr-2" /> Publish EN
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label className="text-xs">EN title</Label>
          <Input value={row.title} onChange={(e) => setRow({ ...row, title: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">EN slug</Label>
          <Input value={row.slug} onChange={(e) => setRow({ ...row, slug: e.target.value })} placeholder="varicocele-in-adolescents" />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">SEO title (&lt;60 chars)</Label>
          <Input value={row.seo_title} onChange={(e) => setRow({ ...row, seo_title: e.target.value })} maxLength={70} />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">SEO description (&lt;155 chars)</Label>
          <Textarea
            rows={2}
            value={row.seo_description}
            onChange={(e) => setRow({ ...row, seo_description: e.target.value })}
            maxLength={200}
          />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Keywords (comma-separated — for &lt;meta name="keywords"&gt;)</Label>
          <Input
            value={row.keywords.join(", ")}
            onChange={(e) =>
              setRow({
                ...row,
                keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean),
              })
            }
            placeholder="pediatric urology, varicocele, adolescent fertility"
          />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Short description</Label>
          <Textarea rows={2} value={row.description} onChange={(e) => setRow({ ...row, description: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Card annotation (shown under the card title)</Label>
          <Textarea
            rows={2}
            maxLength={200}
            value={row.card_annotation}
            onChange={(e) => setRow({ ...row, card_annotation: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">EN content (markdown / HTML — same formatting as RU)</Label>
          <Textarea
            rows={16}
            className="font-mono text-sm"
            value={row.content}
            onChange={(e) => setRow({ ...row, content: e.target.value })}
          />
        </div>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Загружаем перевод…
        </div>
      )}
    </div>
  );
}
