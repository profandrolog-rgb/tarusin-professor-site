// One-shot atomic merge of duplicate repertory_remedies entries.
// Triggered manually by an admin. Runs the entire merge in a single transaction
// via a server-side DO block over a direct Postgres connection (bypasses the
// PostgREST 30s migration API limit).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const DB_URL = Deno.env.get("SUPABASE_DB_URL")!;

async function isAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  const cli = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await cli.auth.getUser();
  if (!user) return false;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data } = await admin.from("user_roles")
    .select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  return !!data;
}

const MERGE_SQL = `
DO $$
DECLARE
  v_pairs int;
  v_links_deleted int;
  v_links_rewired int;
  v_remedies_deleted int;
BEGIN
  -- Build canonical map: old_id (kent-andrology, keep) -> new_id (oorep, drop)
  CREATE TEMP TABLE _merge_map (
    old_id uuid PRIMARY KEY,
    new_id uuid UNIQUE NOT NULL
  ) ON COMMIT DROP;

  -- Auto: same normalized slug (lower + strip trailing dot)
  INSERT INTO _merge_map (old_id, new_id)
  SELECT o.id, n.id
  FROM repertory_remedies o
  JOIN repertory_remedies n
    ON lower(regexp_replace(o.slug, '\\.$', '')) = lower(regexp_replace(n.slug, '\\.$', ''))
   AND o.id <> n.id
  WHERE o.repertory_id = 'kent-andrology'
    AND n.repertory_id = 'oorep-publicum'
  ON CONFLICT DO NOTHING;

  -- Manual 3: agn. <- agnus, bar-c <- baryta-c, acon <- aco
  INSERT INTO _merge_map (old_id, new_id)
  SELECT
    (SELECT id FROM repertory_remedies WHERE slug = m.old_slug AND repertory_id = 'kent-andrology'),
    (SELECT id FROM repertory_remedies WHERE slug = m.new_slug AND repertory_id = 'oorep-publicum')
  FROM (VALUES
    ('agnus','agn.'),
    ('baryta-c','bar-c'),
    ('aco','acon')
  ) m(old_slug, new_slug)
  WHERE (SELECT id FROM repertory_remedies WHERE slug = m.old_slug AND repertory_id = 'kent-andrology') IS NOT NULL
    AND (SELECT id FROM repertory_remedies WHERE slug = m.new_slug AND repertory_id = 'oorep-publicum') IS NOT NULL
  ON CONFLICT DO NOTHING;

  SELECT count(*) INTO v_pairs FROM _merge_map;
  RAISE NOTICE 'merge pairs: %', v_pairs;

  -- Sanity: no id appears on both sides
  IF EXISTS (
    SELECT 1 FROM _merge_map a JOIN _merge_map b ON a.new_id = b.old_id
  ) THEN
    RAISE EXCEPTION 'transitive reference in merge map';
  END IF;

  -- Step 1: delete rubric_remedies links on new_id side that would collide on (rubric, old_id, repertory_id).
  -- For genuine duplicates with same repertory_id source we keep the higher grade on the old side first.
  -- But since old links are 'kent-andrology' and new links are 'oorep-publicum', they have DIFFERENT repertory_id,
  -- so the unique key (rubric_id, remedy_id, repertory_id) will NOT collide after rewiring remedy_id.
  -- Therefore we only need to handle the rare case where the SAME (rubric, repertory) pair already references old_id.
  WITH collide AS (
    SELECT n.id AS link_id
    FROM repertory_rubric_remedies n
    JOIN _merge_map m ON m.new_id = n.remedy_id
    WHERE EXISTS (
      SELECT 1 FROM repertory_rubric_remedies o
      WHERE o.remedy_id = m.old_id
        AND o.rubric_id = n.rubric_id
        AND o.repertory_id = n.repertory_id
    )
  )
  DELETE FROM repertory_rubric_remedies r
  USING collide WHERE r.id = collide.link_id;
  GET DIAGNOSTICS v_links_deleted = ROW_COUNT;
  RAISE NOTICE 'collision links deleted: %', v_links_deleted;

  -- Step 2: rewire remaining links from new_id -> old_id
  UPDATE repertory_rubric_remedies r
  SET remedy_id = m.old_id
  FROM _merge_map m
  WHERE r.remedy_id = m.new_id;
  GET DIAGNOSTICS v_links_rewired = ROW_COUNT;
  RAISE NOTICE 'links rewired: %', v_links_rewired;

  -- Step 3: rewire other FK references (idempotent)
  UPDATE treatment_catalog SET repertory_remedy_id = m.old_id
  FROM _merge_map m WHERE treatment_catalog.repertory_remedy_id = m.new_id;

  -- (treatment_plan_items / protocol_template_items don't reference repertory_remedies directly per prior analysis)

  -- Step 4: delete duplicate remedy rows
  DELETE FROM repertory_remedies r USING _merge_map m WHERE r.id = m.new_id;
  GET DIAGNOSTICS v_remedies_deleted = ROW_COUNT;
  RAISE NOTICE 'remedies deleted: %', v_remedies_deleted;

  IF v_remedies_deleted <> v_pairs THEN
    RAISE EXCEPTION 'mismatch: deleted % vs pairs %', v_remedies_deleted, v_pairs;
  END IF;
END $$;
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!await isAdmin(req)) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = new Client(DB_URL);
    await client.connect();
    try {
      await client.queryArray("BEGIN");
      const notices: string[] = [];
      // capture NOTICE via connection events is non-trivial; rely on post-checks
      await client.queryArray(MERGE_SQL);

      const before = await client.queryObject<{ c: bigint }>("SELECT count(*)::bigint AS c FROM repertory_remedies");
      const dupes = await client.queryObject<{ c: bigint }>(
        `WITH n AS (SELECT lower(regexp_replace(slug, '\\.$', '')) AS nslug FROM repertory_remedies)
         SELECT count(*)::bigint AS c FROM (SELECT nslug FROM n GROUP BY nslug HAVING count(*) > 1) x`
      );
      const total_links = await client.queryObject<{ c: bigint }>("SELECT count(*)::bigint AS c FROM repertory_rubric_remedies");

      if (Number(dupes.rows[0].c) > 0) {
        await client.queryArray("ROLLBACK");
        return new Response(JSON.stringify({
          ok: false, error: "duplicates remain after merge, rolled back",
          remedies: Number(before.rows[0].c), duplicates: Number(dupes.rows[0].c),
        }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await client.queryArray("COMMIT");
      return new Response(JSON.stringify({
        ok: true,
        remedies_total: Number(before.rows[0].c),
        normalized_slug_duplicates: Number(dupes.rows[0].c),
        rubric_remedy_links: Number(total_links.rows[0].c),
        notices,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e) {
      try { await client.queryArray("ROLLBACK"); } catch (_) { /* ignore */ }
      throw e;
    } finally {
      await client.end();
    }
  } catch (e) {
    console.error("merge error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
