ALTER TABLE public.operations_journal
  ADD COLUMN postop_course text,
  ADD COLUMN complications text,
  ADD COLUMN child_notes text,
  ADD COLUMN parent_notes text,
  ADD COLUMN communication_notes text;