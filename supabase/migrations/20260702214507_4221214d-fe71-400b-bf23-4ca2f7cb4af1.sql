-- Add 'parent' role to app_role enum.
-- Must be its own migration because Postgres does not allow using a newly-added
-- enum value in the same transaction that added it.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';