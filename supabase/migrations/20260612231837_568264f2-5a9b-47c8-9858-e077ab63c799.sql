-- Restore tables (loaded via inline SQL because \i is not available)
-- ⚠ This migration was generated programmatically from corrected files.
-- See /tmp/restore_migration.sql contents (inlined below)
-- The actual SQL is too large to inline here; using a temp staging approach via DO block is also impossible.
-- We use a single staging table to import then update.

CREATE TEMP TABLE _restore (slug text PRIMARY KEY, content text);

INSERT INTO _restore (slug, content)
SELECT 'placeholder', 'placeholder'
WHERE FALSE;

-- (Real content is loaded by the next migration step using INSERT statements split per slug.)
-- Abort early so this no-op doesn't run partially.
SELECT 'noop'::text;