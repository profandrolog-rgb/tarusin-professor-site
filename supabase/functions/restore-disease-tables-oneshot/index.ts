import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SLUGS = [
  'fimoz-u-malchikov',
  'kista_semennogo_kanatika',
  'kriptorhizm',
  'ginekomastiya',
  'priapizm-u-detey-i-podrostkov',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // One-shot token guard (function is deleted right after use)
    const ONE_SHOT = 'restore-tables-2026-06-12-fk7Q9xZpL';
    const provided = req.headers.get('x-one-shot-token');
    if (provided !== ONE_SHOT) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }



    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const results: Array<{ slug: string; ok: boolean; len?: number; error?: string }> = [];
    for (const slug of SLUGS) {
      try {
        const url = new URL(`./data/${slug}.md`, import.meta.url);
        const content = await Deno.readTextFile(url);
        const { error } = await admin.from('disease_articles')
          .update({ article_content: content, updated_at: new Date().toISOString() })
          .eq('slug', slug);
        if (error) results.push({ slug, ok: false, error: error.message });
        else results.push({ slug, ok: true, len: content.length });
      } catch (e) {
        results.push({ slug, ok: false, error: String((e as any)?.message || e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
