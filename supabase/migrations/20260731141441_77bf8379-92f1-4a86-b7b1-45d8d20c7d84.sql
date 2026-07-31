CREATE TABLE public.assignment_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  item_text text NOT NULL,
  usage_count integer NOT NULL DEFAULT 1,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX assignment_library_cat_text_key
  ON public.assignment_library (category, lower(btrim(item_text)));
CREATE INDEX assignment_library_cat_usage_idx
  ON public.assignment_library (category, usage_count DESC);

GRANT SELECT, INSERT, UPDATE ON public.assignment_library TO authenticated;
GRANT DELETE ON public.assignment_library TO authenticated;
GRANT ALL ON public.assignment_library TO service_role;

ALTER TABLE public.assignment_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read assignment library"
  ON public.assignment_library FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Staff can add assignment library items"
  ON public.assignment_library FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Staff can update assignment library items"
  ON public.assignment_library FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins can delete assignment library items"
  ON public.assignment_library FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_assignment_library_updated_at
  BEFORE UPDATE ON public.assignment_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.remember_assignments(_items jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec jsonb;
  cat text;
  txt text;
  n integer := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR rec IN SELECT * FROM jsonb_array_elements(coalesce(_items, '[]'::jsonb))
  LOOP
    cat := btrim(coalesce(rec->>'category', ''));
    txt := btrim(coalesce(rec->>'item_text', ''));
    CONTINUE WHEN cat = '' OR txt = '' OR length(txt) > 2000;

    INSERT INTO public.assignment_library (category, item_text, created_by)
    VALUES (cat, txt, auth.uid())
    ON CONFLICT (category, lower(btrim(item_text)))
    DO UPDATE SET usage_count = public.assignment_library.usage_count + 1,
                  last_used_at = now(),
                  updated_at = now();
    n := n + 1;
  END LOOP;

  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remember_assignments(jsonb) TO authenticated;