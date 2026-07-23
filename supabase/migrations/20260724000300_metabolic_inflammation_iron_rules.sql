-- Restore visible severity for measured ferritin/serum iron deviations.
-- Idempotent: do not duplicate rules on repeated migration runs.
UPDATE public.pathways
SET rules = rules || '[{"code":"ferritin_high","highlight_nodes":["ferritin_store"],"raises_to":"mild","when":{"op":">","test_code":"FERR","value_from_ref":"high"}}]'::jsonb,
    updated_at = now()
WHERE slug = 'inflammation'
  AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(rules) r WHERE r->>'code' = 'ferritin_high');

UPDATE public.pathways
SET rules = rules || '[{"code":"iron_low","highlight_nodes":["serum_iron"],"raises_to":"mild","when":{"op":"<","test_code":"IRON","value_from_ref":"low"}}]'::jsonb,
    updated_at = now()
WHERE slug = 'iron'
  AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(rules) r WHERE r->>'code' = 'iron_low');
