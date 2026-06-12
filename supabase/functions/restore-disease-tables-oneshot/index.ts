import { createClient } from 'npm:@supabase/supabase-js@2';
import fimoz from "./data/fimoz-u-malchikov.ts";
import kista from "./data/kista_semennogo_kanatika.ts";
import krip from "./data/kriptorhizm.ts";
import gin from "./data/ginekomastiya.ts";
import pri from "./data/priapizm-u-detey-i-podrostkov.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CONTENT: Record<string, string> = {
  'fimoz-u-malchikov': fimoz,
  'kista_semennogo_kanatika': kista,
  'kriptorhizm': krip,
  'ginekomastiya': gin,
  'priapizm-u-detey-i-podrostkov': pri,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const ONE_SHOT = 'restore-tables-2026-06-12-fk7Q9xZpL';
    if (req.headers.get('x-one-shot-token') !== ONE_SHOT) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const results: Array<{ slug: string; ok: boolean; len?: number; error?: string }> = [];
    for (const [slug, content] of Object.entries(CONTENT)) {
      const { error } = await admin.from('disease_articles')
        .update({ article_content: content, updated_at: new Date().toISOString() })
        .eq('slug', slug);
      if (error) results.push({ slug, ok: false, error: error.message });
      else results.push({ slug, ok: true, len: content.length });
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
